import {
  loadSettings,
  saveSettings,
  maskSettingsKeys,
  isMaskedKey,
  validateOllamaBaseURL,
  AISettings,
} from '@/lib/ai/settings';

// Returns settings with API keys masked. The settings UI binds the masked value
// to its password input; PUT detects the masked shape (or empty string) and
// preserves the stored key rather than overwriting with the mask.
export async function GET() {
  const settings = await loadSettings();
  return Response.json(maskSettingsKeys(settings));
}

function badRequest(error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.provider || !['anthropic', 'openai', 'ollama'].includes(body.provider)) {
    return badRequest('Invalid provider. Must be anthropic, openai, or ollama.');
  }

  if (!body.anthropic?.model || !body.openai?.model || !body.ollama?.model || !body.ollama?.baseURL) {
    return badRequest('Missing required provider configuration fields.');
  }

  const baseURLCheck = validateOllamaBaseURL(body.ollama.baseURL);
  if (!baseURLCheck.ok) {
    return badRequest(`Invalid Ollama baseURL: ${baseURLCheck.reason}`);
  }

  const existing = await loadSettings();

  // Preserve stored keys when the client sends back the masked value or an
  // empty string (settings UI doesn't distinguish "untouched" from "cleared").
  const resolveKey = (incoming: string | undefined, stored: string): string => {
    const value = incoming ?? '';
    if (value === '' || isMaskedKey(value)) return stored;
    return value;
  };

  const settings: AISettings = {
    provider: body.provider,
    anthropic: {
      model: body.anthropic.model,
      apiKey: resolveKey(body.anthropic.apiKey, existing.anthropic.apiKey),
    },
    openai: {
      model: body.openai.model,
      apiKey: resolveKey(body.openai.apiKey, existing.openai.apiKey),
    },
    ollama: { model: body.ollama.model, baseURL: body.ollama.baseURL },
  };

  await saveSettings(settings);
  return Response.json({ ok: true });
}
