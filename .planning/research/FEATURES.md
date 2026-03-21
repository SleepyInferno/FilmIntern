# Feature Research

**Domain:** AI-driven script improvement and rewrite suggestions for filmmaking analysis tool
**Researched:** 2026-03-21
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that are non-negotiable for v3.0 to feel complete. Without these, the improvement workflow is broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Analysis-linked suggestion generation | The whole point: existing analysis flags weaknesses, suggestions must target those specific weaknesses -- not generic rewrites | HIGH | Requires mapping analysis schema fields (structuralWeaknesses, dialogueQuality.weaknesses, overallWeaknesses, developmentRecommendations) to actionable rewrite prompts per project type. Each of the 4 project types has different weakness fields in its Zod schema. |
| Block-level suggestions (not line-level, not whole-scene) | Professional tools (Scriptmatix, Arc Studio) work at scene/block granularity. Line-level is too noisy; whole-scene rewrites discard too much. A "block" = a dialogue exchange, an action paragraph, a scene heading + its content, or a thematic passage | MEDIUM | The script text is already parsed as plain text without structural markup. Block boundaries must be inferred or defined during suggestion generation. AI should output: original block, suggested replacement, rationale tied to analysis finding. |
| Accept/reject per suggestion | Every tracked-changes tool (Word, Arc Studio, VS Code Copilot, Cursor) offers per-change accept/reject. Users will not accept a workflow where it is all-or-nothing. | MEDIUM | State management: each suggestion has status (pending/accepted/rejected). Persisted so the user can leave and return. |
| Visual diff between original and suggested text | Arc Studio highlights additions in green, deletions in red. VS Code uses inline diff with gutter controls. Without visual diff, user cannot evaluate what changed. | MEDIUM | Use jsdiff (npm `diff` package) to compute word-level diffs for display. Render inline: strikethrough red for removed, highlighted green for added. |
| Merged/revised script preview | After accepting some suggestions and rejecting others, user needs to see the resulting script as a unified document before export. | MEDIUM | Apply accepted changes to original text in order. Handle overlapping regions carefully (suggestions should not overlap). |
| Multi-format export of revised script (PDF, DOCX, plain text) | Existing app already exports analysis reports as PDF/DOCX via Playwright and docx library. Users expect the same for the revised script. Plain text is trivial. | MEDIUM | Existing export infrastructure can be reused with new document kind: 'revised-script'. Screenplay formatting (Courier 12pt, proper margins) expected for narrative/TV scripts. |
| FDX export of revised script | PROJECT.md lists FDX export as a target. Writers who use Final Draft need to get their revised script back into Final Draft. | HIGH | No mature npm library for FDX writing exists. screenplay-tools has an FDX.Writer but is not battle-tested. Alternative: generate FDX XML directly using fast-xml-parser (already a dependency for FDX parsing). Requires re-parsing revised text into screenplay element types (Scene Heading, Action, Character, Dialogue). |
| Suggestion rationale tied to analysis | Each suggestion must explain why it was made, referencing the specific analysis finding. Without rationale, suggestions feel arbitrary. | LOW | Include in the AI prompt: for each suggestion, output the analysis dimension and specific finding that motivated it. Display alongside the diff. |
| Works across all 4 project types | Narrative, TV/episodic, documentary, corporate all need improvement support. The analysis schemas differ significantly across types. | HIGH | Documentary improvements target interview content (quote selection, narrative threads). Corporate targets messaging clarity. Narrative/TV target dialogue, structure, pacing. Different prompts per type, different block definitions. |
| Persistence of suggestion state | User should be able to generate suggestions, close the browser, come back, and find their accept/reject state intact. | MEDIUM | Extend SQLite schema: new table for suggestions linked to analysis ID. Fields: original_text, suggested_text, rationale, position, status (pending/accepted/rejected), analysis_dimension. |

### Differentiators (Competitive Advantage)

Features that go beyond what Scriptmatix, Arc Studio, and generic AI tools offer. These leverage the existing structured analysis uniquely.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Analysis dimension filtering | Filter suggestions by which analysis dimension triggered them (e.g., show only dialogue suggestions, only pacing suggestions). Scriptmatix shows all suggestions flat. Being able to focus on one weakness category at a time is more useful for iterative revision. | LOW | Tag each suggestion with its source dimension. UI filter is trivial given the existing card-based workspace pattern. |
| Suggestion confidence/priority | AI rates each suggestion by impact (critical, recommended, optional). User tackles high-impact changes first. | LOW | Add to AI output schema. Sort/group in UI. |
| Batch accept/reject by dimension | "Accept all dialogue improvements" or "Reject all pacing suggestions." Useful when user trusts the AI on one dimension but not another. | LOW | UI convenience feature. Trivial given per-suggestion dimension tagging. |
| Regenerate single suggestion | If a suggestion is bad, regenerate just that one with additional user guidance ("make it more subtle" / "keep the original tone"). | MEDIUM | Requires a focused AI call with the original block, the rejected suggestion, and user feedback. Context window cost is minimal since it is a single block. |
| Harsh Critic integration | If Harsh Critic mode was enabled, generate more aggressive rewrite suggestions that address the critic's specific callouts. Different tone and scope than standard suggestions. | LOW | Already have critic analysis as prose. Parse critic findings into suggestion prompts. Natural extension of existing feature. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full auto-rewrite ("rewrite the whole script") | Feels like the ultimate time-saver | Produces generic, voice-flattened output. Strips the writer's style. AI hallucination risk scales with output length. Professional screenwriters would never trust this. | Block-level suggestions targeting specific weaknesses. Writer stays in control. |
| Real-time streaming suggestions as you edit | Copilot-style inline suggestions while typing | This is not an editor -- it is an analysis tool. Adding a full screenplay editor is a massive scope expansion (screenplay formatting, pagination, element types). The tool's value is structured analysis, not being Yet Another Screenwriter. | Generate suggestions from completed analysis, review in dedicated UI, export to writer's preferred editor. |
| AI tone/style matching ("write like Aaron Sorkin") | Fun and marketable | Produces pastiche, not improvement. Suggestions should fix structural/dramatic issues, not impose a style. Style matching degrades with script length. | Focus suggestions on analysis findings. If dialogue is flagged as flat, suggest alternatives that add subtext -- let the writer apply their own voice. |
| Version tree / branching | "What if I accepted different suggestions?" | Combinatorial explosion of versions. Massive UX complexity for a personal tool. | Single linear flow: original -> suggestions -> accept/reject -> revised. User can re-run suggestions if they want a different set. |
| Inline editing of suggestions | Let user manually edit the AI's suggested text before accepting | Adds significant UI complexity (contenteditable regions within diff view). Error-prone. Hard to maintain diff integrity. | Accept, reject, or regenerate. If user wants to tweak, they edit in their screenwriting tool after export. |
| Before/after score projection | Show how accepting suggestions would change the overall score | Requires re-running full analysis on merged text (expensive AI call, slow). Projected scores could be inaccurate, creating false confidence. | User can re-run analysis on the exported revised script if they want updated scores. |

## Feature Dependencies

```
[Completed Analysis (existing)]
    |
    +--requires--> [Suggestion Generation]
    |                  |
    |                  +--requires--> [Block segmentation of script text]
    |                  |
    |                  +--requires--> [Analysis-to-prompt mapping per project type]
    |                  |
    |                  +--requires--> [Suggestion Zod schema + AI output contract]
    |
    +--requires--> [Suggestion Review UI]
    |                  |
    |                  +--requires--> [Visual diff rendering (jsdiff)]
    |                  |
    |                  +--requires--> [Suggestion persistence (SQLite)]
    |                  |
    |                  +--enhances--> [Dimension filtering]
    |                  |
    |                  +--enhances--> [Batch accept/reject]
    |                  |
    |                  +--enhances--> [Regenerate single suggestion]
    |
    +--requires--> [Script Merging]
    |                  |
    |                  +--requires--> [Ordered application of accepted changes]
    |                  |
    |                  +--requires--> [Suggestion Review UI] (accept/reject state)
    |
    +--requires--> [Revised Script Export]
                       |
                       +--requires--> [Script Merging]
                       |
                       +--reuses----> [Existing PDF export (Playwright)]
                       |
                       +--reuses----> [Existing DOCX export (docx library)]
                       |
                       +--new-------> [FDX export (XML generation via fast-xml-parser)]
                       |
                       +--trivial---> [Plain text export]
```

### Dependency Notes

- **Suggestion generation requires completed analysis:** Suggestions are driven by analysis findings. No analysis = no suggestions. This is the core differentiator vs generic AI rewriting tools.
- **Block segmentation is prerequisite for suggestion generation:** The AI needs to know what "block" of text to rewrite. For screenplays, blocks are scene-level (scene heading + content). For transcripts, blocks are speaker turns or thematic passages. This must be solved before generation prompts can work.
- **Visual diff requires jsdiff:** Computing word-level diffs between original and suggested blocks is necessary for the tracked-changes display. The `diff` npm package (jsdiff) is the standard choice -- 40M+ weekly downloads, well-maintained.
- **FDX export is the highest-risk dependency:** Writing valid FDX XML requires understanding Final Draft's element type schema (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition). The existing FDX parser strips structure to plain text -- export needs to reconstruct it. fast-xml-parser is already a project dependency and can write XML.
- **Script merging is simpler than it sounds:** Suggestions target non-overlapping blocks (enforced by generation). Merging = replacing original blocks with accepted suggestion text in position order. No operational transform needed.

## MVP Definition

### Launch With (v3.0 Core)

- [ ] Block segmentation logic per project type -- foundation for everything
- [ ] Analysis-to-prompt mapping for all 4 project types -- drives suggestion quality
- [ ] Suggestion Zod schema and AI streaming output -- structured generation
- [ ] Suggestion generation endpoint (API route) -- server-side AI calls
- [ ] SQLite schema extension for suggestions -- persistence
- [ ] Accept/reject UI with inline visual diff (jsdiff) -- the review experience
- [ ] Dimension filtering -- focus review by weakness category
- [ ] Script merging from accepted suggestions -- produces revised text
- [ ] Export revised script as PDF, DOCX, plain text -- reuse existing infrastructure

### Add After Core Works (v3.0 Polish)

- [ ] FDX export -- highest complexity export format, build last
- [ ] Suggestion priority/confidence ratings -- add to AI schema after core generation is stable
- [ ] Batch accept/reject by dimension -- UI convenience, add after filtering works
- [ ] Regenerate single suggestion -- requires focused AI call, add after core flow is proven

### Future Consideration (v3.1+)

- [ ] Harsh Critic integration for suggestions -- natural follow-on once standard suggestions work
- [ ] Side-by-side full script diff view -- nice-to-have visualization

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| Block segmentation logic | HIGH | MEDIUM | P1 | Script text, project type detection |
| Analysis-to-prompt mapping (4 types) | HIGH | HIGH | P1 | Analysis schemas (existing) |
| Suggestion generation endpoint | HIGH | HIGH | P1 | Block segmentation, prompt mapping |
| SQLite suggestion persistence | HIGH | LOW | P1 | Schema design |
| Accept/reject UI with visual diff | HIGH | MEDIUM | P1 | Suggestion data, jsdiff |
| Suggestion rationale display | MEDIUM | LOW | P1 | AI output schema |
| Dimension filtering | MEDIUM | LOW | P1 | Suggestion dimension tagging |
| Script merging | HIGH | LOW | P1 | Accept/reject state |
| PDF export of revised script | HIGH | LOW | P1 | Existing Playwright pipeline |
| DOCX export of revised script | HIGH | LOW | P1 | Existing docx library |
| Plain text export | MEDIUM | LOW | P1 | Trivial |
| FDX export | MEDIUM | HIGH | P2 | FDX XML generation |
| Suggestion priority ratings | MEDIUM | LOW | P2 | AI output schema |
| Batch accept/reject | MEDIUM | LOW | P2 | Dimension tagging |
| Regenerate single suggestion | MEDIUM | MEDIUM | P2 | Focused AI call |
| Harsh Critic integration | LOW | LOW | P3 | Critic analysis data |

**Priority key:**
- P1: Must have for v3.0 launch
- P2: Should have, add when core is solid
- P3: Nice to have, future consideration

## Per-Project-Type Suggestion Shapes

Different project types need fundamentally different suggestion strategies. This is not a one-size-fits-all feature.

| Project Type | What Gets Suggested | Block Definition | Analysis Fields Driving Suggestions |
|--------------|--------------------|-----------------|------------------------------------|
| Narrative | Dialogue rewrites, action line tightening, scene restructuring, character moment additions | Scene (heading + content), dialogue exchange, action paragraph | `storyStructure.structuralWeaknesses`, `scriptCoverage.dialogueQuality.weaknesses`, `scriptCoverage.overallWeaknesses`, `developmentRecommendations`, per-character weaknesses |
| TV/Episodic | Episode pacing fixes, act break repositioning, B-story integration, cold open/tag improvements | Scene, act section, dialogue exchange | Episode-level structural findings, arc assessment, pacing issues |
| Documentary | Interview passage reordering, narrative thread strengthening, quote selection optimization, structural reorganization | Speaker turn, thematic passage, editorial section | `editorialNotes.missingPerspectives`, `editorialNotes.suggestedStructure`, narrative thread gaps |
| Corporate | Messaging tightening, soundbite optimization, key message reinforcement, structure improvements | Speaker segment, messaging section | Key messaging analysis findings, soundbite quality, messaging gaps |

## Technical Considerations for Downstream

### AI Output Schema for Suggestions

Each suggestion should be structured as:

```typescript
{
  id: string,
  originalText: string,          // The block being replaced
  suggestedText: string,         // The replacement
  rationale: string,             // Why this change was suggested
  analysisDimension: string,     // Which analysis card/section drove this
  analysisFindings: string[],    // Specific findings referenced
  priority: 'critical' | 'recommended' | 'optional',
  position: { start: number, end: number },  // Character offsets in original text
  blockType: string              // 'scene' | 'dialogue' | 'action' | 'speaker-turn' | 'passage'
}
```

### Suggestion Count Guidance

- Aim for 8-15 suggestions per script. Too few feels incomplete; too many overwhelms.
- Group by analysis dimension so user can work through one category at a time.
- Critical suggestions first, optional last.

### Export Reuse Strategy

- **PDF:** Reuse existing Playwright pipeline with new HTML template for screenplay formatting (Courier 12pt, industry margins for narrative/TV; standard formatting for doc/corporate).
- **DOCX:** Reuse existing docx library with new document builder for screenplay formatting.
- **Plain text:** Direct string output. Trivial.
- **FDX:** New. Build XML using fast-xml-parser (already a dependency for FDX parsing). Map revised text back to FDX Paragraph elements with Type attributes (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition). Highest risk -- requires screenplay element detection from plain text.

### Tracked Changes UI Pattern

Based on research of Arc Studio, VS Code Copilot, and Cursor:

1. **Per-suggestion card layout** -- each suggestion is a card showing the diff, rationale, and accept/reject buttons. Fits the existing card-based workspace pattern.
2. **Inline diff within each card** -- red strikethrough for removed text, green highlight for added text. Word-level granularity via jsdiff `diffWords()`.
3. **Status indicators** -- pending (neutral), accepted (green check), rejected (red X). Persisted in SQLite.
4. **Dimension sidebar/filter** -- list of analysis dimensions with suggestion counts. Click to filter. Similar to how the workspace grid already organizes evaluation cards.
5. **Merge preview panel** -- shows the full revised script with accepted changes applied. Updates live as user accepts/rejects.

## Competitor Feature Analysis

| Feature | Scriptmatix | Arc Studio | Final Draft | FilmIntern v3.0 |
|---------|-------------|------------|-------------|-----------------|
| AI suggestions | Scene-level rewrites via "Rewrite in Story Engine" | No AI rewrite | No AI features | Block-level suggestions driven by structured analysis |
| Suggestion granularity | Scene-level | N/A | N/A | Block-level (dialogue exchange, action paragraph, thematic passage) |
| Analysis-to-suggestion link | Separate workflows -- user bridges manually | N/A | N/A | Automatic: suggestions derived from analysis findings with explicit rationale |
| Tracked changes display | Not tracked-changes -- paste into rewrite tool | Green/red between draft versions | Revision pages with asterisks | Inline diff per suggestion with accept/reject |
| Accept/reject | Manual -- user picks which to use | Per-draft comparison | Revision mode (whole-draft) | Per-suggestion accept/reject with persistence |
| Export formats | Fountain, PDF | PDF, FDX, Fountain | FDX, PDF | PDF, DOCX, FDX, plain text |
| Project type awareness | Screenplay only | Screenplay only | Screenplay only | 4 types with type-appropriate suggestions |

### Key Competitive Insight

No existing tool combines structured analysis with targeted rewrite suggestions in a tracked-changes review flow. Scriptmatix comes closest but treats analysis and rewriting as separate workflows. FilmIntern v3.0's core advantage is that suggestions are automatically derived from the analysis findings, with explicit rationale linking each suggestion to the specific weakness it addresses.

## Sources

- [Scriptmatix AI screenwriting workflow](https://scriptmatix.com/ai-screenwriting-hacks/) -- scene-level rewrite suggestions, "Rewrite in Story Engine" pattern
- [Arc Studio draft and revision management](https://help.arcstudiopro.com/guides/draft-revision-management) -- green/red tracked changes between drafts, per-author color coding
- [VS Code Copilot review code edits](https://code.visualstudio.com/docs/copilot/chat/review-code-edits) -- per-hunk accept/reject UI pattern
- [jsdiff (npm diff)](https://github.com/kpdecker/jsdiff) -- standard text diffing library for JavaScript, 40M+ weekly downloads
- [screenplay-tools FDX writer](https://github.com/wildwinter/screenplay-tools) -- FDX read/write in JavaScript (LOW confidence -- not widely adopted)
- [Best screenwriting software 2026](https://skene.pub/best-screenwriting-software-2026/) -- market landscape, Skrib tracked-changes approach
- [Scriptmatix analysis-to-rewrite flow](https://scriptmatix.com/ai-screenwriting-software-questions-answered/) -- how analysis and rewriting connect

---
*Feature research for: AI-driven script improvement (FilmIntern v3.0)*
*Researched: 2026-03-21*
