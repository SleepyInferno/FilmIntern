# Phase 3: Analysis Expansion - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add four remaining project type analyses (corporate interview, narrative film, TV/episodic, short-form/branded). Each type gets its own Zod schema, system prompt, and type-specific report display component. Documentary is already complete and serves as the design blueprint. This phase does NOT include export, document generation, or any output beyond on-screen display.

</domain>

<decisions>
## Implementation Decisions

### Narrative Film — Analysis Shape
- One combined API call (not two separate passes)
- Single schema with two top-level sections: `story_structure` and `script_coverage`
- Story structure section includes BOTH:
  - Specific beat identification: named beats (inciting incident, midpoint, act 2 break, dark night of the soul, climax, resolution) with approximate position (page number or early/middle/late)
  - Qualitative structural read: overall pacing assessment, tension arc, structural strengths and weaknesses
- Script coverage section includes:
  - Industry-standard coverage: character analysis, conflict assessment, dialogue quality, marketability (logline quality, comp titles, commercial viability)
  - Strengths / weaknesses section: what's working dramatically vs what needs revision — separate from marketability lens

### Narrative Film — Report Display
- Type-specific `NarrativeReport` component
- Two tabs: **Structure** | **Coverage** — using existing Tabs component (`src/components/ui/tabs.tsx`)
- Structure tab: story beats + qualitative pacing read
- Coverage tab: character, conflict, dialogue, marketability, strengths/weaknesses

### Corporate Interview — Scope
- Handles both external brand/marketing videos AND internal comms/executive interviews
- Analysis adapts its lens based on what the material reveals (brand context vs internal context)
- Core sections: soundbite extraction (quotable moments), key messaging themes, speaker effectiveness, message consistency across speakers
- Similar to documentary in structure but different goal: usability for brand/comms editor, not narrative documentarian

### TV/Episodic — Input Handling
- Accepts both: pilot/spec episode scripts AND series bible/outline documents
- Analysis adapts based on detected input type — the prompt identifies what it's reading
- Always includes BOTH levels:
  - Episode-level: cold open effectiveness, A/B/C story structure, character introductions, episode arc
  - Series-level: premise longevity, serialized hooks, episodic vs serial balance, season arc potential

### Short-form / Branded — Sub-type Toggle
- Covers all four subtypes: brand/hero films, social ads (:30-:60), explainers/product videos, event/recap films
- A secondary input-type selector appears below the project type tabs when "Short-form / Branded" is selected
- Toggle options: **Script / Storyboard** | **VO Transcript** | **Rough Outline**
- Selected input type is passed to the API and drives the analytical lens used in the prompt
- Core analysis sections regardless of input type: hook strength, pacing assessment, messaging clarity, CTA effectiveness, emotional/rational balance

### Report Display — Architecture
- Each project type gets its own type-specific report component (no generic unified layout)
- Components: `NarrativeReport`, `CorporateReport`, `TvReport`, `ShortFormReport` alongside existing `AnalysisReport` (documentary)
- The page component routes to the correct report component based on `projectType`
- Shared section sub-components (quotes, themes) can be reused where the data shape matches

### Claude's Discretion
- Exact scoring scales or rating enumerations within each schema (model on documentary's `usefulness: enum['must-use', 'strong', 'supporting']` pattern)
- Persona depth and framing in each system prompt — modeled on documentary's "senior professional with 20+ years" approach but adapted to each domain
- Exact section ordering within each report component
- Skeleton/loading states for the new report components

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing pattern to replicate
- `src/lib/ai/schemas/documentary.ts` — Blueprint Zod schema structure; all new schemas should follow this pattern
- `src/lib/ai/prompts/documentary.ts` — Blueprint system prompt style; expert persona, analytical framework sections, explicit rules
- `src/components/analysis-report.tsx` — Blueprint report component; Card-per-section layout, streaming-aware
- `src/app/api/analyze/route.ts` — Blueprint analyze route; streamText + Output.object pattern, projectType routing

### Project types
- `src/lib/types/project-types.ts` — All five project type configs; new schemas/prompts must map to these IDs exactly

### UI components available
- `src/components/ui/tabs.tsx` — Tabs component for narrative report's Structure | Coverage tab layout
- `src/components/ui/card.tsx` — Card component used in all report sections
- `src/components/ui/badge.tsx` — Badge component for category/rating chips

### Requirements
- `.planning/REQUIREMENTS.md` §ANLYS-02 through ANLYS-06 — Acceptance criteria for each project type analysis

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/tabs.tsx`: Ready-made Tabs component — use for narrative report's Structure | Coverage split
- `src/components/ui/card.tsx`: Used in every existing report section — continue the same pattern
- `src/components/ui/badge.tsx`: Used for category/usefulness chips in quotes — reuse for similar rating displays
- `src/components/report-sections/quotes-section.tsx`: Quote display pattern — potentially reusable for corporate soundbites if schema shape matches
- `src/components/report-sections/themes-section.tsx`: Theme display pattern — potentially reusable for corporate messaging themes

### Established Patterns
- Schema pattern: Zod schema with `.describe()` on every field for Claude structured output guidance
- Prompt pattern: expert persona header + `## Analytical framework` sections + `## Rules` footer
- Route pattern: `streamText` + `Output.object({ schema })` + `toTextStreamResponse()`
- Streaming consumption: client uses progressive `JSON.parse` (not AI SDK React hooks) — new report components must also handle `Partial<T>` data during streaming
- Report component pattern: `{ data: Partial<T> | null, isStreaming: boolean }` props

### Integration Points
- `src/app/api/analyze/route.ts`: Currently returns 400 for any non-documentary projectType — Phase 3 extends this with a routing switch per project type
- `src/app/page.tsx`: Houses the report area — needs to route to the correct report component based on selected project type
- `src/components/project-type-tabs.tsx`: Currently selects project type — short-form sub-type toggle appears conditionally below this when short-form is selected

</code_context>

<specifics>
## Specific Ideas

- "Prompt engineering is the core IP — each project type needs independent design, not template variations" (from STATE.md — each prompt should be genuinely crafted for the domain, not copy-paste with find/replace)
- Corporate handles both external brand and internal comms — the prompt should not assume either; let the material reveal its context
- TV analysis always evaluates at both episode AND series level — "is this premise sustainable for multiple seasons?" is always a valid question even for a spec
- Short-form input toggle lives BELOW the project type selector row — appears conditionally only when short-form is selected; drives the analytical lens passed to the API

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-analysis-expansion*
*Context gathered: 2026-03-16*
