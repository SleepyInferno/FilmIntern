import { generateObject } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings, checkProviderHealth } from '@/lib/ai/provider-registry';
import { db } from '@/lib/db';
import { suggestionConfig } from '@/lib/suggestions';
import { suggestionSchema } from '@/lib/ai/schemas/suggestion';

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  const { id, suggestionId } = await params;

  const project = db.getProject(id);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }

  const suggestion = db.getSuggestion(suggestionId);
  if (!suggestion || suggestion.projectId !== id) {
    return Response.json({ error: 'Suggestion not found' }, { status: 404 });
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

  const scriptText = project.uploadData ? JSON.parse(project.uploadData)?.text ?? '' : '';

  const systemPrompt = config.prompt;

  const analysisContext = project.analysisData
    ? `Here is the full analysis:\n${project.analysisData}`
    : '';

  const { registry, modelId } = getModelForSettings(settings);

  try {
    const result = await generateObject({
      model: registry.languageModel(modelId),
      schema: suggestionSchema,
      system: systemPrompt,
      prompt: `${analysisContext}\n\nHere is the script text:\n${scriptText}\n\nTarget this specific critique area:\nCategory: ${suggestion.weaknessCategory}\n${suggestion.weaknessLabel}\n\nFind the exact passage in the script that best exhibits this problem and write a concrete rewrite.`,
      ...(settings.provider === 'anthropic' ? {
        providerOptions: { anthropic: { structuredOutputMode: 'auto' } },
      } : {}),
    });

    db.updateSuggestionRewrite(suggestionId, result.object.rewriteText);
    const updated = db.getSuggestion(suggestionId);
    return Response.json(updated);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Regeneration failed' },
      { status: 500 }
    );
  }
}
