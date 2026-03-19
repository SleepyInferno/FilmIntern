# Phase 1: Vertical Slice - Research

**Researched:** 2026-03-16
**Domain:** Next.js 15 greenfield scaffold, file upload, Anthropic Claude structured analysis, streaming UI
**Confidence:** HIGH

## Summary

Phase 1 delivers the complete end-to-end pipeline: select "Documentary" project type, upload a plain text transcript, preview the parsed content, trigger AI analysis, and view a structured interview mining report on screen. This is greenfield -- no existing codebase. The vertical slice validates the core value proposition before expanding formats or project types.

The technical surface is well-understood: Next.js App Router with Route Handlers for file upload, Vercel AI SDK 6 (`ai` package) with `@ai-sdk/anthropic` for streaming structured output, and Zod schemas to enforce analysis report shape. The key risk is not infrastructure -- it is prompt quality. The documentary interview mining prompt must produce specific, quote-grounded analysis that a filmmaker finds genuinely useful, not generic "book report" text.

**Primary recommendation:** Scaffold with `create-next-app`, install AI SDK 6 + shadcn/ui, and build output-first: define the documentary analysis report schema and UI before writing the upload flow. This ensures parsing and prompting serve the output, not the other way around.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | User can select a project type from available options before uploading | Project Type Registry pattern; config-driven routing; shadcn/ui select/card components |
| CORE-02 | User can upload a file via drag & drop or file picker | Next.js Route Handler with FormData; react-dropzone or native drag-and-drop; file validation |
| CORE-03 | App displays a parsed content preview before analysis | Plain text pass-through parser; preview component showing word count, line count, detected speakers |
| CORE-04 | User can trigger an analysis run after upload | API route calling streamText with Output.object; loading/streaming state management |
| CORE-05 | User can view structured analysis results on screen | Report renderer components mapping structured JSON to professional sections |
| PARSE-01 | App parses plain text (.txt) files | Trivial for Phase 1 -- pass-through with metadata extraction (word count, line detection) |
| ANLYS-01 | Documentary projects receive interview mining analysis: best quotes, recurring themes, key moments | Anthropic Claude via AI SDK 6 streamText + Output.object with Zod schema; prompt design with professional documentary editing frameworks |
| OUTP-01 | User receives a structured analysis report formatted appropriately for the project type | Report renderer with sections: summary, key quotes, themes, key moments; professional formatting with shadcn/ui Card/Accordion components |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Full-stack framework (App Router + Route Handlers) | Current stable. App Router handles UI and API in one deployment unit. Route Handlers process file uploads server-side. |
| React | 19.2.4 | UI library | Ships with Next.js 16. Server Components reduce bundle. |
| TypeScript | ~5.x | Type safety | Enforces analysis schema shapes at build time. Ships with create-next-app. |
| Tailwind CSS | 4.2.1 | Styling | CSS-first config in v4. Fast iteration for personal tool. Default with create-next-app. |
| shadcn/ui | latest (CLI) | Component library | Copies components into codebase. Cards, tabs, buttons pre-built. Customizable. |
| Lucide React | 0.577.0 | Icons | Default icon set for shadcn/ui. Tree-shakeable. |

### AI / LLM

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | 6.0.116 | Streaming structured output, UI hooks | `streamText` + `Output.object()` for streaming Zod-validated structured data. `useChat` for client-side streaming UI. AI SDK 6 is current stable -- `generateObject`/`streamObject` are deprecated. |
| @ai-sdk/anthropic | 3.0.58 | Anthropic provider for AI SDK | First-class Claude support with `structuredOutputMode`. Use `anthropic('claude-sonnet-4-5')` for good quality/cost balance. |
| @ai-sdk/react | 3.0.118 | React hooks for streaming UI | `useChat` and related hooks for client-side streaming state management. |
| zod | 4.3.6 | Schema validation | Defines analysis output shapes. AI SDK uses Zod schemas for `Output.object()`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dropzone | latest | Drag-and-drop file upload | Wrap the upload zone for CORE-02. Handles drag events, file type filtering, accessibility. |
| Vitest | 4.1.0 | Testing | Fast TypeScript-native testing. Use for parser and schema validation tests. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native HTML drag events | react-dropzone adds accessibility, file filtering, and tested edge cases. Worth the small dependency for CORE-02. |
| AI SDK 6 streamText | Direct @anthropic-ai/sdk | AI SDK provides streaming UI hooks, partial object streaming, and provider abstraction. Direct SDK means writing streaming plumbing manually. |
| shadcn/ui Card for report | Custom components | Cards, Accordion, Badge from shadcn cover report rendering needs without custom work. |

**Installation:**
```bash
# Scaffold (Next.js 16 with defaults: TypeScript, Tailwind, ESLint, App Router, Turbopack)
npx create-next-app@latest filmintern --yes --src-dir

# UI components
npx shadcn@latest init
npx shadcn@latest add button card tabs badge accordion separator skeleton

# AI / LLM
npm install ai @ai-sdk/anthropic @ai-sdk/react zod

# File upload
npm install react-dropzone

# Dev tools
npm install -D vitest @testing-library/react
```

**Version verification:** All versions verified against npm registry on 2026-03-16. Next.js is at 16.1.6 (the stack research doc listed 15.x -- the ecosystem has moved forward). AI SDK is at 6.x (stack doc listed 4.x -- major version jump with breaking API changes).

**CRITICAL VERSION NOTE:** The prior stack research recommended AI SDK v4.x with `useChat`/`streamText` patterns. AI SDK is now at v6.x with significant breaking changes:
- `generateObject` and `streamObject` are DEPRECATED. Use `streamText` with `output: Output.object({ schema })` instead.
- `CoreMessage` type removed, replaced by `ModelMessage`.
- `convertToCoreMessages` renamed to `convertToModelMessages` (now async).
- Import `Output` from `'ai'` for structured output.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    page.tsx                    # Home: project type selection
    upload/
      page.tsx                  # Upload flow (after type selection)
    report/
      page.tsx                  # Analysis report display
    api/
      upload/route.ts           # File upload endpoint (FormData)
      analyze/route.ts          # LLM analysis endpoint (streaming)
  components/
    ui/                         # shadcn/ui components
    project-type-selector.tsx   # CORE-01: type selection cards
    file-dropzone.tsx           # CORE-02: drag-drop upload
    content-preview.tsx         # CORE-03: parsed content preview
    analysis-report.tsx         # CORE-05/OUTP-01: report renderer
    report-sections/
      summary-section.tsx       # Executive summary
      quotes-section.tsx        # Key quotes with context
      themes-section.tsx        # Recurring themes
      moments-section.tsx       # Key moments timeline
  lib/
    ai/
      prompts/
        documentary.ts          # Documentary interview mining prompt
      schemas/
        documentary.ts          # Zod schema for documentary analysis output
      analyze.ts                # streamText + Output.object wrapper
    parsers/
      registry.ts               # Parser registry pattern
      txt-parser.ts             # Plain text parser (Phase 1)
    types/
      project-types.ts          # Project type config registry
      analysis.ts               # Shared analysis types
```

### Pattern 1: Output-First Design
**What:** Define the documentary analysis Zod schema and report UI FIRST, then build upload and prompting to serve that output shape.
**When to use:** Always for this phase. Prevents Pitfall 10 (building parser before defining output needs).
**Example:**
```typescript
// src/lib/ai/schemas/documentary.ts
import { z } from 'zod';

export const documentaryAnalysisSchema = z.object({
  summary: z.object({
    overview: z.string().describe('2-3 sentence executive summary of the transcript'),
    intervieweeCount: z.number().describe('Number of distinct speakers identified'),
    dominantThemes: z.array(z.string()).describe('Top 3-5 themes'),
    totalQuotesExtracted: z.number(),
  }),
  keyQuotes: z.array(z.object({
    quote: z.string().describe('Exact verbatim quote from the transcript'),
    speaker: z.string().describe('Speaker name or identifier'),
    context: z.string().describe('Why this quote matters for the documentary'),
    category: z.enum(['emotional', 'informational', 'contradictory', 'humorous', 'revealing']),
    usefulness: z.enum(['must-use', 'strong', 'supporting']),
  })).describe('8-15 best quotes ranked by editorial value'),
  recurringThemes: z.array(z.object({
    theme: z.string(),
    description: z.string().describe('What this theme means in context'),
    evidence: z.array(z.string()).describe('2-3 brief quote excerpts supporting this theme'),
    frequency: z.enum(['dominant', 'recurring', 'emerging']),
  })),
  keyMoments: z.array(z.object({
    moment: z.string().describe('Description of the moment'),
    significance: z.string().describe('Why a documentary editor would flag this'),
    approximateLocation: z.string().describe('Rough position in transcript: early/middle/late'),
    type: z.enum(['turning-point', 'emotional-peak', 'revelation', 'contradiction', 'humor']),
  })),
  editorialNotes: z.object({
    narrativeThreads: z.array(z.string()).describe('Potential story threads a documentarian could follow'),
    missingPerspectives: z.array(z.string()).describe('Gaps or viewpoints not represented'),
    suggestedStructure: z.string().describe('Brief suggestion for how to structure the documentary based on this material'),
  }),
});

export type DocumentaryAnalysis = z.infer<typeof documentaryAnalysisSchema>;
```

### Pattern 2: Streaming Structured Output with AI SDK 6
**What:** Use `streamText` with `Output.object()` to stream a Zod-validated analysis result to the client.
**When to use:** For CORE-04 (trigger analysis) and CORE-05 (view results).
**Example:**
```typescript
// src/app/api/analyze/route.ts
import { streamText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { documentaryAnalysisSchema } from '@/lib/ai/schemas/documentary';

export async function POST(req: Request) {
  const { text, projectType } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: documentaryAnalysisSchema }),
    system: `You are a professional documentary film editor and story consultant...`,
    prompt: `Analyze this interview transcript for documentary filmmaking purposes:\n\n${text}`,
    onError({ error }) {
      console.error('Analysis error:', error);
    },
  });

  return result.toTextStreamResponse();
}
```

```typescript
// Client-side: consuming the streaming structured output
// Use partialOutputStream for progressive rendering
const { partialOutputStream } = streamText({ ... });
for await (const partialObject of partialOutputStream) {
  // partialObject is a partial DocumentaryAnalysis
  // Render available sections as they arrive
}
```

### Pattern 3: File Upload via Route Handler + FormData
**What:** Upload files to a Next.js Route Handler using native FormData. Parse server-side.
**When to use:** For CORE-02 (file upload).
**Example:**
```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (!file.name.endsWith('.txt')) {
    return NextResponse.json({ error: 'Only .txt files accepted' }, { status: 400 });
  }

  // Read file content
  const text = await file.text();

  // Extract metadata
  const lines = text.split('\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return NextResponse.json({
    text,
    metadata: {
      filename: file.name,
      size: file.size,
      wordCount,
      lineCount: lines.length,
      format: 'txt',
    },
  });
}
```

### Pattern 4: Project Type Registry (Config-Driven)
**What:** A configuration object that maps project types to accepted files, prompts, and schemas. Phase 1 has one entry (documentary) but the pattern supports expansion.
**When to use:** For CORE-01 (project type selection).
**Example:**
```typescript
// src/lib/types/project-types.ts
export interface ProjectTypeConfig {
  id: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  fileTypeLabel: string; // "transcript" or "screenplay"
  analysisSchema: z.ZodSchema;
  systemPrompt: string;
}

export const PROJECT_TYPES: Record<string, ProjectTypeConfig> = {
  documentary: {
    id: 'documentary',
    label: 'Documentary',
    description: 'Interview mining: extract quotes, themes, and key moments from transcripts',
    icon: 'Video',
    acceptedExtensions: ['.txt'],
    acceptedMimeTypes: ['text/plain'],
    fileTypeLabel: 'transcript',
    analysisSchema: documentaryAnalysisSchema,
    systemPrompt: documentarySystemPrompt,
  },
  // Phase 3+ will add: narrative, tv-episodic, short-form, corporate
};
```

### Anti-Patterns to Avoid
- **Raw text display for analysis output:** Never dump AI response as plain text or markdown blob. Always render through structured report components with sections, badges, and visual hierarchy. This is Pitfall 6.
- **Client-side file reading:** Always upload to Route Handler, parse server-side. Even for plain text in Phase 1, establish the server-side pattern now.
- **One giant prompt:** Even for Phase 1 with only documentary analysis, structure the prompt to produce focused structured output via Zod schema. Do not ask for a freeform essay.
- **Hardcoded project type logic:** Use the registry pattern from day one. Phase 1 has one entry, but conditionals scattered in components become debt in Phase 3.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop file upload | Custom drag event handlers | react-dropzone | Handles accessibility, file filtering, edge cases (browser differences, mobile) |
| Streaming structured JSON from LLM | Manual SSE parsing + JSON assembly | AI SDK 6 `streamText` + `Output.object()` | Handles partial object streaming, schema validation, error recovery |
| UI components (cards, buttons, badges) | Custom styled divs | shadcn/ui | Pre-built accessible components. Avoids reinventing design system. |
| Schema validation for LLM output | Manual JSON.parse + type assertions | Zod schemas via AI SDK Output.object | Type-safe, validated at runtime, generates TypeScript types |
| Streaming state in React | Custom useState + fetch + ReadableStream | `@ai-sdk/react` hooks | Handles streaming state, partial updates, error states, abort |

**Key insight:** Phase 1 infrastructure choices set patterns for the entire project. Use established libraries now so expansion in later phases is additive, not a rewrite.

## Common Pitfalls

### Pitfall 1: Generic "Book Report" Prompt Output
**What goes wrong:** The documentary analysis reads like "The interview covered interesting topics and the speakers were engaging." A filmmaker finds this useless.
**Why it happens:** The system prompt lacks a professional documentary editing framework. It asks for "analysis" instead of specifying the exact analytical dimensions a documentary editor needs.
**How to avoid:** Embed a professional documentary editing framework in the system prompt. Require exact verbatim quotes (not paraphrased). Require the AI to categorize quotes by editorial usefulness (must-use, strong, supporting). Require specific evidence for every theme claim.
**Warning signs:** Read 3 analysis outputs. If you cannot find 5+ specific quotes with editorial context, the prompt is too generic.

### Pitfall 2: Building Upload Before Defining Output Schema
**What goes wrong:** File upload works perfectly, but the analysis output has the wrong shape for the report UI, requiring rework of the Zod schema, prompt, and renderer.
**Why it happens:** Upload is technically interesting; output schema design requires domain thinking.
**How to avoid:** Define the DocumentaryAnalysis Zod schema first. Build the report renderer UI with mock data. Then build upload and analysis to produce that shape.
**Warning signs:** Report renderer has `any` types or `JSON.stringify` fallbacks.

### Pitfall 3: AI SDK 6 API Confusion
**What goes wrong:** Using deprecated `generateObject`/`streamObject` patterns from older tutorials and AI SDK v4/v5 examples.
**Why it happens:** Most online examples and tutorials reference AI SDK v3-v5. The v6 migration changed the structured output API significantly.
**How to avoid:** Use `streamText` with `output: Output.object({ schema })` and `partialOutputStream`. Import `Output` from `'ai'`. Do NOT import `generateObject` or `streamObject`.
**Warning signs:** Import errors for `generateObject`, `streamObject`, or `CoreMessage`.

### Pitfall 4: Not Streaming Analysis Results
**What goes wrong:** User clicks "Analyze" and stares at a blank screen for 15-30 seconds while the full analysis generates.
**Why it happens:** Using `generateText` instead of `streamText`, or not wiring partial results to the UI.
**How to avoid:** Use `streamText` + `partialOutputStream` on the server, consume the stream on the client to progressively render report sections as they arrive.
**Warning signs:** Full page loading spinner with no intermediate content.

### Pitfall 5: Hallucinated Quotes
**What goes wrong:** The AI invents quotes that do not appear in the transcript. The filmmaker knows their own material and immediately loses trust.
**Why it happens:** LLMs confabulate details from long documents, especially when asked to extract "best quotes."
**How to avoid:** Include explicit instructions: "Only quote text that appears verbatim in the transcript. If you cannot find an exact quote to support a point, describe the moment generally instead of fabricating a quote." In the Zod schema, the `quote` field description says "Exact verbatim quote from the transcript."
**Warning signs:** Spot-check 5 quotes from an analysis against the source transcript.

## Code Examples

### Documentary System Prompt (Core IP)
```typescript
// src/lib/ai/prompts/documentary.ts
export const documentarySystemPrompt = `You are a senior documentary film editor and story consultant with 20+ years of experience mining interview footage for narrative documentaries.

Your task is to analyze interview transcripts and produce a structured editorial report that helps a documentary filmmaker identify the most valuable material.

## Your analytical framework:

### Quote Extraction
- Extract ONLY verbatim quotes that appear exactly in the transcript
- Categorize each quote by type: emotional (reveals feeling), informational (conveys key fact), contradictory (conflicts with another statement or common belief), humorous (lightens tone), revealing (shows character or hidden truth)
- Rate editorial usefulness: must-use (defines the documentary), strong (would improve any cut), supporting (useful as B-roll voiceover or transition)

### Theme Identification
- Identify recurring themes that emerge organically across the interview(s)
- Support each theme with 2-3 brief quote excerpts as evidence
- Rate frequency: dominant (central to the material), recurring (appears multiple times), emerging (mentioned but underdeveloped)

### Key Moments
- Flag moments a documentary editor would mark in their timeline: emotional peaks, turning points, revelations, contradictions, and humor
- Describe each moment and its significance for the documentary narrative

### Editorial Notes
- Suggest potential narrative threads a filmmaker could follow
- Note missing perspectives or gaps in the material
- Briefly suggest how the material could be structured

## Rules:
- NEVER invent or paraphrase quotes. Use only exact text from the transcript.
- Be specific. Reference approximate positions (early/middle/late in transcript).
- Be honest about weak material. If the transcript lacks strong moments, say so.
- Write for a professional filmmaker, not a general audience.`;
```

### Streaming Analysis Route Handler
```typescript
// src/app/api/analyze/route.ts
import { streamText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { documentaryAnalysisSchema } from '@/lib/ai/schemas/documentary';
import { documentarySystemPrompt } from '@/lib/ai/prompts/documentary';

export const maxDuration = 60; // Allow up to 60s for long transcripts

export async function POST(req: Request) {
  const { text, projectType } = await req.json();

  if (projectType !== 'documentary') {
    return new Response('Unsupported project type', { status: 400 });
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: documentaryAnalysisSchema }),
    system: documentarySystemPrompt,
    prompt: `Analyze this interview transcript:\n\n${text}`,
    providerOptions: {
      anthropic: {
        structuredOutputMode: 'auto',
      },
    },
    onError({ error }) {
      console.error('Analysis streaming error:', error);
    },
  });

  return result.toTextStreamResponse();
}
```

### File Dropzone Component
```typescript
// src/components/file-dropzone.tsx
'use client';

import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  acceptedExtensions: string[];
  fileTypeLabel: string;
}

export function FileDropzone({ onFileAccepted, acceptedExtensions, fileTypeLabel }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropAccepted: (files) => onFileAccepted(files[0]),
  });

  return (
    <Card
      {...getRootProps()}
      className={`border-2 border-dashed p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-lg font-medium">
        {isDragActive ? `Drop your ${fileTypeLabel} here` : `Drag & drop your ${fileTypeLabel}, or click to browse`}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Accepts {acceptedExtensions.join(', ')} files up to 10MB
      </p>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI SDK `generateObject`/`streamObject` | `streamText` + `Output.object({ schema })` | AI SDK 6.0 (2025-2026) | Must use new API. Old tutorials are wrong. |
| AI SDK `CoreMessage` type | `ModelMessage` type | AI SDK 6.0 | Import path changed. |
| `convertToCoreMessages` | `convertToModelMessages` (async) | AI SDK 6.0 | Function renamed and now async. |
| Anthropic SDK manual streaming | AI SDK `@ai-sdk/anthropic` provider | Stable since AI SDK 4.x | Provider handles streaming, structured output, model selection. |
| Next.js 15 | Next.js 16.1.6 | 2025-2026 | Current stable. Turbopack now default bundler. |
| Tailwind CSS v3 (JS config) | Tailwind CSS v4 (CSS-first config) | 2025 | v4 uses `@import "tailwindcss"` in CSS, not `tailwind.config.js`. |

**Deprecated/outdated:**
- `generateObject` / `streamObject`: Removed in AI SDK 6. Use `streamText` with `output` setting.
- `CoreMessage`: Removed. Use `ModelMessage`.
- `useCompletion`: Still exists but `useChat` is preferred for most streaming use cases.
- Tailwind `tailwind.config.js`: v4 uses CSS-first configuration. `create-next-app` scaffolds v4 by default.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | Project type registry returns correct config for "documentary" | unit | `npx vitest run src/lib/types/__tests__/project-types.test.ts -x` | Wave 0 |
| CORE-02 | Upload route accepts .txt, rejects other formats, extracts text | unit | `npx vitest run src/app/api/upload/__tests__/route.test.ts -x` | Wave 0 |
| CORE-03 | Parser extracts word count, line count, basic metadata from plain text | unit | `npx vitest run src/lib/parsers/__tests__/txt-parser.test.ts -x` | Wave 0 |
| CORE-04 | Analyze route calls streamText with correct schema and prompt | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Wave 0 |
| CORE-05 | Report component renders all sections from mock analysis data | unit | `npx vitest run src/components/__tests__/analysis-report.test.ts -x` | Wave 0 |
| PARSE-01 | txt-parser returns text and metadata for valid .txt input | unit | `npx vitest run src/lib/parsers/__tests__/txt-parser.test.ts -x` | Wave 0 |
| ANLYS-01 | Documentary analysis schema validates expected output shape | unit | `npx vitest run src/lib/ai/schemas/__tests__/documentary.test.ts -x` | Wave 0 |
| OUTP-01 | Report sections render quotes, themes, moments from structured data | unit | `npx vitest run src/components/report-sections/__tests__/ -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with path aliases matching tsconfig
- [ ] `src/lib/types/__tests__/project-types.test.ts` -- Project type registry tests
- [ ] `src/lib/parsers/__tests__/txt-parser.test.ts` -- Plain text parser tests
- [ ] `src/lib/ai/schemas/__tests__/documentary.test.ts` -- Zod schema validation tests
- [ ] `src/app/api/upload/__tests__/route.test.ts` -- Upload route tests
- [ ] `src/app/api/analyze/__tests__/route.test.ts` -- Analyze route tests (mocked LLM)
- [ ] `src/components/__tests__/analysis-report.test.ts` -- Report renderer tests
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

## Open Questions

1. **Streaming partial objects to client UI**
   - What we know: AI SDK 6 provides `partialOutputStream` for server-side streaming. `toTextStreamResponse()` sends to client.
   - What's unclear: The exact client-side pattern for consuming `partialOutputStream` as a progressive partial object in React components. The `useChat` hook handles chat messages, but structured object streaming may need a different approach (possibly `useObject` or manual stream consumption).
   - Recommendation: Prototype the client-side streaming consumption first. If `useChat` does not support partial object rendering natively, use a custom hook that consumes the text stream and parses partial JSON.

2. **Token cost for documentary transcript analysis**
   - What we know: Typical documentary transcript is 5,000-20,000 words (~7K-28K tokens input). Claude Sonnet 4.5 pricing applies.
   - What's unclear: Exact output token count for the structured analysis schema.
   - Recommendation: Log token usage from the first real analysis runs. Budget for ~2K-4K output tokens per analysis based on schema size.

3. **Next.js 16 vs 15 implications**
   - What we know: npm registry shows Next.js at 16.1.6, not 15.x as the stack research assumed.
   - What's unclear: Whether there are breaking changes from 15 to 16 that affect Route Handlers, App Router, or streaming patterns.
   - Recommendation: Use `create-next-app@latest` which will scaffold v16. The App Router API is stable across 15-16. Verify Route Handler patterns still work as documented after scaffolding.

## Sources

### Primary (HIGH confidence)
- [AI SDK Anthropic Provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) -- model IDs, structuredOutputMode, provider options
- [AI SDK Structured Data Generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) -- Output.object pattern, partialOutputStream
- [AI SDK 6.0 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- breaking changes from v5 to v6
- [Anthropic Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- native structured output support
- npm registry (2026-03-16) -- verified versions: next@16.1.6, ai@6.0.116, @ai-sdk/anthropic@3.0.58, zod@4.3.6

### Secondary (MEDIUM confidence)
- [Next.js create-next-app docs](https://nextjs.org/docs/app/api-reference/cli/create-next-app) -- scaffolding defaults
- [Next.js Route Handler docs](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- FormData handling
- [shadcn-dropzone](https://github.com/diragb/shadcn-dropzone) -- shadcn/ui compatible dropzone component
- [Vercel AI SDK Guide](https://dev.to/pockit_tools/vercel-ai-sdk-complete-guide-building-production-ready-ai-chat-apps-with-nextjs-4cp6) -- practical implementation patterns
- Prior project research: `.planning/research/ARCHITECTURE.md`, `PITFALLS.md`, `STACK.md`

### Tertiary (LOW confidence)
- Client-side partial object streaming pattern -- needs prototyping to confirm exact hook usage
- Next.js 16 breaking changes from 15 -- not explicitly researched; assumed backward compatible

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, AI SDK 6 API confirmed via official docs
- Architecture: HIGH -- patterns align with AI SDK 6 official docs and established Next.js App Router patterns
- Pitfalls: HIGH -- well-documented in prior research and confirmed by AI SDK migration guide (version confusion pitfall)
- Documentary analysis schema: MEDIUM -- schema design is domain-informed but untested against real transcripts
- Client-side streaming: MEDIUM -- server patterns confirmed, client consumption pattern needs prototyping

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (30 days -- stack is stable, AI SDK 6 is freshly released so watch for patches)
