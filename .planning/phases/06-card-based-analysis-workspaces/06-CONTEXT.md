# Phase 6: Card-Based Analysis Workspaces - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign all 5 project type analysis report views as named workspace experiences with evaluation dimension cards specific to each project type. The card names per project type are fixed in WORK-01 through WORK-05. This phase changes what renders inside the "Report" tab of DocumentWorkspace — the overall DocumentWorkspace tab structure (Report / Outline / Treatment tabs from Phase 4) is preserved.

</domain>

<decisions>
## Implementation Decisions

### Card Content
- Cards render **structured rich data** — schema fields are displayed meaningfully with badges and ratings, not dumped as prose
- Examples: Key Quotes card shows quotes with `[must-use]` / `[strong]` / `[supporting]` usefulness badges; Story Structure card shows a beat list with name, page position, and effectiveness badge per row
- For cards with dense nested data (e.g., Character Arcs with multiple characters, each with arc assessment + strengths/weaknesses), show **top 3 items** with a "Show more" toggle to reveal the rest
- **Story Structure beats are interactive**: each beat row (name + position + effectiveness badge) is clickable and expands inline to show the beat's `description` text (this field already exists in the narrative schema — no prompt changes needed)

### Card Expand/Collapse
- All cards are **collapsible** — clicking the card header toggles collapsed/expanded
- Cards **start expanded by default** on every load
- Collapse state is **not persisted** — resets to all-expanded each time the workspace loads (Library persistence is Phase 7 scope)

### Workspace Header
- Each workspace has a **named header** above the card grid: workspace title + project type chip + numeric overall quality score
- Format: `Story Lab Workspace  [Narrative Film]  8.0 / 10`
- The overall quality score (float, 1–10) requires adding an `overallScore: z.number()` field (and an `overallSummary: z.string()` for context) to each project type's Zod schema and prompt
- **Workspace names** (locked): Narrative Film → "Story Lab Workspace", Documentary → "Documentary Workspace"
- **Workspace names** (Claude's discretion): Corporate Interview, TV/Episodic, Short-Form/Branded — pick thematic professional names matching the "Story Lab" register

### Streaming / Progressive Reveal
- Cards **appear progressively** as data streams in — a card becomes visible when its schema section has enough data to render
- Cards whose data has not yet arrived show a skeleton shimmer placeholder
- A **subtle status bar** appears above the card grid during streaming: "Analyzing • Extracting key quotes..." updates as each section completes, disappears when streaming ends
- This extends the existing progressive `JSON.parse` streaming pattern already used in the app

### Claude's Discretion
- Exact workspace names for Corporate Interview, TV/Episodic, and Short-Form/Branded
- Visual design of the collapsible card header toggle (chevron, arrow, or similar)
- Color/style of the overall quality score badge (match the existing badge pattern)
- Exact "Show more" / "Show less" wording and visual treatment
- Status bar copy during streaming (section label phrasing)
- How to determine which cards are "ready" during streaming (threshold for rendering vs skeleton)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §WORK-01 through WORK-05 — Exact card names per project type (locked — these are the evaluation dimension names that must appear)
- `.planning/PROJECT.md` — Milestone v1.1 goals, product principles

### Existing analysis schemas (need `overallScore` + `overallSummary` additions)
- `src/lib/ai/schemas/narrative.ts` — Narrative schema; add `overallScore` and `overallSummary` at top level
- `src/lib/ai/schemas/documentary.ts` — Documentary schema; same addition
- `src/lib/ai/schemas/corporate.ts` — Corporate schema; same addition
- `src/lib/ai/schemas/tv-episodic.ts` — TV/Episodic schema; same addition
- `src/lib/ai/schemas/short-form.ts` — Short-form schema; same addition

### Existing prompts (need overall assessment instruction added)
- `src/lib/ai/prompts/narrative.ts` — Add instruction to generate overall score and summary
- `src/lib/ai/prompts/documentary.ts` — Same
- `src/lib/ai/prompts/corporate.ts` — Same
- `src/lib/ai/prompts/tv-episodic.ts` — Same
- `src/lib/ai/prompts/short-form.ts` — Same

### Existing report components (being replaced/redesigned)
- `src/components/analysis-report.tsx` — Current documentary report; Phase 6 replaces with card-based workspace
- `src/components/narrative-report.tsx` — Current narrative report; replaced
- `src/components/corporate-report.tsx` — Current corporate report; replaced
- `src/components/tv-report.tsx` — Current TV report; replaced
- `src/components/short-form-report.tsx` — Current short-form report; replaced

### Integration surface
- `src/components/document-workspace.tsx` — DocumentWorkspace wraps the Report tab; Phase 6 replaces what renders inside the Report tab content area
- `src/app/page.tsx` — Main page that routes to report components based on projectType; will route to new workspace components
- `src/components/ui/card.tsx` — Existing card component with subtle elevation styling (Phase 5); reuse as workspace card base
- `src/components/ui/badge.tsx` — Badge component for usefulness/effectiveness labels
- `src/components/ui/skeleton.tsx` — Skeleton shimmer for loading cards during streaming

### Phase 5 decisions (carry forward)
- `.planning/phases/05-ui-theme-brand-system/05-CONTEXT.md` — Card style (subtle elevation: thin border + box-shadow), grid layout (2-3 column responsive, single column mobile), theme token system

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx`: Already styled with subtle elevation from Phase 5 — use as the base for each evaluation dimension card
- `src/components/ui/badge.tsx`: Used for `usefulness` and `effectiveness` labels throughout existing reports — continue the same badge color conventions (green=strong, secondary=adequate, destructive=weak)
- `src/components/ui/skeleton.tsx`: Available for card loading states during streaming
- `src/components/report-sections/quotes-section.tsx`: Existing quote display with badge rendering — reference for the Key Quotes card implementation
- `src/components/report-sections/themes-section.tsx`: Existing theme display pattern — reference for Recurring Themes card
- `src/components/report-sections/moments-section.tsx`: Existing key moments pattern — reference for Key Moments card

### Established Patterns
- Streaming consumption: `page.tsx` uses progressive `JSON.parse` on streamed response; new workspace components receive `data: Partial<T> | null` and `isStreaming: boolean` props — same pattern as current report components
- Badge color convention: green for strong/must-use/compelling, secondary for adequate/serviceable, destructive for weak/needs-work/underdeveloped
- Schema field `description` on beats already exists in `narrative.ts` — beat click-to-expand uses existing data without prompt changes
- Project type routing: `page.tsx` switches on `projectType` to select the report component — Phase 6 continues this pattern with new workspace components

### Integration Points
- `src/components/document-workspace.tsx`: The Report tab renders a report component passed as content — Phase 6 replaces the report component, not the tab wrapper
- `src/app/page.tsx`: Switches on `projectType` to select which report component renders — update this switch to route to new workspace components
- `src/app/api/analyze/route.ts`: No changes needed to the route itself — schema changes flow through existing structured output pipeline

</code_context>

<specifics>
## Specific Ideas

- Story Structure beats: each row shows `[Beat Name]  [p.12]  [strong badge]` — clicking the row (or badge) expands inline to reveal the beat's description text. Data already in schema, no backend changes beyond the overall score addition.
- Status bar during streaming: "Analyzing • Extracting key quotes..." style — non-intrusive, disappears on completion
- Card grid layout carried forward from Phase 5 deferred decision: 2-3 column responsive grid, single column on mobile

</specifics>

<deferred>
## Deferred Ideas

- Score/rating visualizations (circular gauges, dimension radar charts) — future enhancement (WORK-06 in Future Requirements)
- User annotation of individual cards (WORK-07)
- Collapse state persistence per analysis — Phase 7 / Library scope

</deferred>

---

*Phase: 06-card-based-analysis-workspaces*
*Context gathered: 2026-03-18*
