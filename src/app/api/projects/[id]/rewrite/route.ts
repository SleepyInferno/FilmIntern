import { streamText, generateObject, APICallError, LoadAPIKeyError, NoSuchModelError } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings, getLightModelForSettings, checkProviderHealth } from '@/lib/ai/provider-registry';
import {
  bibleExtractionSystemPrompt,
  buildBibleExtractionUserPrompt,
  fullRewriteSystemPrompt,
  buildFullRewriteUserPrompt,
  supervisorSystemPrompt,
  buildSupervisorUserPrompt,
  bibleSchema,
  validationSchema,
} from '@/lib/ai/prompts/full-rewrite';
import { harshCriticSystemPrompt } from '@/lib/ai/prompts/harsh-critic';
import { db } from '@/lib/db';

export const maxDuration = 600;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Parse optional body (notes, extreme mode)
  let notes = '';
  let extreme = false;
  try {
    const body = await req.json();
    notes = (body?.notes as string) || '';
    extreme = body?.extreme === true;
  } catch {
    // No body or invalid JSON — proceed with defaults
  }

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  if (!project.criticAnalysis) {
    return Response.json(
      { error: 'Run a Harsh Critic analysis first before generating a full rewrite.' },
      { status: 400 }
    );
  }

  let scriptText = '';
  if (project.uploadData) {
    try {
      const parsed = JSON.parse(project.uploadData);
      scriptText = parsed?.text ?? '';
    } catch { /* ignore */ }
  }

  if (!scriptText) {
    return Response.json(
      { error: 'No script text found for this project.' },
      { status: 400 }
    );
  }

  const settings = await loadSettings();

  const health = await checkProviderHealth(settings);
  if (!health.ok) {
    return Response.json({ error: health.error }, { status: 503 });
  }

  try {
    const { registry, modelId } = getModelForSettings(settings);
    const { modelId: lightModelId } = getLightModelForSettings(settings);
    const primaryModel = registry.languageModel(modelId);
    const lightModel = registry.languageModel(lightModelId);
    const encoder = new TextEncoder();

    const anthropicOpts = settings.provider === 'anthropic' ? {
      providerOptions: {
        anthropic: { thinking: { type: 'disabled' as const } },
      },
    } : {};

    const structuredOpts = settings.provider === 'anthropic' ? {
      providerOptions: {
        anthropic: { structuredOutputMode: 'auto' as const },
      },
    } : {};

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
        };

        try {
          // ── Phase 1: Bible extraction (light model) ───────────────
          send({ phase: 'extracting', message: 'Analyzing characters and story beats...' });

          const bibleResult = await generateObject({
            model: lightModel,
            schema: bibleSchema,
            system: bibleExtractionSystemPrompt,
            prompt: buildBibleExtractionUserPrompt(scriptText, project.projectType),
            ...structuredOpts,
          });

          const bible = bibleResult.object;
          send({ phase: 'bible', data: bible });

          // ── Phase 2: Rewrite (primary model) ──────────────────────
          send({ phase: 'rewriting', message: 'Rewriting script...' });

          const criticNotes = project.criticAnalysis!;

          const rewriteUserPrompt = buildFullRewriteUserPrompt(
            scriptText,
            criticNotes,
            project.projectType,
            bible,
            notes || undefined,
          );

          const rewriteResult = streamText({
            model: primaryModel,
            system: fullRewriteSystemPrompt,
            prompt: rewriteUserPrompt,
            ...anthropicOpts,
            onError({ error }) {
              console.error('Full rewrite streaming error:', error);
            },
          });

          let fullRewriteText = '';
          for await (const chunk of rewriteResult.textStream) {
            fullRewriteText += chunk;
            send({ phase: 'chunk', text: chunk });
          }

          // ── Phase 3: Supervisor validation (light model) ──────────
          send({ phase: 'validating', message: 'Running supervisor check...' });

          const validationResult = await generateObject({
            model: lightModel,
            schema: validationSchema,
            system: supervisorSystemPrompt,
            prompt: buildSupervisorUserPrompt(scriptText, fullRewriteText, bible, criticNotes),
            ...structuredOpts,
          });

          send({ phase: 'validation', data: validationResult.object });

          // ── Extreme mode: re-critique → rewrite again ─────────────
          if (extreme) {
            send({ phase: 'recritiquing', message: 'Re-running Harsh Critic on rewrite...' });

            const reCritiqueResult = streamText({
              model: primaryModel,
              system: harshCriticSystemPrompt,
              prompt: `Project type: ${project.projectType}\n\nAnalyze this material with your harshest critical lens:\n\n${fullRewriteText}`,
              ...anthropicOpts,
              onError({ error }) {
                console.error('Re-critique streaming error:', error);
              },
            });

            let reCritiqueText = '';
            for await (const chunk of reCritiqueResult.textStream) {
              reCritiqueText += chunk;
            }

            send({ phase: 'recritique', data: { critique: reCritiqueText } });

            // Second rewrite with combined critique
            send({ phase: 'rewriting2', message: 'Rewriting with new findings...' });

            const combinedCritique = `## ORIGINAL CRITIC ANALYSIS\n\n${criticNotes}\n\n---\n\n## RE-CRITIQUE OF FIRST REWRITE (Fix These Remaining Issues)\n\n${reCritiqueText}`;

            const rewrite2UserPrompt = buildFullRewriteUserPrompt(
              scriptText,
              combinedCritique,
              project.projectType,
              bible,
              notes || undefined,
            );

            const rewrite2Result = streamText({
              model: primaryModel,
              system: fullRewriteSystemPrompt,
              prompt: rewrite2UserPrompt,
              ...anthropicOpts,
              onError({ error }) {
                console.error('Extreme rewrite pass 2 streaming error:', error);
              },
            });

            fullRewriteText = '';
            for await (const chunk of rewrite2Result.textStream) {
              fullRewriteText += chunk;
              send({ phase: 'chunk2', text: chunk });
            }

            // Final validation
            send({ phase: 'validating2', message: 'Final supervisor check...' });

            const finalValidation = await generateObject({
              model: lightModel,
              schema: validationSchema,
              system: supervisorSystemPrompt,
              prompt: buildSupervisorUserPrompt(scriptText, fullRewriteText, bible, combinedCritique),
              ...structuredOpts,
            });

            send({ phase: 'validation2', data: finalValidation.object });
          }

          send({ phase: 'complete' });
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during rewrite';
          send({ phase: 'error', message: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    if (LoadAPIKeyError.isInstance(error)) {
      return Response.json(
        { error: `API key not configured for ${settings.provider}. Go to Settings to add your key.` },
        { status: 401 }
      );
    }
    if (APICallError.isInstance(error)) {
      if ((error as { statusCode?: number }).statusCode === 401) {
        return Response.json(
          { error: `Invalid API key for ${settings.provider}. Check your key in Settings.` },
          { status: 401 }
        );
      }
      return Response.json(
        { error: `Provider ${settings.provider} returned an error: ${(error as Error).message}` },
        { status: 502 }
      );
    }
    if (NoSuchModelError.isInstance(error)) {
      return Response.json(
        { error: 'Model not found. Check your model name in Settings.' },
        { status: 400 }
      );
    }
    return Response.json(
      { error: 'Rewrite generation failed. Check provider settings and try again.' },
      { status: 500 }
    );
  }
}

/** GET: retrieve a previously saved full rewrite */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  return Response.json({ fullRewrite: project.fullRewrite ?? null });
}

/** PUT: save the completed full rewrite to the project */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const fullRewrite = body?.fullRewrite as string | undefined;

  if (typeof fullRewrite !== 'string') {
    return Response.json({ error: 'fullRewrite string required' }, { status: 400 });
  }

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  db.updateProject(id, { fullRewrite });
  return Response.json({ ok: true });
}
