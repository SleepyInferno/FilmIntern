import { streamText, Output, APICallError, LoadAPIKeyError, NoSuchModelError } from 'ai';
import { z } from 'zod';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings, checkProviderHealth } from '@/lib/ai/provider-registry';
import { documentaryAnalysisSchema } from '@/lib/ai/schemas/documentary';
import { documentarySystemPrompt } from '@/lib/ai/prompts/documentary';
import { corporateAnalysisSchema } from '@/lib/ai/schemas/corporate';
import { corporateSystemPrompt } from '@/lib/ai/prompts/corporate';
import { narrativeAnalysisSchema } from '@/lib/ai/schemas/narrative';
import { narrativeSystemPrompt } from '@/lib/ai/prompts/narrative';
import { tvEpisodicAnalysisSchema } from '@/lib/ai/schemas/tv-episodic';
import { tvEpisodicSystemPrompt } from '@/lib/ai/prompts/tv-episodic';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analysisConfig: Record<string, { schema: z.ZodObject<any>; prompt: string }> = {
  documentary: { schema: documentaryAnalysisSchema, prompt: documentarySystemPrompt },
  corporate: { schema: corporateAnalysisSchema, prompt: corporateSystemPrompt },
  narrative: { schema: narrativeAnalysisSchema, prompt: narrativeSystemPrompt },
  'tv-episodic': { schema: tvEpisodicAnalysisSchema, prompt: tvEpisodicSystemPrompt },
};

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, projectType } = await req.json();

  const config = analysisConfig[projectType as string];
  if (!config) {
    return new Response(
      JSON.stringify({ error: 'Unsupported project type' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
    const { registry, modelId } = getModelForSettings(settings);
    const encoder = new TextEncoder();

    const result = streamText({
      model: registry.languageModel(modelId),
      output: Output.object({ schema: config.schema }),
      system: config.prompt,
      prompt: `Analyze this material:\n\n${text}`,
      ...(settings.provider === 'anthropic' ? {
        providerOptions: {
          anthropic: { structuredOutputMode: 'auto' },
        },
      } : {}),
      onError({ error }) {
        console.error('Analysis streaming error:', error);
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const send = (obj: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          } catch {
            closed = true; // client disconnected
          }
        };
        const close = () => {
          if (closed) return;
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        };

        let accumulated = '';
        try {
          for await (const chunk of result.textStream) {
            accumulated += chunk;
            send({ type: 'chunk', text: chunk });
          }

          if (accumulated.trim().length === 0) {
            send({ type: 'error', message: 'Provider returned no data. Check API key and model in Settings.' });
          } else {
            try {
              const data = JSON.parse(accumulated);
              send({ type: 'done', data });
            } catch {
              send({ type: 'error', message: 'Provider response was malformed JSON. Check model selection in Settings.' });
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown streaming error';
          send({ type: 'error', message: `Analysis stream failed: ${message}` });
        } finally {
          close();
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
      { error: 'Analysis failed. Check provider settings and try again.' },
      { status: 500 }
    );
  }
}
