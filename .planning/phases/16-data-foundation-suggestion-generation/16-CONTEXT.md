# Phase 16: Data Foundation + Suggestion Generation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Schema, DB migration, FDX preservation, suggestion generation API, and results displayed on the revision page. This phase produces the data layer and the end-to-end generation flow. Accept/reject UI is Phase 17. Merge and export are Phase 18.

</domain>

<decisions>
## Implementation Decisions

### Suggestion data shape
- Each suggestion carries: scene heading, speaker/character name (if applicable), exact original text span being rewritten, proposed rewrite text, and a weakness reference (`{ category: string, label: string }`) — e.g. `{ category: 'storyStructure', label: 'Structural weakness: Act 2 break is weak' }`
- No ranking or priority field — generation order is sufficient for display
- Display order = insertion order from the generation run

### Database storage
- Claude's discretion — own `suggestions` table (with `projectId` foreign key) is preferred over a JSON column because Phase 17 requires per-suggestion accept/reject state. Normalizing now avoids unwieldy JSON mutation later.

### FDX preservation
- Raw FDX XML is saved at upload time (not at suggestion generation time)
- Stored in a new nullable `fdxSource TEXT` column on the `projects` table
- Only populated for `.fdx` uploads; null for all other file types
- Migration pattern: try/catch `ALTER TABLE projects ADD COLUMN fdxSource TEXT` (consistent with existing migrations)

### Generation trigger & count UX
- Revision page has a number input (default 10) and a "Generate Suggestions" button
- Suggestions stream in progressively: one card appears per suggestion as each individual AI call completes (not a single bulk stream)
- When the page loads with existing suggestions, those are displayed immediately; a "Regenerate" option is available but does not auto-run
- Regeneration replaces all existing suggestions for the project (clear + insert, not accumulate)

### Analysis-to-suggestion mapping
- The full `analysisData` JSON is passed to the suggestion prompt (not just extracted weaknesses) — gives the AI full context for informed rewrites
- Per-project-type suggestion prompts — one prompt file per type (narrative, tv-episodic, documentary, corporate), consistent with the established `src/lib/ai/prompts/` pattern
- Each suggestion AI call targets one weakness; the count parameter drives how many calls are made

### Claude's Discretion
- Whether suggestions table uses UUID or the existing `generateId()` pattern
- Exact API route path for suggestion generation (e.g. `/api/suggestions` or `/api/projects/[id]/suggestions`)
- Error handling for partial generation failures (some suggestions succeed, some fail)
- Max allowed count value (prevent runaway API costs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database patterns
- `src/lib/db.ts` — Existing schema, migration pattern (try/catch ALTER TABLE), `generateId()`, `ProjectRow` interface

### Analysis architecture
- `src/app/api/analyze/route.ts` — Established pattern for AI streaming calls (streamText, provider registry, per-type config)
- `src/lib/ai/prompts/narrative.ts` — Reference prompt structure to follow for suggestion prompts
- `src/lib/ai/schemas/narrative.ts` — Analysis schema structure; suggestions must reference weakness fields from these schemas

### Revision page shell
- `src/app/revision/[projectId]/page.tsx` — Phase 15 shell; suggestion generation panel replaces the "Suggestion generation will appear here" placeholder

### Requirements
- `.planning/REQUIREMENTS.md` — SUGG-01 through SUGG-06 are all in scope for this phase

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai/provider-registry.ts` + `buildRegistry()`: Reuse for suggestion generation API calls — same provider selection logic
- `src/lib/ai/settings.ts` + `loadSettings()`: Reuse for reading provider/model config
- `src/app/api/analyze/route.ts` streaming pattern: Reference for how to structure the suggestion generation API route
- `src/components/ui/Card`, `Skeleton`, `buttonVariants`: Available for suggestion card UI
- `generateId()` in `src/lib/db.ts`: Use for suggestion IDs

### Established Patterns
- AI calls: `streamText` with per-type config map (`analysisConfig` pattern) → apply same for `suggestionConfig`
- DB migrations: try/catch `ALTER TABLE` — use for `fdxSource` column
- Streaming consumption: progressive JSON.parse (not AI SDK React hooks) — reference for how the client handles streamed suggestions
- Per-type prompt files: `src/lib/ai/prompts/{type}.ts` — create matching `src/lib/ai/prompts/{type}-suggestion.ts` files

### Integration Points
- `/api/projects/[id]` (GET): Revision page already calls this to load project data — suggestions can be included in the response or fetched via a separate endpoint
- Upload flow: FDX `fdxSource` must be captured and saved when the file is parsed — find where `uploadData` is populated to add `fdxSource` alongside it
- Revision page `src/app/revision/[projectId]/page.tsx`: The "Suggestion generation will appear here" placeholder card is the integration point for the generation UI

</code_context>

<specifics>
## Specific Ideas

- Each suggestion is a separate AI call (not one bulk generation call) — one call per weakness, up to the requested count
- Suggestions stream in one at a time as they complete, giving a visible "cards appearing" effect
- The revision page leads with existing suggestions when they exist; the generate/regenerate control is secondary on return visits

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-data-foundation-suggestion-generation*
*Context gathered: 2026-03-21*
