import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { getModelForSettings } from '@/lib/ai/provider-registry';

export const maxDuration = 60;

export interface Shot {
  sceneNumber: string;
  location: string;
  shotType: string;
  description: string;
  characters: string[];
  cameraMovement: string;
  estimatedDuration: string;
  notes: string;
}

export interface ShotListResult {
  shots: Shot[];
}

function buildPrompt(
  projectType: string,
  sourceText: string,
  analysis: Record<string, unknown>
): string {
  return `You are a professional filmmaker and production coordinator creating a shot list.

Based on the following ${projectType} source material and analysis, generate a detailed production shot list.

SOURCE TEXT:
${sourceText}

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Return a JSON object with this exact structure:
{
  "shots": [
    {
      "sceneNumber": "1",
      "location": "INT. OFFICE - DAY",
      "shotType": "WS",
      "description": "Establishing shot showing the full office environment",
      "characters": ["Sarah", "John"],
      "cameraMovement": "Static",
      "estimatedDuration": "4 sec",
      "notes": "Natural overhead lighting"
    }
  ]
}

Shot type codes: WS (Wide Shot), MS (Medium Shot), CU (Close-Up), ECU (Extreme Close-Up), OTS (Over-the-Shoulder), POV (Point of View), INSERT, AERIAL, TWO-SHOT.
Camera movements: Static, Pan Left/Right, Tilt Up/Down, Dolly In/Out, Handheld, Crane Up/Down, Tracking.

Generate 15–25 shots covering the key scenes, moments, and characters from the material. Order shots by scene sequence.
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
      system: 'You generate structured production shot lists as JSON. Always return valid JSON only.',
      prompt: buildPrompt(projectType, sourceText, analysis),
      ...(settings.provider === 'anthropic'
        ? { providerOptions: { anthropic: { structuredOutputMode: 'auto' } } }
        : {}),
    });

    const text = result.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate shot list' }, { status: 500 });
    }

    const shotList: ShotListResult = JSON.parse(jsonMatch[0]);
    return NextResponse.json(shotList);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
