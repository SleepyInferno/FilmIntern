# Project Research Summary

**Project:** FilmIntern v3.0 — AI Rewrite Suggestions, Tracked Changes UI, FDX Export
**Domain:** AI-driven script improvement workflow for an existing filmmaking analysis tool
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

FilmIntern v3.0 extends an already-working analysis pipeline with a complete "suggest and review" loop: the app analyses a script, the AI generates targeted rewrite suggestions grounded in the analysis findings, the user reviews those suggestions in a tracked-changes UI, and the revised script exports in multiple formats including FDX (Final Draft). The core competitive differentiator is that suggestions are automatically derived from the structured analysis output, with explicit rationale linking each suggestion to the specific weakness it addresses — no existing tool in the market (Scriptmatix, Arc Studio, Final Draft) combines structured analysis and targeted rewriting in a single tracked-changes flow.

The recommended approach is minimal dependency addition (one new package: `diff-match-patch-es`), maximum reuse of the existing stack (AI SDK 6, fast-xml-parser XMLBuilder, Playwright, docx library), and strict adherence to the architectural patterns already established in the codebase (JSON blob storage, progressive JSON streaming, tab-based workspace). The four Tiptap packages currently in package.json should be removed — they are unused and the tracked-changes use case is review-only accept/reject, not free-form editing, making a lightweight custom component the correct and much leaner solution. The implementation follows a clean four-phase build order where each phase delivers a usable, independently validatable increment.

The primary technical risks are concentrated in two areas: FDX write-back fidelity (the existing parser discards structural metadata that export requires) and suggestion merge correctness (character offset drift corrupts multi-suggestion merges). Both risks are well-understood and have clear mitigation strategies identified in research. The FDX infrastructure must be built first as it is a prerequisite for the export phase, and the suggestion data model must use exact text-span anchoring rather than character offsets from the very beginning — retrofitting this later is expensive.

## Key Findings

### Recommended Stack

The existing stack handles everything except diff computation. The project already has fast-xml-parser (for FDX read and write), AI SDK 6 with `generateObject` and Zod for structured output, Playwright for PDF export, and the docx library for Word export. The only new dependency is `diff-match-patch-es` (~15KB minified), an ESM-native TypeScript rewrite of Google's diff-match-patch by Anthony Fu. It is the correct choice over the unmaintained original `diff-match-patch` (not ESM, no TypeScript types) and `@sanity/diff-match-patch` (heavier Sanity ecosystem dependency). `fast-xml-parser` XMLBuilder is already installed — no new XML library is needed. AI suggestion generation uses `generateObject` with `output: 'array'` mode and a Zod schema, following the same pattern proven by the existing analysis route.

**Core technologies:**
- `diff-match-patch-es` ^0.1.x: character-level diff and patch — only new dependency, ESM-first, tree-shakable, ~15KB
- `fast-xml-parser` XMLBuilder (already installed): FDX XML generation — write half of the library already used for FDX reading
- AI SDK 6 `generateObject` (already installed): structured array output for suggestions — same proven batched pattern
- Zod (already installed): suggestion schema definition — already used for all analysis schemas
- Playwright + docx (already installed): revised script PDF and DOCX export — same infrastructure, new screenplay-formatted templates
- Custom React components with diff-match-patch-es: tracked-changes UI — replaces unused Tiptap packages

**Remove:** `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/static-renderer` — 4 packages, 0 imports anywhere in the codebase, ~150KB+ bundle weight.

### Expected Features

The feature set divides cleanly into a v3.0 core (table stakes required for the workflow to feel complete), v3.0 polish (differentiators that leverage the structured analysis uniquely), and deferred work.

**Must have (table stakes) — v3.0 core:**
- Block-level suggestion generation linked to specific analysis findings — the entire value proposition
- Accept/reject per suggestion with persisted SQLite state — users will not accept an all-or-nothing flow
- Inline visual diff per suggestion (word-level, green/red) — without this, users cannot evaluate what changed
- Merged/revised script preview reflecting current accept/reject decisions
- Multi-format export of revised script: PDF, DOCX, plain text — reuses existing infrastructure
- FDX export of revised script — Final Draft round-trip, highest-complexity export format
- Suggestion rationale display linking back to the originating analysis finding
- Support across all 4 project types (narrative, TV/episodic, documentary, corporate) — different block definitions and analysis schema fields per type
- SQLite persistence of suggestion state — user can close the browser and return to their review session

**Should have (competitive) — v3.0 polish:**
- Analysis dimension filtering (show only dialogue suggestions, only pacing suggestions)
- Suggestion priority ratings (critical / recommended / optional) — sorted in UI
- Batch accept/reject by dimension ("accept all dialogue improvements")
- Regenerate single suggestion with user guidance

**Defer (v3.1+):**
- Harsh Critic integration for suggestions
- Side-by-side full script diff view

**Explicit anti-features (never build):**
- Full auto-rewrite — produces generic voice-flattened output, undermines writer control
- Real-time inline editing while reviewing — scope expansion into a full screenplay editor, out of scope per PROJECT.md
- Version tree / branching — combinatorial UX complexity for zero single-user benefit

### Architecture Approach

V3.0 additions layer directly onto the existing architecture without breaking its patterns. The app's current model is: upload → parse → store JSON blob on projects table → analyze → store analysis JSON blob → display in card-based workspace → export analysis report. V3.0 adds a user-triggered fifth step: generate suggestions (after analysis) → store suggestions JSON blob → display in new "Script Review" tab → merge accepted suggestions → export revised script. Every new component mirrors an existing counterpart, following four established patterns: JSON blob storage (not a new relational table), progressive JSON streaming (same pattern as analysis route), tab-based workspace integration, and server-side DB reads by project ID (not client-sends-script-text).

The two most critical architectural decisions established by research: (1) suggestions must reference text spans by exact quoted text, not character offsets — LLMs cannot produce reliable offsets in long documents, and string search with `indexOf` is deterministic; (2) the suggestion state model must use a single source of truth (array of `SuggestionWithStatus` objects) from which the document preview is always computed via `useMemo`, never stored as separate mutable state.

**Major components:**
1. `POST /api/suggestions/generate` — reads project from DB by ID, builds type-specific prompt injecting analysis weakness strings as the instruction list, streams structured suggestion array via `generateObject`
2. `SuggestionReviewPanel` + `SuggestionCard` — "Script Review" tab in DocumentWorkspace; inline word-level diff, accept/reject per suggestion, dimension filtering, persisted state
3. `lib/suggestions/merge.ts` — applies accepted suggestions to original text using reverse-order string replacement; produces `revisedText`
4. `POST /api/export/script` — exports `revisedText` as PDF (Playwright), DOCX (docx library), FDX (XMLBuilder with preserved tree from Phase 1), or TXT
5. `lib/suggestions/types.ts` — Suggestion Zod schema and TypeScript types shared across all suggestion code
6. `lib/suggestions/prompt.ts` — per-project-type prompt engineering; analysis weakness fields are the literal instruction list
7. DB migration — adds `suggestions TEXT`, `revisedText TEXT`, and `fdxTree TEXT` columns to projects table

### Critical Pitfalls

1. **FDX parser destroys round-trip data** — The existing `fdx-parser.ts` strips all paragraph type attributes and structural metadata. FDX export requires a separate parse layer with `preserveOrder: true, ignoreAttributes: false` that retains the full XML tree. Store the preserved tree in a dedicated `fdxTree` column. Never reconstruct FDX from plain text — all element types, formatting, and metadata will be lost. Must be built in Phase 1 before any export work begins.

2. **Generic suggestions not grounded in analysis** — If the prompt treats analysis results as background context, the LLM produces generic screenwriting advice rather than targeted fixes. The prompt must inject actual weakness strings from the analysis schema fields (`structuralWeaknesses`, `dialogueQuality.weaknesses`, character `weaknesses`, `developmentRecommendations`) as the literal instruction list. Each generated suggestion must reference which specific finding it addresses.

3. **Offset drift corrupts multi-suggestion merges** — Character-offset-based merges break when multiple suggestions are applied because each replacement shifts subsequent offsets. Use text-span anchoring: the AI quotes the exact original text verbatim, and the merge engine uses `String.indexOf()` to locate and replace it. Apply accepted suggestions in reverse document order. This must be designed in Phase 1 — retrofitting later requires rewriting the merge engine.

4. **Token cost explosion from per-issue calls** — Separate LLM calls per weakness finding with the full script in context multiply to 500K–600K input tokens for a typical screenplay, costing $3–5 per suggestion run. Batch all findings into a single `generateObject` call with structured array output. Reduces input tokens ~17x (from ~600K to ~35K for a 120-page script).

5. **Tracked-changes state explosion** — Building accept/reject, preview, and undo incrementally without designing the state model upfront produces desync bugs. The state must be a single array of suggestions with status fields. Document preview is always derived (`useMemo` over accepted suggestions applied to original text), never stored as separate state. Undo is then trivial (flip status).

## Implications for Roadmap

Based on combined research, the build order is forced by dependencies: FDX infrastructure and data model decisions must come first (architectural decisions with high retrofit cost), UI depends on the data model, merge depends on UI state, export depends on merge. Each phase delivers a validatable increment.

### Phase 1: Data Foundation + FDX Infrastructure
**Rationale:** Two architectural decisions with the highest retrofit cost if wrong — the suggestion data model (text-span vs. character offsets) and the FDX preservation layer — must be locked in before any UI or generation code is built. Phase 1 can be validated entirely via API calls without a UI.
**Delivers:** Working `POST /api/suggestions/generate` endpoint, `fdxTree` preservation layer, DB migration (`suggestions`, `revisedText`, `fdxTree` columns), Suggestion Zod schema and types, merge algorithm (`lib/suggestions/merge.ts`), per-project-type prompt engineering
**Addresses:** Block segmentation logic, analysis-to-prompt mapping for all 4 project types, SQLite schema extension, token-batching strategy
**Avoids:** Offset drift corruption (Pitfall 3 — text-span anchoring from the start), FDX round-trip data loss (Pitfall 1 — preservation layer before any export), token cost explosion (Pitfall 6 — single batched call)

### Phase 2: Suggestion Review UI
**Rationale:** Depends on Phase 1 data model and generation endpoint. This is the core UX of the feature. Accept/reject state must be established before merge can operate.
**Delivers:** "Script Review" tab in DocumentWorkspace with SuggestionCard components, inline word-level diff display, accept/reject per suggestion, dimension filtering, summary bar, full persistence across page refresh
**Uses:** `diff-match-patch-es` for diff rendering, existing Tailwind + shadcn styling patterns, existing workspace tab infrastructure (`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`)
**Implements:** `SuggestionReviewPanel`, `SuggestionCard`, `SuggestionSummaryBar`, `SuggestionFilters`, workspace-context additions, auto-save suggestions to DB (debounced PUT)
**Avoids:** Tracked-changes state explosion (Pitfall 5 — single-source-of-truth state model designed before any component is written)

### Phase 3: Merge + Revised Text
**Rationale:** Depends on Phase 2 for accept/reject state. Relatively small scope — the merge algorithm was already designed and tested conceptually in Phase 1. This phase wires the "Apply Changes" button to the merge function and persists the result.
**Delivers:** "Apply N Accepted Changes" button, `revisedText` computed and stored in DB, merge preview panel that derives from suggestion status in real-time
**Uses:** `lib/suggestions/merge.ts` from Phase 1, `revisedText` state in workspace context

### Phase 4: Script Export
**Rationale:** Depends on Phase 3 for `revisedText`. The four export formats are independent of each other and can be shipped incrementally. FDX is last within this phase because it has the most edge cases and depends on the `fdxTree` infrastructure from Phase 1.
**Delivers:** `POST /api/export/script` route; revised script exportable as TXT (trivial), PDF (Playwright + screenplay CSS), DOCX (docx library + screenplay paragraph styles), FDX (XMLBuilder with preserved tree + paragraph-level replacement)
**Uses:** Playwright (existing), docx library (existing), fast-xml-parser XMLBuilder (existing)
**Avoids:** FDX Text node edge cases (Pitfall 4 — test with real FDX files; MVP collapses multi-Text paragraphs to single Text with documented limitation)

### Phase Ordering Rationale

- Phase 1 before everything because the suggestion schema and FDX layer are high-cost to change once downstream code is built against them
- Phase 2 before Phase 3 because accept/reject state is required input to the merge algorithm
- Phase 3 before Phase 4 because all export formats need `revisedText`
- Within Phase 4: TXT first (trivial), then PDF, then DOCX, then FDX (most complex, most edge cases)
- Tiptap removal happens at the start of Phase 2 before any new components are added (clean slate)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (prompt engineering):** Documentary and corporate analysis schema weakness fields need explicit mapping to suggestion prompts. Narrative is well-documented in the codebase (`scriptCoverage.dialogueQuality.weaknesses`, etc.) but the other 3 types need validation against their actual Zod schemas.
- **Phase 1 (FDX preservation):** Complex FDX files with dual dialogue, multi-Text paragraphs, and revision marks may surface edge cases beyond what the sample files show. Test with real user FDX files early.
- **Phase 4 (FDX export verification):** Requires access to a Final Draft installation to verify round-trip correctness. Cannot be validated by code alone.

Phases with standard patterns (can skip research-phase):
- **Phase 2:** Custom React diff components using diff-match-patch-es follow well-documented patterns.
- **Phase 3:** Merge algorithm is fully specified in ARCHITECTURE.md — straightforward implementation.
- **Phase 4 (non-FDX formats):** PDF and DOCX export follow the exact same pattern as the existing analysis report export. New work is only the screenplay-formatted HTML/DOCX templates.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | One new dependency; all others already installed and proven in the live codebase. Tiptap removal confirmed safe (0 imports in any source file). diff-match-patch-es verified via official Anthony Fu repo and npm. |
| Features | MEDIUM-HIGH | Table stakes and MVP scope are clear and well-supported by competitor analysis. Per-project-type suggestion shapes (especially documentary/corporate) are based on schema analysis, not user validation — needs validation during Phase 1 prompt engineering. |
| Architecture | HIGH | Derived directly from codebase reading of confirmed patterns. Text-span anchoring, JSON blob storage, tab integration, server-side DB reads — all follow established project conventions. Data model decisions are well-reasoned with clear tradeoff documentation. |
| Pitfalls | HIGH (codebase-verified) / MEDIUM (FDX edge cases) | Core pitfalls (offset drift, FDX round-trip loss, token cost, state explosion) are confirmed from direct codebase analysis. FDX write-back edge cases (multi-Text paragraphs, dual dialogue) are MEDIUM — documented from format specs and sample files but require real-file testing to fully validate. |

**Overall confidence:** HIGH

### Gaps to Address

- **Documentary and corporate suggestion prompts:** Narrative schema fields are well-mapped, but `editorialNotes.missingPerspectives`, `editorialNotes.suggestedStructure`, and corporate messaging fields need explicit extraction logic. If only narrative is built first, document it as a known limitation with a clear roadmap for the other types.
- **FDX multi-Text paragraph handling:** The MVP collapses multi-formatted paragraphs (bold, italic inline) to a single Text node when a suggestion modifies them. This is an acceptable v3.0 limitation but must be surfaced in the UI ("FDX export: inline formatting within rewritten passages is normalized to plain text").
- **Context window limits for long scripts:** Scripts over 80 pages combined with analysis data may approach model context limits. The prompt should inject only the top-N weakness findings by severity rather than the full analysis output. This tradeoff needs validation during Phase 1 API implementation.
- **Suggestion count calibration:** The 10–15 suggestion target is based on UX reasoning and token cost analysis, not user testing. The right number may need adjustment after first real use.

## Sources

### Primary (HIGH confidence)
- Codebase direct analysis: `src/lib/parsers/fdx-parser.ts`, `src/lib/db.ts`, `src/app/api/analyze/route.ts`, `src/contexts/workspace-context.tsx`, `src/components/document-workspace.tsx`, `src/lib/ai/schemas/narrative.ts`
- [diff-match-patch-es GitHub (antfu)](https://github.com/antfu/diff-match-patch-es) — ESM rewrite, active maintenance confirmed
- [fast-xml-parser XMLBuilder docs](https://naturalintelligence.github.io/fast-xml-parser/) — official docs confirming XMLBuilder API, 52M+ weekly downloads
- [AI SDK generateObject docs](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) — array output mode confirmed
- [Tiptap Tracked Changes pricing](https://tiptap.dev/pricing) — paid add-on confirmed, validates custom component decision

### Secondary (MEDIUM confidence)
- [FDX format sample (rsdoiel/fdx)](https://github.com/rsdoiel/fdx/blob/main/testdata/sample-01.fdx) — XML structure reference for export implementation
- [FDX format documentation (Just Solve)](http://justsolve.archiveteam.org/wiki/Final_Draft) — format overview
- [Arc Studio revision management](https://help.arcstudiopro.com/guides/draft-revision-management) — tracked changes UI pattern reference (green/red per-author diffs)
- [VS Code Copilot review code edits](https://code.visualstudio.com/docs/copilot/chat/review-code-edits) — per-hunk accept/reject UX pattern reference
- [jsdiff npm](https://github.com/kpdecker/jsdiff) — 40M+ weekly downloads, validated for word-level diff use case
- [Scriptmatix AI workflow](https://scriptmatix.com/ai-screenwriting-hacks/) — competitor analysis confirming analysis-to-suggestion gap in market
- [Token cost optimization (10Clouds)](https://10clouds.com/blog/a-i/mastering-ai-token-optimization-proven-strategies-to-cut-ai-cost/) — batching strategy validation
- [LLM edit-list pattern (Waleed Kadous)](https://waleedk.medium.com/the-edit-trick-efficient-llm-annotation-of-documents-d078429faf37) — edit-list vs. full rewrite tradeoff

### Tertiary (LOW confidence)
- [screenplay-tools FDX writer](https://github.com/wildwinter/screenplay-tools) — evaluated and rejected (not widely adopted, not battle-tested)
- [tiptap-diff-suggestions community extension](https://github.com/bsachinthana/tiptap-diff-suggestions) — evaluated and rejected (7 commits, 22 stars, too immature)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
