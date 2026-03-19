# Phase 8: Provider Error Handling - Research

**Researched:** 2026-03-19
**Domain:** AI SDK error handling, provider health-checking, API route error surfaces
**Confidence:** HIGH

## Summary

Phase 8 closes MPAI-05 by adding a health-check mechanism to `provider-registry.ts` and wrapping the analyze route in proper error handling so provider failures produce user-readable errors instead of 500s. The existing codebase has **zero try/catch around the `streamText` call** in the analyze route -- any provider error (missing API key, unreachable Ollama, invalid model) propagates as an unhandled exception and returns a raw 500 to the client.

The AI SDK (v6.0.116) exports well-typed error classes from `@ai-sdk/provider`: `APICallError` (network/auth failures with statusCode), `LoadAPIKeyError` (missing API key), `NoSuchModelError` (invalid model ID), and the base `AISDKError`. These can be caught and mapped to clear user-facing messages. A health-check function can validate configuration **before** calling `streamText` -- checking API key presence for cloud providers and reachability for Ollama.

**Primary recommendation:** Add a `checkProviderHealth(settings)` function to `provider-registry.ts` that validates config pre-flight, wrap the analyze route's `streamText` call in try/catch with AI SDK error type discrimination, and return structured JSON errors with appropriate HTTP status codes (401/502/503 instead of 500).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MPAI-05 | Provider failures return meaningful error messages; health-check validates config before analysis | AI SDK error classes enable type-safe catch; health-check validates API key presence + Ollama reachability before streamText call; analyze route try/catch maps errors to user-readable JSON responses |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai | 6.0.116 | Vercel AI SDK - streamText, provider registry | Already in use; exports error types |
| @ai-sdk/provider | (transitive) | Error class definitions (APICallError, LoadAPIKeyError, etc.) | Re-exported by `ai` package |
| @ai-sdk/anthropic | 3.0.58 | Anthropic provider | Already in use |
| @ai-sdk/openai | 3.0.41 | OpenAI provider | Already in use |
| ollama-ai-provider-v2 | (installed) | Ollama provider | Already in use |

### Supporting
No new libraries needed. This phase is purely about wrapping existing infrastructure with error handling.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom health-check | AI SDK built-in ping (none exists) | AI SDK has no built-in health-check; must hand-roll |
| Type-checking error instances | Generic catch-all | Loses ability to give specific error messages per failure mode |

## Architecture Patterns

### Recommended Changes (2 files modified, 0 new files)
```
src/lib/ai/
  provider-registry.ts    # ADD: checkProviderHealth() function
src/app/api/analyze/
  route.ts                # ADD: try/catch with error mapping, pre-flight health-check call
```

### Pattern 1: AI SDK Error Type Discrimination
**What:** The AI SDK exports typed error classes with static `.isInstance()` methods for safe runtime type checking.
**When to use:** In catch blocks wrapping `streamText` or `registry.languageModel()` calls.
**Example:**
```typescript
import { APICallError, LoadAPIKeyError, NoSuchModelError } from 'ai';

try {
  // ... streamText call
} catch (error) {
  if (LoadAPIKeyError.isInstance(error)) {
    return Response.json(
      { error: `API key not configured for ${settings.provider}. Go to Settings to add your key.` },
      { status: 401 }
    );
  }
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401) {
      return Response.json(
        { error: `Invalid API key for ${settings.provider}. Check your key in Settings.` },
        { status: 401 }
      );
    }
    return Response.json(
      { error: `Provider ${settings.provider} returned an error: ${error.message}` },
      { status: 502 }
    );
  }
  if (NoSuchModelError.isInstance(error)) {
    return Response.json(
      { error: `Model "${settings[settings.provider].model}" not found. Check Settings.` },
      { status: 400 }
    );
  }
  // Unknown error - generic message
  return Response.json(
    { error: 'Analysis failed. Check provider settings and try again.' },
    { status: 500 }
  );
}
```

### Pattern 2: Pre-Flight Health Check
**What:** A synchronous/async function that validates provider configuration before making expensive API calls.
**When to use:** Called at the start of the analyze route, before `streamText`.
**Example:**
```typescript
// In provider-registry.ts
export interface HealthCheckResult {
  ok: boolean;
  error?: string;
}

export async function checkProviderHealth(settings: AISettings): Promise<HealthCheckResult> {
  const { provider } = settings;

  // Cloud providers: check API key presence
  if (provider === 'anthropic') {
    const key = settings.anthropic.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) return { ok: false, error: 'Anthropic API key not configured. Add it in Settings or set ANTHROPIC_API_KEY env variable.' };
  }
  if (provider === 'openai') {
    const key = settings.openai.apiKey || process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: 'OpenAI API key not configured. Add it in Settings or set OPENAI_API_KEY env variable.' };
  }

  // Ollama: check reachability
  if (provider === 'ollama') {
    try {
      const resp = await fetch(settings.ollama.baseURL.replace(/\/api\/?$/, '/api/tags'), {
        signal: AbortSignal.timeout(3000),
      });
      if (!resp.ok) return { ok: false, error: `Ollama not responding at ${settings.ollama.baseURL}. Is it running?` };
    } catch {
      return { ok: false, error: `Cannot reach Ollama at ${settings.ollama.baseURL}. Make sure Ollama is running.` };
    }
  }

  return { ok: true };
}
```

### Pattern 3: Client-Side Error Display
**What:** The client already handles `!response.ok` by setting `analysisError` state. Currently it shows a generic message.
**When to use:** The error JSON body from the API can be parsed and displayed instead of the generic message.
**Example:**
```typescript
if (!response.ok) {
  const body = await response.json().catch(() => null);
  setAnalysisError(body?.error || 'Analysis could not be completed. Check your connection and try again.');
  setIsAnalyzing(false);
  return;
}
```

### Anti-Patterns to Avoid
- **Swallowing errors silently:** The current `onError` callback only does `console.error`. Streaming errors mid-flight need to be surfaced somehow.
- **Leaking internal details:** Never expose raw stack traces, API keys, or full error objects to the client. Map to user-readable messages.
- **Making health-check blocking for happy path:** The Ollama reachability check should have a short timeout (3s). For cloud providers, key presence is synchronous -- no network call needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error type detection | Manual `error.message.includes()` string matching | AI SDK `.isInstance()` static methods | Reliable, version-safe, handles inheritance |
| HTTP client for Ollama health | axios/got/custom fetch wrapper | Native `fetch` with `AbortSignal.timeout()` | Already available in Node 18+, no deps needed |

**Key insight:** The AI SDK already provides the error taxonomy. The work is mapping those errors to user-facing messages, not building error detection infrastructure.

## Common Pitfalls

### Pitfall 1: Streaming errors arrive mid-flight
**What goes wrong:** `streamText` returns a response immediately; errors may occur during the stream (e.g., rate limit mid-response). The `onError` callback fires but the HTTP response is already 200.
**Why it happens:** Streaming responses commit the status code before the full response is generated.
**How to avoid:** The pre-flight health check catches config errors before streaming starts. For mid-stream errors, the client already handles incomplete JSON gracefully (the catch in the JSON.parse loop). Adding error chunks to the stream is possible but over-engineered for this phase.
**Warning signs:** User sees partial/empty analysis with no error message.

### Pitfall 2: Ollama health check false positives
**What goes wrong:** Ollama is running but the requested model isn't pulled yet. Health check passes (server responds) but `streamText` fails.
**Why it happens:** `/api/tags` returns 200 even if the requested model isn't available.
**How to avoid:** Optionally check if the model exists in the tags response. Or rely on the try/catch around `streamText` to catch `NoSuchModelError` from the Ollama provider.
**Warning signs:** "Model not found" errors after health check passes.

### Pitfall 3: API key in settings vs environment variable
**What goes wrong:** Health check says "no API key" but the key is actually in the environment variable.
**Why it happens:** `loadSettings()` merges env vars into the settings object, but `checkProviderHealth` might check raw settings before merge.
**How to avoid:** Always call `checkProviderHealth` with the **merged** settings from `loadSettings()` (which already incorporates env vars).
**Warning signs:** False "missing API key" errors when key is in `.env`.

### Pitfall 4: Breaking existing test mocks
**What goes wrong:** Adding try/catch changes the control flow and existing mocked tests may not trigger the expected paths.
**Why it happens:** Current tests mock `streamText` to return a resolved value. New error paths need new test cases with rejected mocks.
**How to avoid:** Add new test cases for error scenarios alongside existing happy-path tests. Don't modify existing test structure.
**Warning signs:** Previously passing tests fail after adding error handling.

## Code Examples

### Current State: No Error Handling in Analyze Route
```typescript
// src/app/api/analyze/route.ts (current) - NO try/catch
const result = streamText({
  model: registry.languageModel(modelId),
  // ...
  onError({ error }) {
    console.error('Analysis streaming error:', error);  // Only console.error
  },
});
return result.toTextStreamResponse();
// If streamText throws synchronously (e.g., bad model ID), this is an unhandled 500
```

### Current State: Client Ignores Error Body
```typescript
// src/app/page.tsx (current) - Generic error message
if (!response.ok) {
  setAnalysisError('Analysis could not be completed. Check your connection and try again.');
  // Never reads response body for specific error message
}
```

### AI SDK Error Imports (verified from node_modules)
```typescript
// All exported from 'ai' package (re-exported from @ai-sdk/provider)
import {
  APICallError,      // Network/HTTP errors, has .statusCode, .isRetryable
  LoadAPIKeyError,   // Missing API key
  NoSuchModelError,  // Invalid model ID
  AISDKError,        // Base class for all
} from 'ai';

// Each has static .isInstance(error) method for safe type checking
APICallError.isInstance(err)    // true if err is APICallError
LoadAPIKeyError.isInstance(err) // true if err is LoadAPIKeyError
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic catch-all error handling | AI SDK typed error classes with `.isInstance()` | AI SDK v3+ | Enables specific error messages per failure type |
| `AbortController` + `setTimeout` | `AbortSignal.timeout(ms)` | Node 18+ | Cleaner timeout for health check fetches |

**Deprecated/outdated:**
- None relevant -- the AI SDK error classes have been stable since v3.

## Open Questions

1. **Should health-check verify model existence for Ollama?**
   - What we know: Ollama's `/api/tags` endpoint lists available models. Checking model presence adds reliability.
   - What's unclear: Whether the extra network call and response parsing is worth it for a simple health-check.
   - Recommendation: Check model existence in health-check since we're already hitting the Ollama server. It's one extra JSON parse.

2. **Should mid-stream errors surface to the UI?**
   - What we know: Once streaming starts, HTTP status is committed. The `onError` callback fires but client sees partial data.
   - What's unclear: Whether partial analysis with no error indicator is acceptable UX.
   - Recommendation: Out of scope for this phase. Pre-flight health-check covers config errors. Mid-stream errors (rate limits, timeouts) are rare and the client already handles incomplete data gracefully. Can be addressed in a future phase if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts src/app/api/analyze/__tests__/route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MPAI-05a | Health-check returns error for missing Anthropic API key | unit | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts -x` | Needs new tests |
| MPAI-05b | Health-check returns error for missing OpenAI API key | unit | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts -x` | Needs new tests |
| MPAI-05c | Health-check returns error for unreachable Ollama | unit | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts -x` | Needs new tests |
| MPAI-05d | Health-check returns ok for valid config | unit | `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts -x` | Needs new tests |
| MPAI-05e | Analyze route returns structured error JSON for LoadAPIKeyError | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Needs new tests |
| MPAI-05f | Analyze route returns structured error JSON for APICallError | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Needs new tests |
| MPAI-05g | Analyze route calls health-check before streamText | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Needs new tests |
| MPAI-05h | Analyze route returns health-check error early (no streamText call) | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Needs new tests |
| MPAI-05i | Existing happy-path tests still pass | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Exists (8 tests) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/ai/__tests__/provider-registry.test.ts src/app/api/analyze/__tests__/route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
None -- existing test files cover both target modules. New test cases will be added to the existing test files:
- `src/lib/ai/__tests__/provider-registry.test.ts` -- add `checkProviderHealth` tests
- `src/app/api/analyze/__tests__/route.test.ts` -- add error handling tests

## Sources

### Primary (HIGH confidence)
- `node_modules/@ai-sdk/provider/dist/index.d.ts` -- verified error class signatures (APICallError, LoadAPIKeyError, NoSuchModelError, AISDKError) with `.isInstance()` static methods
- `node_modules/ai/dist/index.d.ts` -- verified re-exports of all error classes from `@ai-sdk/provider`
- `src/lib/ai/provider-registry.ts` -- current 18-line file, no error handling
- `src/app/api/analyze/route.ts` -- current 69-line file, no try/catch around streamText
- `src/lib/ai/settings.ts` -- loadSettings merges env vars into settings, returns AISettings type
- `src/app/page.tsx` -- client reads `response.ok` but ignores error body

### Secondary (MEDIUM confidence)
- Ollama API: `/api/tags` endpoint returns list of available models (verified from common Ollama usage patterns)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies; all error classes verified in node_modules type definitions
- Architecture: HIGH - straightforward try/catch + health-check pattern; all target files inspected
- Pitfalls: HIGH - identified from direct code inspection of current error handling gaps

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- error classes unlikely to change)
