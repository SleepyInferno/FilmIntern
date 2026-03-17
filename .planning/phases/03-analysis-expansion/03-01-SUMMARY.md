---
phase: 03-analysis-expansion
plan: 01
subsystem: ai
tags: [zod, schemas, prompts, api-routing, structured-output]

# Dependency graph
requires:
  - phase: 01-vertical-slice
    provides: documentary schema/prompt blueprint pattern, API analyze route
provides:
  - Corporate analysis Zod schema and expert system prompt
  - Narrative analysis Zod schema (story structure + script coverage) and expert system prompt
  - TV/episodic analysis Zod schema (episode + series level) and expert system prompt
  - Short-form analysis Zod schema and expert system prompt with inputType support
  - API route routing via analysisConfig map for all 5 project types
affects: [03-02, 04-export-and-document-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [analysisConfig routing map, inputType context injection for short-form]

key-files:
  created:
    - src/lib/ai/schemas/corporate.ts
    - src/lib/ai/schemas/narrative.ts
    - src/lib/ai/schemas/tv-episodic.ts
    - src/lib/ai/schemas/short-form.ts
    - src/lib/ai/prompts/corporate.ts
    - src/lib/ai/prompts/narrative.ts
    - src/lib/ai/prompts/tv-episodic.ts
    - src/lib/ai/prompts/short-form.ts
    - src/lib/ai/schemas/__tests__/corporate.test.ts
    - src/lib/ai/schemas/__tests__/narrative.test.ts
    - src/lib/ai/schemas/__tests__/tv-episodic.test.ts
    - src/lib/ai/schemas/__tests__/short-form.test.ts
  modified:
    - src/app/api/analyze/route.ts
    - src/app/api/analyze/__tests__/route.test.ts

key-decisions:
  - "Used z.ZodObject<any> for analysisConfig type to accommodate different schema shapes"
  - "Short-form inputType prepended as [Input Type: X] prefix in user prompt rather than system prompt"

patterns-established:
  - "analysisConfig: Record<string, { schema, prompt }> for multi-type API dispatch"
  - "Each project type gets independent schema and prompt -- no shared/generic abstractions"

requirements-completed: [ANLYS-02, ANLYS-03, ANLYS-04, ANLYS-05, ANLYS-06]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 3 Plan 01: Schemas, Prompts, and API Routing Summary

**4 domain-specific Zod schemas and expert system prompts with analysisConfig routing map enabling all 5 project types through the analyze API**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T10:52:38Z
- **Completed:** 2026-03-17T10:58:12Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Created 4 new Zod schemas (corporate, narrative, tv-episodic, short-form) with .describe() annotations on every field
- Created 4 domain-expert system prompts with unique analytical frameworks and authentic vocabulary
- Replaced documentary-only API guard with analysisConfig routing map dispatching correct schema+prompt per project type
- Added inputType context injection for short-form content analysis
- All 74 tests pass (20 new schema tests + 10 route tests including 7 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create all four schemas and prompts with test scaffolds** - `a39f2ef` (feat)
2. **Task 2: Wire API route routing and update route tests** - `9599d7d` (feat)

## Files Created/Modified
- `src/lib/ai/schemas/corporate.ts` - Corporate analysis Zod schema (soundbites, messaging themes, speaker effectiveness)
- `src/lib/ai/schemas/narrative.ts` - Narrative analysis Zod schema (story structure beats + script coverage with marketability)
- `src/lib/ai/schemas/tv-episodic.ts` - TV/episodic analysis Zod schema (episode-level + series-level analysis)
- `src/lib/ai/schemas/short-form.ts` - Short-form analysis Zod schema (hook, pacing, messaging, CTA, emotional balance)
- `src/lib/ai/prompts/corporate.ts` - Brand strategist persona prompt for corporate interview analysis
- `src/lib/ai/prompts/narrative.ts` - Script reader persona prompt combining structural beats and coverage
- `src/lib/ai/prompts/tv-episodic.ts` - Development executive persona prompt for episode + series evaluation
- `src/lib/ai/prompts/short-form.ts` - Creative director persona prompt with input type adaptation
- `src/lib/ai/schemas/__tests__/corporate.test.ts` - Corporate schema validation tests
- `src/lib/ai/schemas/__tests__/narrative.test.ts` - Narrative schema validation tests (storyStructure + scriptCoverage)
- `src/lib/ai/schemas/__tests__/tv-episodic.test.ts` - TV/episodic schema validation tests (episodeAnalysis + seriesAnalysis)
- `src/lib/ai/schemas/__tests__/short-form.test.ts` - Short-form schema validation tests
- `src/app/api/analyze/route.ts` - Multi-type routing via analysisConfig map, inputType handling
- `src/app/api/analyze/__tests__/route.test.ts` - Route tests for all 5 types plus inputType forwarding

## Decisions Made
- Used `z.ZodObject<any>` for the analysisConfig type annotation since each schema has a different shape and `typeof documentaryAnalysisSchema` would reject the others
- Short-form inputType is prepended to the user prompt as `[Input Type: X]` rather than injected into the system prompt, keeping the system prompt stable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 schemas define the data contracts that report components (Plan 03-02) will render
- All prompts are ready for production use via the API route
- API route accepts all 5 project types -- report display components are the remaining gap

---
*Phase: 03-analysis-expansion*
*Completed: 2026-03-17*
