import { streamText, APICallError, LoadAPIKeyError, NoSuchModelError } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { buildRegistry, checkProviderHealth } from '@/lib/ai/provider-registry';
import { harshCriticSystemPrompt } from '@/lib/ai/prompts/harsh-critic';

export const maxDuration = 120;

export async function POST(req: Request) {
  const { text, projectType } = await req.json();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'No text provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const settings = await loadSettings();

  const health = await checkProviderHealth(settings);
  if (!health.ok) {
    return Response.json({ error: health.error }, { status: 503 });
  }

  try {
    const registry = buildRegistry(
      settings.ollama.baseURL,
      settings.anthropic.apiKey || undefined,
      settings.openai.apiKey || undefined,
    );
    const modelId = ({
      anthropic: `anthropic:${settings.anthropic.model}`,
      openai: `openai:${settings.openai.model}`,
      ollama: `ollama:${settings.ollama.model}`,
    } as const)[settings.provider];

    const result = streamText({
      model: registry.languageModel(modelId),
      system: harshCriticSystemPrompt,
      prompt: `Project type: ${projectType}\n\nAnalyze this material with your harshest critical lens:\n\n${text}`,
      ...(settings.provider === 'anthropic' ? {
        providerOptions: {
          anthropic: { thinking: { type: 'disabled' as const } },
        },
      } : {}),
      onError({ error }) {
        console.error('Critic streaming error:', error);
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
      { error: 'Analysis failed. Check provider settings and try again.' },
      { status: 500 }
    );
  }
}
