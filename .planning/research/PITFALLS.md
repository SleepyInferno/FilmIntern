# Pitfalls Research

**Domain:** Adding AI rewrite suggestions + tracked-changes UI + FDX export to existing filmmaking analysis tool
**Researched:** 2026-03-21
**Confidence:** HIGH (codebase-verified pitfalls) / MEDIUM (FDX write-back edge cases)

## Critical Pitfalls

### Pitfall 1: Existing FDX Parser Destroys Round-Trip Data

**What goes wrong:**
The current `fdx-parser.ts` uses `fast-xml-parser` with `ignoreAttributes: false` but strips the parsed FDX down to plain text lines, discarding all paragraph Type attributes (Action, Character, Dialogue, Parenthetical, Scene Heading, Transition, Shot), Text styling attributes (Font, Style, AdornmentStyle, Color, RevisionID, Size), SceneProperties, ElementSettings, PageLayout, SmartType lists, HeaderAndFooter, Cast/Actors metadata, and revision history. The parser outputs a flat `{ text, metadata }` result. There is no preserved XML tree to write back to.

**Why it happens:**
The parser was built for analysis input -- you only need the text content to feed to an LLM. Writing back was never a requirement. This is the correct design for v1-v2, but v3 now needs to modify content and export as FDX, which requires the full XML structure.

**How to avoid:**
Build a separate FDX round-trip layer that parses with `preserveOrder: true` and `ignoreAttributes: false` on `fast-xml-parser`, retaining the complete JS object tree. The existing `parseFdx` stays as-is for analysis input. The new layer stores the full parsed tree alongside the project so that when exporting FDX, you modify Text nodes within the preserved tree and rebuild via `XMLBuilder` with the same `preserveOrder: true` option. Never try to reconstruct FDX from plain text -- you will lose all formatting, scene structure, and metadata.

**Warning signs:**
- FDX files exported from the app do not open correctly in Final Draft
- Paragraph types are all "General" instead of correct types (Action, Dialogue, etc.)
- Scene numbers, revision marks, or headers/footers are missing after round-trip
- Font or styling information is lost

**Phase to address:**
Phase 1 (FDX infrastructure). Must be the first thing built before any suggestion merging or export work begins. Without a preserved XML tree, there is nothing to merge suggestions into.

---

### Pitfall 2: Generic AI Suggestions Not Grounded in Analysis Findings

**What goes wrong:**
The LLM generates surface-level rewrite suggestions ("make the dialogue more natural," "add more conflict") that are not specifically connected to the weaknesses flagged in the analysis. The suggestions feel like a second, independent analysis rather than actionable fixes for the issues already identified. Users get generic writing advice instead of targeted rewrites addressing their script's specific problems.

**Why it happens:**
The prompt for suggestion generation does not include the actual analysis results, or includes them as background context rather than as the driving instruction. The LLM defaults to its training on general screenwriting advice rather than addressing the specific `structuralWeaknesses`, `dialogueQuality.weaknesses`, character `weaknesses`, or `developmentRecommendations` from the analysis schema.

**How to avoid:**
Structure the suggestion prompt as: "Here is the original script. Here are the specific issues found in analysis: [inject actual weakness strings from analysis data]. For each issue, generate a concrete rewrite of the specific passage that addresses that weakness." The analysis schema already contains granular weakness arrays -- `storyStructure.structuralWeaknesses`, `scriptCoverage.dialogueQuality.weaknesses`, `scriptCoverage.characters[].weaknesses`, `scriptCoverage.overallWeaknesses`, and `developmentRecommendations`. Use these as the literal instruction list, not as background context. Each suggestion should reference which analysis finding it addresses.

**Warning signs:**
- Suggestions could apply to any script, not specifically this one
- Suggestions do not reference specific character names, scene locations, or dialogue lines from the script
- Users cannot trace a suggestion back to a specific analysis card/finding
- Suggestions repeat the same general advice the analysis already gave

**Phase to address:**
Phase 2 (suggestion generation). This is a prompt engineering problem. Get the prompt-to-analysis-data pipeline right before building any UI.

---

### Pitfall 3: Suggestion Merge Corrupts Script Structure via Offset Drift

**What goes wrong:**
When applying multiple accepted suggestions to the original text, earlier insertions/deletions shift the character offsets of later suggestions. If suggestions reference positions in the original text (line numbers, character offsets, paragraph indices), applying suggestion #1 invalidates the positions for suggestions #2 through #N. The result is suggestions applied to wrong passages, text corruption, or structural breakage in the script.

**Why it happens:**
This is the classic "edit offset drift" problem. Each text modification changes the length of the document, making all subsequent position references stale. It is especially dangerous in screenplay format where a one-line dialogue change could shift everything below it.

**How to avoid:**
Use one of two strategies:

Option A (recommended): Reference suggestions by stable identifiers rather than character offsets. Use paragraph index + paragraph Type as the anchor (e.g., "Dialogue paragraph #47 belonging to character SARAH"). Since FDX paragraphs are discrete XML nodes, they have stable identity regardless of text changes to other paragraphs.

Option B: Apply suggestions in reverse document order (bottom-to-top), so earlier text is never shifted by later edits.

Option A is strongly preferred because it also solves the FDX merge problem -- you are replacing content within a specific XML Paragraph node, not doing string surgery on a flat text blob.

**Warning signs:**
- Accepting multiple suggestions produces garbled text
- Text from one scene appears inside another scene's dialogue
- The more suggestions you accept, the worse the output gets
- Suggestions near the end of the script work fine but suggestions near the beginning cause cascading errors

**Phase to address:**
Phase 1 (data model design). The suggestion data structure must use paragraph-level anchoring from the start. Retrofitting this after building offset-based suggestions would require rewriting the merge engine.

---

### Pitfall 4: FDX Write-Back Edge Cases in Paragraph/Text Structure

**What goes wrong:**
FDX Paragraph elements have complex internal structure that breaks if you naively replace text content. A single Paragraph can contain multiple `<Text>` child elements with different styling (bold, italic, ALL CAPS via Style attribute). RevisionID attributes track change history. Dual dialogue requires specific Paragraph grouping. Scene Heading paragraphs contain SceneProperties with scene arc beats. Replacing the text content of a paragraph without preserving these nested structures produces FDX files that Final Draft either rejects or displays incorrectly.

**Why it happens:**
Developers treat FDX paragraphs as simple containers: `<Paragraph Type="Dialogue"><Text>line</Text></Paragraph>`. In reality, a dialogue paragraph might be: `<Paragraph Type="Dialogue"><Text Style="" Font="Courier Final Draft" Size="12" RevisionID="1">I told you </Text><Text Style="Italic" Font="Courier Final Draft" Size="12" RevisionID="1">never</Text><Text Style="" Font="Courier Final Draft" Size="12" RevisionID="1"> to come back.</Text></Paragraph>`. Replacing the entire text loses the italic on "never."

**How to avoid:**
When generating a suggestion that replaces text in a paragraph, the merge operation should:
1. Extract the plain text from all Text children (concatenated)
2. Apply the AI-suggested replacement text
3. If the original had a single Text child, replace its text content directly
4. If the original had multiple Text children (mixed formatting), either: (a) collapse to a single Text child with the default style (simpler, loses inline formatting), or (b) use a diff algorithm to map which parts of the old text map to which Text nodes and update accordingly (complex but format-preserving)

For v3.0 MVP, option (a) is acceptable -- collapse to single Text child when a suggestion modifies a multi-formatted paragraph, and document this as a known limitation. Full format preservation is a future enhancement.

**Warning signs:**
- Italic, bold, or underline formatting disappears after accepting suggestions
- RevisionID tracking breaks in Final Draft when opening exported files
- Dual dialogue scenes lose their paired formatting
- Scene heading metadata (scene numbers, arc beats) vanishes

**Phase to address:**
Phase 3 (FDX export). Must be tested with real Final Draft files that contain mixed formatting, dual dialogue, and revision marks.

---

### Pitfall 5: Tracked-Changes UI State Explosion

**What goes wrong:**
The tracked-changes UI needs to track per-suggestion state (pending/accepted/rejected), display inline diffs (old text strikethrough, new text highlighted), support undo (re-reject an accepted change, re-accept a rejected one), maintain the "current document preview" that reflects all accepted changes, and keep this in sync with the original text plus all decisions. The state management becomes a tangled mess of derived state, and bugs appear as: accepted changes not showing in preview, rejected changes still appearing, undo not working correctly, or the preview diverging from what will actually export.

**Why it happens:**
Developers build the state incrementally -- first accept/reject toggles, then preview, then undo -- without designing the state model upfront. Each addition interacts with the others in unexpected ways. The fundamental issue is that the "current state of the document" is derived state (original + accepted suggestions - rejected suggestions), and keeping derived state in sync with source state is a classic React foot-gun.

**How to avoid:**
Design the state as a single source of truth: an array of suggestions, each with `{ id, paragraphAnchor, originalText, suggestedText, status: 'pending' | 'accepted' | 'rejected', analysisSource }`. The document preview is always computed (never stored) by: take original text, apply all `status === 'accepted'` suggestions. Never store the "current document" as separate state -- always derive it. Use `useMemo` or equivalent to compute the preview from the suggestion array. This makes undo trivial (flip status back) and export deterministic (apply all accepted suggestions to original).

**Warning signs:**
- Preview shows different text than what exports
- Undoing an accept does not restore the original text in preview
- Rapidly toggling accept/reject causes the preview to desync
- Two suggestions on the same paragraph conflict silently

**Phase to address:**
Phase 2 (data model) and Phase 3 (UI). The data model must be designed in Phase 2 before the UI is built. The UI in Phase 3 should be a pure function of the data model.

---

### Pitfall 6: Token Cost Explosion from Per-Issue Suggestion Generation

**What goes wrong:**
A single analysis produces 10-30+ weakness findings across all schema fields (structuralWeaknesses, dialogueQuality.weaknesses, character weaknesses, overallWeaknesses, developmentRecommendations). If you make a separate LLM call per finding, each call must include the full script text as context. A 120-page screenplay is roughly 25,000-30,000 tokens. Generating suggestions for 20 findings means 500,000-600,000 input tokens -- at Anthropic's Sonnet pricing that is $1.50-$1.80 per suggestion run, just in input tokens. With output tokens for actual suggestions, a single "generate suggestions" click could cost $3-5.

**Why it happens:**
The natural architecture is "for each weakness, ask the LLM to suggest a fix." This is clean, modular, and produces well-scoped suggestions. But it is economically brutal because the script context must be repeated in every call.

**How to avoid:**
Batch all analysis findings into a single LLM call. Send the full script once, with all weakness findings as a structured list, and ask the LLM to generate suggestions for all of them in one response. Use structured output (Zod schema via AI SDK `Output.object`) to get back an array of suggestion objects. This reduces token cost from O(N * script_length) to O(script_length + N * suggestion_length). For a 30,000-token script with 20 findings, this drops the input cost from ~600K tokens to ~35K tokens -- a 17x reduction.

The tradeoff is that a single massive prompt may produce lower-quality suggestions for later items in the list (attention degradation). Mitigate by ordering findings by severity (most critical first) and limiting to the top 10-15 most impactful findings rather than every minor weakness.

**Warning signs:**
- API costs spike dramatically when users generate suggestions
- Suggestion generation takes 2+ minutes due to sequential API calls
- Users complain about cost (if they are using their own API keys)
- The "generate suggestions" button feels unreasonably slow

**Phase to address:**
Phase 2 (suggestion generation API). The batching strategy must be decided before the API route is built. Single-call batched generation should be the default, with per-issue generation only as a future "deep dive" option.

---

### Pitfall 7: Streaming Suggestions Needs Different Architecture Than Analysis Streaming

**What goes wrong:**
The existing analysis streaming works by streaming a single structured object via `streamText` with `Output.object`. The client does progressive JSON parsing to display sections as they arrive. Suggestions are fundamentally different -- they are an array of independent items, each tied to a specific paragraph. If you stream suggestions the same way (as a single object), the UI cannot display individual suggestions as they arrive; it must wait for the full array to parse. Alternatively, if suggestions stream as plain text, you lose the structured mapping between suggestions and their target paragraphs.

**Why it happens:**
Developers copy the existing analysis streaming pattern without considering that the data shape and consumption pattern are different. Analysis has named sections that fill in progressively. Suggestions are a flat list where each item should become independently actionable as soon as it arrives.

**How to avoid:**
Use `Output.object` with a schema that has an array of suggestion objects. AI SDK's progressive JSON parsing will surface array items as they become available. The client-side consumer watches for new items appearing in the array and renders each suggestion card as soon as it is complete. This is similar to the existing pattern but requires the client to track "last known array length" and render new items incrementally.

Alternatively, if suggestion count is manageable (10-15 per batch), non-streaming may be acceptable. The generation takes 15-30 seconds for a batched call. Show a progress indicator with "Generating suggestions for 12 issues..." and display them all at once. This is simpler and avoids the complexity of streaming individual array items. For a personal tool, this is likely the right tradeoff.

**Warning signs:**
- Blank screen for 30+ seconds while suggestions generate
- Partial suggestions appear with missing fields (incomplete JSON parse)
- Suggestion cards flash/rerender every time a new token arrives
- Memory usage spikes from accumulating partial parse results

**Phase to address:**
Phase 2 (API design). Decide streaming vs. non-streaming before building the endpoint. The choice affects both the API route and the client consumer.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Collapse multi-Text paragraphs to single Text on suggestion merge | Simpler merge logic, no diff-within-paragraph complexity | Loses inline formatting (bold, italic) in rewritten paragraphs | MVP -- document as known limitation, fix in v3.1 |
| Store suggestion state in React component state only | Fast to implement, no schema migration | Lost on page refresh, cannot resume review session | Never -- suggestions must persist to SQLite |
| Skip FDX metadata preservation (SmartType, Cast, Macros) | Can ship FDX export faster | Files lose autocomplete lists, cast info, macros when round-tripped | MVP if user warning is shown ("FDX export preserves script content; some metadata may need re-entry in Final Draft") |
| Generate suggestions only for narrative project type first | Faster delivery of core feature | Other 3 project types (documentary, corporate, TV/episodic) lack suggestions | Acceptable if documented -- these types have different weakness schemas that need separate prompt work |
| Hardcode suggestion count limit (e.g., top 10 issues) | Controls token cost and generation time | Misses lower-priority issues | Yes -- 10-15 suggestions is a good UX ceiling. More causes decision fatigue |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| fast-xml-parser XMLBuilder | Using different options for parse vs. build (e.g., `preserveOrder` on parse but not build) | Use identical options object for both XMLParser and XMLBuilder. The `preserveOrder: true` parsed tree has a different JS structure than normal parse -- XMLBuilder expects the same structure |
| fast-xml-parser with FDX | Setting `ignoreAttributes: true` (as existing parser does implicitly by not using attribute data) | For round-trip: `ignoreAttributes: false, preserveOrder: true, attributeNamePrefix: '@_'`. Store the full parsed result alongside the project |
| AI SDK structured output for suggestions | Using `streamText` with `Output.object` for a large array schema and expecting per-item streaming | AI SDK streams the JSON progressively, but the client must do its own incremental array-item detection. Test with the actual schema to confirm items surface individually |
| SQLite TEXT columns for suggestion data | Storing suggestion JSON in a single TEXT column alongside analysisData | Add a dedicated `suggestionsData` column via migration. The data lifecycle is different from analysis -- suggestions have mutable status (pending/accepted/rejected) that changes as the user reviews |
| Existing analysis-to-suggestion pipeline | Assuming the analysis data is available in a uniform shape across project types | Parse `analysisData` from the project row, extract weakness fields per project type schema. Each project type has different weakness field paths (narrative has `scriptCoverage.dialogueQuality.weaknesses`, documentary has different fields entirely) |
| FDX preserved tree storage | Storing the preserved XML tree in the same column as uploadData | Use a separate column (e.g., `fdxTree`) because the tree is large (10-100KB) and only needed for FDX exports, not for every project load. Non-FDX uploads do not have this data at all |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-computing document preview on every render | UI jank/lag when toggling accept/reject on suggestions | Memoize the "apply accepted suggestions to original" computation. Only recompute when suggestion status array changes | 20+ suggestions with a long script |
| Storing full script text in multiple places (original, preview, per-suggestion context) | Memory bloat, especially with 100+ page screenplays | Store original text once. Suggestions reference paragraph indices. Preview is derived | Scripts over 50 pages with 15+ suggestions |
| Full FDX XML tree in React state | Slow renders, deep comparison overhead | Keep FDX tree server-side only. Client works with paragraphs and plain text. FDX export is a server-side operation that takes the preserved tree + accepted suggestion list | Any FDX file (trees are large) |
| Diff computation on every keystroke if allowing manual edits | Visible input lag, especially with jsdiff on long texts | Do not allow freeform editing in v3.0. Suggestions are accept/reject only. Manual editing is a future feature | N/A for v3.0 -- avoidance strategy |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all suggestions at once in a flat list | Overwhelming, no clear starting point, decision fatigue | Group suggestions by analysis category (structure, dialogue, character, etc.) matching the existing card-based workspace layout. Show count badges per category |
| No way to see which analysis finding drove a suggestion | Suggestions feel arbitrary, user cannot evaluate whether the fix matches the diagnosis | Each suggestion card should display the originating analysis finding (e.g., "Addresses: Dialogue weakness -- characters sound interchangeable") with a link back to the analysis card |
| Inline diff showing raw character-level changes | Hard to read, especially for dialogue rewrites where most of the line changes | Use word-level diff (jsdiff `diffWords`), not character-level. For screenplay dialogue, show old line / new line stacked rather than inline strikethrough/insertion |
| No "Accept All" / "Reject All" option | Tedious if user wants to accept most suggestions and only reject a few | Provide bulk actions: Accept All, Reject All, plus per-suggestion toggle. Also consider "Accept All in Category" |
| Suggestion preview does not show surrounding script context | User cannot evaluate whether the suggestion flows with adjacent lines | Show 2-3 paragraphs above and below the suggestion target, with the suggestion highlighted in context |
| No clear "done reviewing" action | User is unsure when they have addressed all suggestions and can export | Show a progress counter: "7 of 12 suggestions reviewed (5 pending)". Enable export only when all suggestions are reviewed, or allow export with pending treated as "keep original" |

## "Looks Done But Isn't" Checklist

- [ ] **FDX Export:** Often missing paragraph Type preservation -- verify exported FDX opens in Final Draft with correct element types (Scene Heading, Action, Character, Dialogue, not all "General")
- [ ] **FDX Export:** Often missing dual dialogue handling -- verify scripts with simultaneous dialogue export correctly
- [ ] **FDX Export:** Often missing page break / forced page break preservation -- verify pagination-sensitive scripts
- [ ] **Suggestion Generation:** Often missing project-type-specific weakness extraction -- verify documentary/corporate/TV weakness fields are extracted correctly (not just narrative schema fields)
- [ ] **Suggestion Merge:** Often missing empty paragraph handling -- verify suggestions that delete a line entirely do not leave orphaned empty Paragraph nodes in FDX
- [ ] **Tracked Changes UI:** Often missing keyboard navigation -- verify accept/reject can be done via keyboard (Enter/Backspace or similar), not just click
- [ ] **Export:** Often missing "no suggestions accepted" edge case -- verify export produces original script unchanged when user rejects all
- [ ] **Export:** Often missing "all suggestions accepted" edge case -- verify full replacement does not corrupt document structure
- [ ] **Persistence:** Often missing suggestion state persistence across page refresh -- verify refreshing mid-review does not lose accept/reject decisions
- [ ] **Persistence:** Often missing association between suggestions and analysis version -- verify that re-running analysis does not orphan existing suggestion review state

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| FDX round-trip data loss (Pitfall 1) | MEDIUM | Build the preservation layer as a new module. Existing `parseFdx` stays for analysis. No existing code needs rewriting, but the new module must be designed carefully |
| Generic suggestions (Pitfall 2) | LOW | Prompt engineering fix -- restructure the prompt to use analysis weakness strings as the instruction list. No architecture change needed |
| Offset drift corruption (Pitfall 3) | HIGH if built with offsets | Must redesign suggestion data model from scratch. This is why paragraph-level anchoring must be Phase 1 |
| FDX Text node edge cases (Pitfall 4) | LOW-MEDIUM | Can be incrementally fixed per edge case. Start with single-Text collapse, add multi-Text preservation later |
| State explosion in UI (Pitfall 5) | MEDIUM | Refactor to single-source-of-truth state model. Manageable but painful if the UI was built with ad-hoc state |
| Token cost explosion (Pitfall 6) | LOW | Switch from per-issue calls to batched single call. API route change, no UI impact |
| Wrong streaming architecture (Pitfall 7) | MEDIUM | Rewire the API route and client consumer. If non-streaming was chosen and works, no recovery needed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| FDX round-trip data loss | Phase 1: FDX infrastructure | Parse a real FDX, modify one paragraph's text, rebuild XML, open in Final Draft. All metadata, types, and formatting preserved |
| Generic suggestions | Phase 2: Suggestion generation | Review 5 generated suggestions -- each must reference specific text from the script and name the analysis finding it addresses |
| Offset drift corruption | Phase 1: Data model design | Accept 5+ suggestions scattered throughout a script, export, verify all passages are correct with no text corruption |
| FDX Text node edge cases | Phase 3: FDX export | Test with FDX files containing italic dialogue, dual dialogue, revision marks. Verify round-trip fidelity in Final Draft |
| State explosion in UI | Phase 2: Data model + Phase 3: UI | Toggle accept/reject rapidly 20 times on various suggestions. Refresh page mid-review. Verify state consistency throughout |
| Token cost explosion | Phase 2: Suggestion generation API | Log token usage for a full suggestion run. Must be under 50K input tokens for a typical 120-page screenplay |
| Wrong streaming pattern | Phase 2: API design decision | If streaming: verify first suggestion appears within 5 seconds. If non-streaming: verify total time under 30 seconds with progress feedback |

## Sources

- Codebase analysis: `src/lib/parsers/fdx-parser.ts` (current parser discards structure), `src/lib/ai/schemas/narrative.ts` (weakness fields in analysis schema), `src/lib/db.ts` (current DB schema and migration pattern), `src/app/api/analyze/route.ts` (existing streaming pattern)
- [fast-xml-parser documentation and XMLBuilder options](https://github.com/NaturalIntelligence/fast-xml-parser)
- [fast-xml-parser preserveOrder discussion](https://github.com/NaturalIntelligence/fast-xml-parser/discussions/462)
- [FDX format structure via rsdoiel/fdx sample files](https://github.com/rsdoiel/fdx/blob/main/testdata/sample-01.fdx)
- [Final Draft screenplay formatting elements](https://www.finaldraft.com/learn/screenplay-formatting-elements/)
- [jsdiff -- JavaScript text differencing](https://github.com/kpdecker/jsdiff)
- [NYTimes/ice -- track changes in JavaScript](https://github.com/nytimes/ice)
- [AI engineering pitfalls (Huyen Chip, 2025)](https://huyenchip.com/2025/01/16/ai-engineering-pitfalls.html)
- [Token cost optimization strategies (10Clouds)](https://10clouds.com/blog/a-i/mastering-ai-token-optimization-proven-strategies-to-cut-ai-cost/)
- [LLM edit-list pattern vs. full document rewrite (Waleed Kadous)](https://waleedk.medium.com/the-edit-trick-efficient-llm-annotation-of-documents-d078429faf37)

---
*Pitfalls research for: FilmIntern v3.0 -- AI rewrite suggestions, tracked-changes UI, FDX export*
*Researched: 2026-03-21*
