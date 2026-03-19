# Phase 3: Analysis Expansion - Research

**Researched:** 2026-03-16
**Domain:** Zod structured output schemas, LLM prompt engineering, React report components
**Confidence:** HIGH

## Summary

Phase 3 extends the existing documentary analysis pattern to four additional project types: corporate interview, narrative film, TV/episodic, and short-form/branded. The existing codebase provides a complete, well-tested blueprint -- `documentary.ts` schema, `documentary.ts` prompt, `analysis-report.tsx` component, and `route.ts` API handler. Each new project type needs three artifacts (schema, prompt, report component) plus routing integration in the API route and page component.

The primary technical risk is NOT in the code architecture (the pattern is proven) but in the prompt engineering quality. Each project type serves a different professional domain with distinct analytical frameworks. The prompts must read as expert-level domain knowledge, not generic AI summaries. The schemas must capture domain-specific data shapes that enable useful report displays.

A secondary concern is the page component (`page.tsx`), which currently hardcodes `DocumentaryAnalysis` types and always sends `projectType: 'documentary'`. This needs refactoring to become project-type-aware, routing both the API call and the report component based on the selected tab.

**Primary recommendation:** Implement in two waves -- (1) all four schema+prompt pairs with API route routing, (2) all four report components with page integration and short-form sub-type toggle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Narrative Film uses ONE combined API call with single schema containing `story_structure` and `script_coverage` top-level sections
- Story structure includes specific beat identification (inciting incident, midpoint, act 2 break, dark night of soul, climax, resolution) with approximate position AND qualitative structural read (pacing, tension arc, strengths/weaknesses)
- Script coverage includes character analysis, conflict assessment, dialogue quality, marketability (logline quality, comp titles, commercial viability), and separate strengths/weaknesses section
- Narrative report uses existing Tabs component with Structure | Coverage tabs
- Corporate handles both external brand/marketing AND internal comms -- prompt adapts based on material
- Corporate core sections: soundbite extraction, key messaging themes, speaker effectiveness, message consistency
- TV/episodic accepts both pilot/spec scripts AND series bible/outline documents
- TV analysis always includes BOTH episode-level (cold open, A/B/C story, character intros, episode arc) AND series-level (premise longevity, serialized hooks, episodic vs serial balance, season arc)
- Short-form covers four subtypes: brand/hero films, social ads, explainers/product videos, event/recap films
- Short-form has a secondary input-type selector (Script/Storyboard | VO Transcript | Rough Outline) below project type tabs
- Short-form input type drives analytical lens in prompt
- Short-form core sections: hook strength, pacing assessment, messaging clarity, CTA effectiveness, emotional/rational balance
- Each project type gets its own report component: NarrativeReport, CorporateReport, TvReport, ShortFormReport
- Page routes to correct report component based on projectType
- Shared section sub-components can be reused where data shape matches

### Claude's Discretion
- Exact scoring scales / rating enumerations within schemas (model on documentary's `usefulness: enum['must-use', 'strong', 'supporting']` pattern)
- Persona depth and framing in each system prompt
- Exact section ordering within each report component
- Skeleton/loading states for new report components

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLYS-02 | Corporate interview projects receive key messaging analysis: usable soundbites, quote extraction, and messaging themes | Corporate schema with soundbites/themes/speaker effectiveness sections; prompt with brand/comms expert persona; CorporateReport component |
| ANLYS-03 | Narrative film projects receive story structure analysis: act breaks, turning points, pacing evaluation, and arc assessment | Narrative schema `story_structure` section with beat identification and qualitative pacing; prompt with story consultant persona |
| ANLYS-04 | Narrative film projects receive script coverage: character analysis, conflict assessment, dialogue quality, and marketability notes | Narrative schema `script_coverage` section with character/conflict/dialogue/marketability; same prompt as ANLYS-03 (single API call) |
| ANLYS-05 | TV/episodic projects receive episode arc and series structure analysis | TV schema with episode-level and series-level sections; prompt with TV development executive persona |
| ANLYS-06 | Short-form/branded projects receive tailored analysis: pacing, messaging effectiveness, and CTA clarity | Short-form schema with hook/pacing/messaging/CTA sections; prompt adapts to input type; sub-type toggle UI |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.3.6 | Schema definition for structured AI output | Already used for documentary schema; `.describe()` guides Claude's structured output |
| ai (Vercel AI SDK) | ^6.0.116 | `streamText` + `Output.object` for streaming structured output | Already used in analyze route |
| @ai-sdk/anthropic | ^3.0.58 | Anthropic provider for AI SDK | Already configured |
| @base-ui/react | ^1.3.0 | Tabs component (via shadcn) for narrative report | Already installed; Tabs component exists at `src/components/ui/tabs.tsx` |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 | Icons for report sections | Badge/category indicators in report components |
| class-variance-authority | ^0.7.1 | Variant styling | Badge variants in rating displays |

### No New Dependencies Required
This phase requires zero new npm packages. All infrastructure is already in place.

## Architecture Patterns

### Recommended File Structure
```
src/
├── lib/ai/
│   ├── schemas/
│   │   ├── documentary.ts        # EXISTS - blueprint
│   │   ├── corporate.ts          # NEW
│   │   ├── narrative.ts          # NEW
│   │   ├── tv-episodic.ts        # NEW
│   │   └── short-form.ts         # NEW
│   └── prompts/
│       ├── documentary.ts        # EXISTS - blueprint
│       ├── corporate.ts          # NEW
│       ├── narrative.ts          # NEW
│       ├── tv-episodic.ts        # NEW
│       └── short-form.ts         # NEW
├── components/
│   ├── analysis-report.tsx       # EXISTS - documentary report (rename optional)
│   ├── narrative-report.tsx      # NEW - tabs: Structure | Coverage
│   ├── corporate-report.tsx      # NEW
│   ├── tv-report.tsx             # NEW
│   ├── short-form-report.tsx     # NEW
│   ├── project-type-tabs.tsx     # MODIFY - remove placeholder, pass projectType down
│   └── report-sections/          # EXISTS - extend with new shared sections as needed
├── app/
│   ├── page.tsx                  # MODIFY - project-type-aware state and report routing
│   └── api/analyze/route.ts      # MODIFY - routing switch for schema/prompt per type
```

### Pattern 1: Schema Design (replicate documentary pattern)
**What:** Each schema is a `z.object()` with `.describe()` on every field. Top-level sections map to report cards.
**When to use:** Every new project type schema.
**Example:**
```typescript
// Source: src/lib/ai/schemas/documentary.ts (existing blueprint)
export const corporateAnalysisSchema = z.object({
  summary: z.object({
    overview: z.string().describe('2-3 sentence executive summary'),
    speakerCount: z.number().describe('Number of distinct speakers'),
    // ... domain-specific fields
  }),
  soundbites: z.array(z.object({
    quote: z.string().describe('Exact verbatim quote'),
    speaker: z.string(),
    context: z.string().describe('Why this soundbite is usable'),
    category: z.enum(['key-message', 'emotional', 'data-point', 'vision-statement']),
    usability: z.enum(['hero-quote', 'strong', 'supporting']),
  })).describe('8-15 most usable soundbites ranked by editorial value'),
  // ... more sections
});
export type CorporateAnalysis = z.infer<typeof corporateAnalysisSchema>;
```

### Pattern 2: Prompt Design (replicate documentary pattern)
**What:** Expert persona header + analytical framework sections + rules footer.
**When to use:** Every new project type prompt.
**Example structure:**
```typescript
export const narrativeSystemPrompt = `You are a senior script reader and story consultant with 20+ years...

## Your analytical framework:

### Story Structure Analysis
- Identify specific story beats...

### Script Coverage
- Evaluate character development...

## Rules:
- NEVER invent quotes...
- Be honest about weak material...`;
```

### Pattern 3: API Route Routing (extend existing switch)
**What:** Replace the `if (projectType !== 'documentary')` guard with a routing map.
**When to use:** Modify `src/app/api/analyze/route.ts` once.
**Example:**
```typescript
const schemaMap = {
  documentary: { schema: documentaryAnalysisSchema, prompt: documentarySystemPrompt },
  corporate: { schema: corporateAnalysisSchema, prompt: corporateSystemPrompt },
  narrative: { schema: narrativeAnalysisSchema, prompt: narrativeSystemPrompt },
  'tv-episodic': { schema: tvEpisodicAnalysisSchema, prompt: tvEpisodicSystemPrompt },
  'short-form': { schema: shortFormAnalysisSchema, prompt: shortFormSystemPrompt },
};

const config = schemaMap[projectType as keyof typeof schemaMap];
if (!config) {
  return new Response(JSON.stringify({ error: 'Unsupported project type' }), { status: 400 });
}
```

### Pattern 4: Report Component (replicate AnalysisReport pattern)
**What:** `{ data: Partial<T> | null, isStreaming: boolean }` props. Card-per-section layout. Skeleton fallback when data section is undefined (streaming).
**When to use:** Every new report component.
**Key detail:** Components MUST handle `Partial<T>` gracefully -- sections appear progressively as streaming fills in the JSON object.

### Pattern 5: Page-Level Report Routing
**What:** `page.tsx` needs to know the selected project type and route to the correct report component.
**Challenge:** Currently `ProjectTypeTabs` wraps the page content and only documentary tab shows real content. Need to refactor so ALL tabs show the upload+analyze+report flow, routing to the correct report component.
**Approach:** `ProjectTypeTabs` must expose the selected tab value. Page renders the correct report component based on `projectType` state. The API call sends the actual selected `projectType`.

### Pattern 6: Short-Form Sub-Type Toggle
**What:** When "Short-form / Branded" is selected, a secondary selector appears below the project type tabs.
**Options:** Script / Storyboard | VO Transcript | Rough Outline
**Integration:** The selected input type is sent to the API alongside `projectType: 'short-form'` and included in the prompt context to drive the analytical lens.

### Pattern 7: Tabs in Narrative Report (base-ui)
**What:** The NarrativeReport component uses the existing `Tabs` component for Structure | Coverage tab layout.
**API:** `<Tabs defaultValue="structure">`, `<TabsList>`, `<TabsTrigger value="structure">Structure</TabsTrigger>`, `<TabsTrigger value="coverage">Coverage</TabsTrigger>`, `<TabsContent value="structure">...</TabsContent>`, `<TabsContent value="coverage">...</TabsContent>`
**Source:** `src/components/ui/tabs.tsx` -- uses `@base-ui/react` Tabs primitive

### Anti-Patterns to Avoid
- **Generic prompts with find/replace:** Each project type needs genuinely crafted domain expertise in its prompt. Don't copy-paste the documentary prompt and swap words.
- **Unified report component with conditionals:** Don't build one giant report component with `if (projectType === 'narrative') ...` branches. Each type gets its own component.
- **Forgetting Partial<T> handling:** Report components receive progressively-filled data during streaming. Every section must gracefully handle `undefined` sub-objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured AI output | Custom JSON parsing of freeform LLM output | Zod schema + `Output.object` | AI SDK handles structured output mode, retries, and validation |
| Tab UI | Custom tab state management | `@base-ui/react` Tabs via `src/components/ui/tabs.tsx` | Already installed and themed |
| Streaming JSON parsing | Custom streaming parser | Progressive `JSON.parse` (existing pattern in `page.tsx`) | Simple, proven, already working |
| Skeleton loading | Custom loading states | `src/components/ui/skeleton.tsx` | Already used in existing report sections |

## Common Pitfalls

### Pitfall 1: Schema Too Deep for Structured Output
**What goes wrong:** Very deeply nested Zod schemas with many layers can cause Claude's structured output to fail or produce inconsistent results.
**Why it happens:** Structured output mode has practical complexity limits.
**How to avoid:** Keep schemas 2-3 levels deep maximum. Prefer arrays of flat objects over deeply nested trees. The documentary schema is a good depth benchmark -- don't go significantly deeper.
**Warning signs:** AI returns incomplete objects or errors during streaming.

### Pitfall 2: Streaming Partial Rendering Crashes
**What goes wrong:** Report component tries to `.map()` on an array that's undefined during streaming, causing runtime errors.
**Why it happens:** `Partial<T>` means any property could be undefined. Arrays that exist in the full type are `undefined` until streaming reaches them.
**How to avoid:** Always guard with `if (!data?.section)` and render Skeleton. Follow the existing `QuotesSection` pattern which renders Skeleton when `data` is undefined.
**Warning signs:** Runtime errors during streaming, blank screen mid-analysis.

### Pitfall 3: projectType String Mismatch
**What goes wrong:** Schema/prompt routing fails because the project type ID string doesn't match between `PROJECT_TYPES` config, the API route, and the page component.
**Why it happens:** IDs like `tv-episodic` and `short-form` contain hyphens.
**How to avoid:** Always reference `PROJECT_TYPES[key].id` as the source of truth. Use the exact IDs: `documentary`, `corporate`, `narrative`, `tv-episodic`, `short-form`.
**Warning signs:** 400 errors from API when switching project types.

### Pitfall 4: Page State Not Resetting on Type Switch
**What goes wrong:** User switches from documentary to narrative tab and sees stale documentary analysis data rendered in the narrative report component.
**Why it happens:** `analysisData` state is typed as `Partial<DocumentaryAnalysis>` and persists across tab switches.
**How to avoid:** Clear analysis state when project type changes. Use a union type or `unknown` for the analysis data state, cast at the report component level.
**Warning signs:** Type mismatch errors, wrong data shape in wrong report.

### Pitfall 5: Prompt Not Domain-Authentic
**What goes wrong:** Analysis reads like generic AI summary instead of professional domain feedback.
**Why it happens:** Prompt was templated from another type instead of independently crafted.
**How to avoid:** Each prompt should be written with genuine domain vocabulary. Script coverage uses terms like "logline", "comp titles", "marketability". Corporate uses "key messaging", "brand voice", "message pull". TV uses "cold open", "A/B/C story", "serialized hooks".
**Warning signs:** Output reads the same regardless of project type.

### Pitfall 6: Short-Form Input Type Not Reaching Prompt
**What goes wrong:** Short-form analysis doesn't adapt to the selected input type (Script vs VO Transcript vs Outline).
**Why it happens:** The sub-type toggle value isn't included in the API request body or isn't interpolated into the prompt.
**How to avoid:** Pass `inputType` alongside `text` and `projectType` in the API request. The short-form prompt should reference the input type to adjust its analytical lens.
**Warning signs:** Same analysis output regardless of input type selection.

## Code Examples

### Schema Pattern (from existing documentary.ts)
```typescript
// Source: src/lib/ai/schemas/documentary.ts
// Key pattern: .describe() on every field guides Claude's structured output
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
  // ... more sections
});
```

### Report Component Pattern (from existing analysis-report.tsx)
```typescript
// Source: src/components/analysis-report.tsx
// Key pattern: Partial<T> props, Card-per-section, delegate to sub-components
interface AnalysisReportProps {
  data: Partial<DocumentaryAnalysis> | null;
  isStreaming: boolean;
}

export function AnalysisReport({ data, isStreaming }: AnalysisReportProps) {
  if (!data && !isStreaming) {
    return <p className="text-sm text-muted-foreground">Upload a transcript...</p>;
  }
  return (
    <div className="space-y-6">
      {isStreaming && <p className="text-sm text-muted-foreground">Analyzing...</p>}
      <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent><SummarySection data={data?.summary} /></CardContent>
      </Card>
      {/* ... more sections */}
    </div>
  );
}
```

### Tabs Usage (for NarrativeReport)
```typescript
// Source: src/components/ui/tabs.tsx (base-ui Tabs primitive)
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Usage in NarrativeReport:
<Tabs defaultValue="structure">
  <TabsList>
    <TabsTrigger value="structure">Structure</TabsTrigger>
    <TabsTrigger value="coverage">Coverage</TabsTrigger>
  </TabsList>
  <TabsContent value="structure">
    {/* Story beats + qualitative pacing sections */}
  </TabsContent>
  <TabsContent value="coverage">
    {/* Character, conflict, dialogue, marketability sections */}
  </TabsContent>
</Tabs>
```

### API Route Routing Pattern
```typescript
// Extend src/app/api/analyze/route.ts
import { corporateAnalysisSchema } from '@/lib/ai/schemas/corporate';
import { corporateSystemPrompt } from '@/lib/ai/prompts/corporate';
// ... imports for all types

const analysisConfig: Record<string, { schema: z.ZodType; prompt: string }> = {
  documentary: { schema: documentaryAnalysisSchema, prompt: documentarySystemPrompt },
  corporate: { schema: corporateAnalysisSchema, prompt: corporateSystemPrompt },
  narrative: { schema: narrativeAnalysisSchema, prompt: narrativeSystemPrompt },
  'tv-episodic': { schema: tvEpisodicAnalysisSchema, prompt: tvEpisodicSystemPrompt },
  'short-form': { schema: shortFormAnalysisSchema, prompt: shortFormSystemPrompt },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Freeform LLM output + manual JSON parsing | `Output.object({ schema })` structured output | Vercel AI SDK v4+ | Eliminates parsing errors, schema validation built-in |
| Multiple API calls for related analysis | Single structured output call with multi-section schema | Current best practice | Reduces latency, ensures cross-referenced analysis |
| Generic AI prompts | Domain-expert persona prompts with analytical frameworks | Industry standard | Dramatically improves output quality and domain relevance |

## Open Questions

1. **Page-level state architecture for multi-type support**
   - What we know: Currently `page.tsx` hardcodes `DocumentaryAnalysis` type and `projectType: 'documentary'`. Need to support all 5 types.
   - What's unclear: Whether to use a union type for analysis data state or use `unknown` with runtime casting.
   - Recommendation: Use a discriminated union or `Record<string, unknown>` at the page level. Each report component casts to its own type. Simpler: store `analysisData` as `Record<string, unknown> | null` and let each report component accept and cast. This avoids importing all 5 schema types into page.tsx.

2. **ProjectTypeTabs refactoring scope**
   - What we know: Currently renders placeholder for non-documentary tabs. Needs to render full upload+analyze+report flow for all types.
   - What's unclear: Whether to keep ProjectTypeTabs as a wrapper or refactor to expose selectedType as state.
   - Recommendation: Convert `ProjectTypeTabs` to expose the selected tab value via callback (`onTypeChange`). Page manages `projectType` state and renders content (upload, analyze button, report) inside a single TabsContent area OR duplicate the content per tab. Simpler approach: lift `projectType` state to page, pass to ProjectTypeTabs as controlled component, render all content once (not per-tab) with report component switch.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANLYS-02 | Corporate schema validates well-formed data, rejects invalid | unit | `npx vitest run src/lib/ai/schemas/__tests__/corporate.test.ts -x` | No - Wave 0 |
| ANLYS-03 | Narrative schema validates story_structure section | unit | `npx vitest run src/lib/ai/schemas/__tests__/narrative.test.ts -x` | No - Wave 0 |
| ANLYS-04 | Narrative schema validates script_coverage section | unit | `npx vitest run src/lib/ai/schemas/__tests__/narrative.test.ts -x` | No - Wave 0 (same file as ANLYS-03) |
| ANLYS-05 | TV schema validates episode + series level sections | unit | `npx vitest run src/lib/ai/schemas/__tests__/tv-episodic.test.ts -x` | No - Wave 0 |
| ANLYS-06 | Short-form schema validates hook/pacing/messaging/CTA sections | unit | `npx vitest run src/lib/ai/schemas/__tests__/short-form.test.ts -x` | No - Wave 0 |
| ROUTE | API route dispatches correct schema/prompt per projectType | unit | `npx vitest run src/app/api/analyze/__tests__/route.test.ts -x` | Yes - needs update |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai/schemas/__tests__/corporate.test.ts` -- covers ANLYS-02
- [ ] `src/lib/ai/schemas/__tests__/narrative.test.ts` -- covers ANLYS-03, ANLYS-04
- [ ] `src/lib/ai/schemas/__tests__/tv-episodic.test.ts` -- covers ANLYS-05
- [ ] `src/lib/ai/schemas/__tests__/short-form.test.ts` -- covers ANLYS-06
- [ ] Update `src/app/api/analyze/__tests__/route.test.ts` -- verify routing for all 5 types

## Sources

### Primary (HIGH confidence)
- `src/lib/ai/schemas/documentary.ts` -- Blueprint schema pattern (read directly)
- `src/lib/ai/prompts/documentary.ts` -- Blueprint prompt pattern (read directly)
- `src/components/analysis-report.tsx` -- Blueprint report component (read directly)
- `src/app/api/analyze/route.ts` -- Blueprint API route (read directly)
- `src/components/ui/tabs.tsx` -- Tabs component API (read directly)
- `src/app/page.tsx` -- Current page state management (read directly)
- `src/components/project-type-tabs.tsx` -- Current tab routing (read directly)
- `src/lib/types/project-types.ts` -- Project type IDs (read directly)
- `package.json` -- All dependency versions (read directly)

### Secondary (MEDIUM confidence)
- None needed -- all patterns derived from existing codebase

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns from existing code
- Architecture: HIGH -- direct replication of proven documentary pattern x4
- Pitfalls: HIGH -- derived from reading actual code and identifying concrete integration points
- Prompt engineering quality: MEDIUM -- domain authenticity is subjective and can only be validated through manual review of outputs

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no external dependency changes expected)
