---
created: 2026-03-17T11:52:44.666Z
title: Add multi-provider AI support
area: api
files:
  - src/app/api/analyze/route.ts
  - src/lib/ai/schemas/
  - src/lib/ai/prompts/
---

## Problem

All analysis calls go through Anthropic Claude exclusively. Users on free/low API tiers can hit rate limits quickly, especially when testing all 5 project types. There's no way to distribute load or switch to a cheaper model.

## Solution

Add a provider selection mechanism so users can choose between:
- **Anthropic Claude** (current — claude-sonnet-4-x or claude-opus-4-x)
- **OpenAI** (GPT-4o or o4-mini — needs clarification from user on preferred model)

Open design questions to resolve before planning:
1. Which OpenAI model? (GPT-4o for quality, o4-mini for cost)
2. Scope: per-analysis toggle in the UI, or a global setting in app config/settings page?
3. Schema handling: OpenAI doesn't support Zod `.describe()` natively the same way — may need provider-specific prompt strategies
4. Streaming: both support streaming, but SDK calls differ (Vercel AI SDK handles this well via `streamText` with provider switching)

Plan as a dedicated phase after Phase 4 (Export). Estimate: 1-2 plans covering API abstraction layer + UI toggle/settings.
