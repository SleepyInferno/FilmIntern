import { streamText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { documentaryAnalysisSchema } from '@/lib/ai/schemas/documentary';
import { documentarySystemPrompt } from '@/lib/ai/prompts/documentary';
import { corporateAnalysisSchema } from '@/lib/ai/schemas/corporate';
import { corporateSystemPrompt } from '@/lib/ai/prompts/corporate';
import { narrativeAnalysisSchema } from '@/lib/ai/schemas/narrative';
import { narrativeSystemPrompt } from '@/lib/ai/prompts/narrative';
import { tvEpisodicAnalysisSchema } from '@/lib/ai/schemas/tv-episodic';
import { tvEpisodicSystemPrompt } from '@/lib/ai/prompts/tv-episodic';
import { shortFormAnalysisSchema } from '@/lib/ai/schemas/short-form';
import { shortFormSystemPrompt } from '@/lib/ai/prompts/short-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analysisConfig: Record<string, { schema: z.ZodObject<any>; prompt: string }> = {
  documentary: { schema: documentaryAnalysisSchema, prompt: documentarySystemPrompt },
  corporate: { schema: corporateAnalysisSchema, prompt: corporateSystemPrompt },
  narrative: { schema: narrativeAnalysisSchema, prompt: narrativeSystemPrompt },
  'tv-episodic': { schema: tvEpisodicAnalysisSchema, prompt: tvEpisodicSystemPrompt },
  'short-form': { schema: shortFormAnalysisSchema, prompt: shortFormSystemPrompt },
};

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, projectType, inputType } = await req.json();

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

  const inputTypePrefix = projectType === 'short-form' && inputType
    ? `[Input Type: ${inputType}]\n\n`
    : '';

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: config.schema }),
    system: config.prompt,
    prompt: `${inputTypePrefix}Analyze this material:\n\n${text}`,
    providerOptions: {
      anthropic: { structuredOutputMode: 'auto' },
    },
    onError({ error }) {
      console.error('Analysis streaming error:', error);
    },
  });

  return result.toTextStreamResponse();
}
