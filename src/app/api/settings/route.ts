import { loadSettings, saveSettings, AISettings } from '@/lib/ai/settings';

// NOTE: This endpoint returns full API keys for the settings UI to pre-fill inputs.
// In a multi-user or network-exposed deployment, mask keys via maskSettingsKeys()
// and implement a separate flow for key submission.
export async function GET() {
  const settings = await loadSettings();
  return Response.json(settings);
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.provider || !['anthropic', 'openai', 'ollama'].includes(body.provider)) {
    return new Response(
      JSON.stringify({ error: 'Invalid provider. Must be anthropic, openai, or ollama.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body.anthropic?.model || !body.openai?.model || !body.ollama?.model || !body.ollama?.baseURL) {
    return new Response(
      JSON.stringify({ error: 'Missing required provider configuration fields.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const settings: AISettings = {
    provider: body.provider,
    anthropic: { model: body.anthropic.model, apiKey: body.anthropic.apiKey ?? '' },
    openai: { model: body.openai.model, apiKey: body.openai.apiKey ?? '' },
    ollama: { model: body.ollama.model, baseURL: body.ollama.baseURL },
  };

  await saveSettings(settings);
  return Response.json({ ok: true });
}
