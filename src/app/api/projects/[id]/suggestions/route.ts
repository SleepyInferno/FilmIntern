import { generateObject } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings, checkProviderHealth } from '@/lib/ai/provider-registry';
import { db, generateId } from '@/lib/db';
import { extractWeaknesses, extractCriticWeaknesses, suggestionConfig, type WeaknessTarget } from '@/lib/suggestions';
import { suggestionSchema } from '@/lib/ai/schemas/suggestion';

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { count = 10, analysisType = 'standard' } = await req.json();
  const clampedCount = Math.min(Math.max(1, count), 25);
  const useCritic = analysisType === 'critic';

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  if (!project.analysisData) {
    return Response.json({ error: 'No analysis data. Run an analysis first.' }, { status: 400 });
  }
  if (useCritic && !project.criticAnalysis) {
    return Response.json({ error: 'No critic analysis found. Run the Harsh Critic analysis first.' }, { status: 400 });
  }

  const settings = await loadSettings();
  const health = await checkProviderHealth(settings);
  if (!health.ok) {
    return Response.json({ error: health.error }, { status: 503 });
  }

  const config = suggestionConfig[project.projectType];
  if (!config) {
    return Response.json({ error: `Unsupported project type: ${project.projectType}` }, { status: 400 });
  }

  let targets: WeaknessTarget[];
  let systemPrompt: string;
  let analysisContext: string;

  if (useCritic) {
    const criticText = project.criticAnalysis!;
    const criticWeaknesses = extractCriticWeaknesses(criticText);
    if (criticWeaknesses.length === 0) {
      return Response.json({ error: 'Could not extract critique areas from critic analysis.' }, { status: 400 });
    }
    targets = criticWeaknesses.slice(0, clampedCount);
    systemPrompt = config.criticPrompt;
    analysisContext = `Here is the full professional critique:\n${criticText}`;
  } else {
    const analysisData = JSON.parse(project.analysisData);
    const weaknesses = extractWeaknesses(analysisData, project.projectType);
    if (weaknesses.length === 0) {
      return Response.json({ error: 'No weaknesses found in analysis to generate suggestions for.' }, { status: 400 });
    }
    targets = weaknesses.slice(0, clampedCount);
    systemPrompt = config.prompt;
    analysisContext = `Here is the full analysis:\n${JSON.stringify(analysisData)}`;
  }

  // Clear existing suggestions before regenerating
  db.deleteSuggestionsForProject(id);

  // Get script text from uploadData
  const scriptText = project.uploadData ? JSON.parse(project.uploadData)?.text ?? '' : '';

  const { registry, modelId } = getModelForSettings(settings);

  // NDJSON streaming with concurrency limiter (max 3 concurrent AI calls)
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const maxConcurrent = 3;
      let activeCount = 0;
      let nextIndex = 0;
      let completedCount = 0;
      const totalCount = targets.length;

      await new Promise<void>((resolve) => {
        function tryLaunch() {
          while (activeCount < maxConcurrent && nextIndex < totalCount) {
            const i = nextIndex++;
            const weakness = targets[i];
            activeCount++;

            generateObject({
              model: registry.languageModel(modelId),
              schema: suggestionSchema,
              system: systemPrompt,
              prompt: `${analysisContext}\n\nHere is the script text:\n${scriptText}\n\nTarget this specific critique area:\nCategory: ${weakness.category}\n${weakness.label}\n\nFind the exact passage in the script that best exhibits this problem and write a concrete rewrite.`,
              ...(settings.provider === 'anthropic' ? {
                providerOptions: { anthropic: { structuredOutputMode: 'auto' } },
              } : {}),
            }).then((result) => {
              const suggestion = {
                id: generateId(),
                projectId: id,
                orderIndex: i,
                sceneHeading: result.object.sceneHeading,
                characterName: result.object.characterName,
                originalText: result.object.originalText,
                rewriteText: result.object.rewriteText,
                weaknessCategory: weakness.category,
                weaknessLabel: weakness.label,
              };
              db.insertSuggestion(suggestion);
              controller.enqueue(encoder.encode(JSON.stringify(suggestion) + '\n'));
            }).catch((err) => {
              // Stream error info for this suggestion so client knows it failed
              controller.enqueue(encoder.encode(JSON.stringify({
                error: true,
                orderIndex: i,
                weaknessLabel: weakness.label,
                message: err instanceof Error ? err.message : 'Generation failed',
              }) + '\n'));
            }).finally(() => {
              activeCount--;
              completedCount++;
              if (completedCount === totalCount) {
                controller.close();
                resolve();
              } else {
                tryLaunch();
              }
            });
          }
        }
        tryLaunch();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  const suggestions = db.listSuggestions(id);
  return Response.json(suggestions);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.deleteSuggestionsForProject(id);
  return new Response(null, { status: 204 });
}
