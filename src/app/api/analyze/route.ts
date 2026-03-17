import { streamText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { documentaryAnalysisSchema } from '@/lib/ai/schemas/documentary';
import { documentarySystemPrompt } from '@/lib/ai/prompts/documentary';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, projectType } = await req.json();

  if (projectType !== 'documentary') {
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

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: documentaryAnalysisSchema }),
    system: documentarySystemPrompt,
    prompt: `Analyze this interview transcript for documentary filmmaking purposes:\n\n${text}`,
    providerOptions: {
      anthropic: { structuredOutputMode: 'auto' },
    },
    onError({ error }) {
      console.error('Analysis streaming error:', error);
    },
  });

  return result.toTextStreamResponse();
}
