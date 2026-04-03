import { streamText, APICallError, LoadAPIKeyError, NoSuchModelError } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings, checkProviderHealth } from '@/lib/ai/provider-registry';
import { fullRewriteSystemPrompt, buildFullRewriteUserPrompt } from '@/lib/ai/prompts/full-rewrite';
import { db } from '@/lib/db';

export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // Extract script text
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

    const userPrompt = buildFullRewriteUserPrompt(
      scriptText,
      project.criticAnalysis,
      project.projectType
    );

    const result = streamText({
      model: registry.languageModel(modelId),
      system: fullRewriteSystemPrompt,
      prompt: userPrompt,
      ...(settings.provider === 'anthropic' ? {
        providerOptions: {
          anthropic: { thinking: { type: 'disabled' as const } },
        },
      } : {}),
      onError({ error }) {
        console.error('Full rewrite streaming error:', error);
      },
    });

    return result.toTextStreamResponse();
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
