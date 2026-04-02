import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings } from '@/lib/ai/provider-registry';

export const maxDuration = 60;

export interface ImagePrompt {
  scene: string;
  title: string;
  prompt: string;
  style: string;
  cameraAngle: string;
  lighting: string;
  mood: string;
}

export interface ImagePromptResult {
  prompts: ImagePrompt[];
}

function buildPrompt(
  projectType: string,
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a visual development artist and cinematographer creating AI image generation prompts.

Based on the following ${projectType} source material and analysis, generate detailed image prompts for key visual moments. These prompts will be used with AI image generation tools like Midjourney or DALL-E to create reference images, mood boards, and storyboard frames.

SOURCE TEXT:
${sourceText}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with this exact structure:
{
  "prompts": [
    {
      "scene": "Opening Scene",
      "title": "The Empty Office",
      "prompt": "Cinematic wide angle shot of a modern office at dawn, warm amber light streaming through floor-to-ceiling windows, empty desks with scattered papers, shallow depth of field, anamorphic lens flare, photorealistic, 8k",
      "style": "Cinematic documentary, warm tones",
      "cameraAngle": "Low angle wide shot",
      "lighting": "Golden hour, directional natural light",
      "mood": "Anticipatory, tense"
    }
  ]
}

Generate 8–12 prompts covering the most visually important scenes, characters, and locations from the material.
Each prompt should be highly detailed, cinematic, and ready to paste into Midjourney or DALL-E.
Include technical photography/cinematography language in the prompt field.
Only return the JSON object — no markdown, no explanation.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectType, sourceText, analysis } = body as {
      projectType: string;
      sourceText: string;
      analysis: Record<string, unknown>;
    };

    if (!projectType || !sourceText || !analysis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const settings = await loadSettings();
    const { registry, modelId } = getModelForSettings(settings);

    const result = await generateText({
      model: registry.languageModel(modelId),
      system:
        'You generate structured AI image generation prompts as JSON. Always return valid JSON only.',
      prompt: buildPrompt(projectType, sourceText, analysis),
      ...(settings.provider === 'anthropic'
        ? { providerOptions: { anthropic: { structuredOutputMode: 'auto' } } }
        : {}),
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate image prompts' }, { status: 500 });
    }

    const promptList: ImagePromptResult = JSON.parse(jsonMatch[0]);
    return NextResponse.json(promptList);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
