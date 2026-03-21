# Technology Stack: v3.0 Script Improvement Features

**Project:** FilmIntern v3.0 -- AI Rewrite Suggestions, Tracked Changes UI, FDX Export
**Researched:** 2026-03-21
**Confidence:** HIGH

## Scope

This research covers ONLY the new libraries and patterns needed for v3.0. The existing validated stack (Next.js 15, AI SDK 6, better-sqlite3, Playwright PDF export, docx library, fast-xml-parser for FDX reading) is not re-evaluated.

## Recommended Stack Additions

### Diff/Patch Operations

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `diff-match-patch-es` | ^0.1.x | Compute diffs between original and suggested text, apply accepted patches | ESM-native TypeScript rewrite of Google's diff-match-patch by Anthony Fu. Tree-shakable (import only `diff` and `patch` functions, skip `match`). The original `diff-match-patch` npm package hasn't been updated in 5+ years and is not ESM. `@sanity/diff-match-patch` is an alternative with good TypeScript support but heavier due to Sanity ecosystem dependencies. `diff-match-patch-es` is the cleanest fit for a modern Next.js 15 + TypeScript project. |

**Why diff-match-patch at all:** The core workflow is: (1) AI generates a rewritten version of a passage, (2) we diff original vs. rewrite to show insertions/deletions, (3) user accepts/rejects, (4) accepted patches are applied to produce the final text. Character-level diffing (not line-level) is critical because screenplay changes are often word-level within dialogue or action lines. diff-match-patch excels at this -- it was built for Google Docs.

**Alternatives rejected:**

| Alternative | Why Not |
|-------------|---------|
| `diff` (jsdiff by kpdecker) | Line-oriented by default; character diff exists but less battle-tested than diff-match-patch for prose. No built-in patch apply. |
| `@sanity/diff-match-patch` | Good TypeScript fork, but pulls in Sanity-ecosystem conventions. `diff-match-patch-es` is leaner and ESM-first. |
| `diff-match-patch` (original npm) | Not ESM, not tree-shakable, no TypeScript types, unmaintained since ~2020. |

### FDX Export (Writing)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `fast-xml-parser` (XMLBuilder) | ^5.5.6 (already installed) | Generate FDX XML output from script data | **No new dependency needed.** fast-xml-parser includes `XMLBuilder` alongside `XMLParser`. The project already uses fast-xml-parser ^5.5.6 for FDX reading. XMLBuilder can produce the same XML structure by building a JS object that mirrors the FDX schema and calling `builder.build(obj)`. |

**FDX file structure for writing** (HIGH confidence -- verified from sample files and format documentation):

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="4">
  <Content>
    <Paragraph Type="Scene Heading">
      <Text>INT. APARTMENT - NIGHT</Text>
    </Paragraph>
    <Paragraph Type="Action">
      <Text>The room is dark except for the glow of a laptop.</Text>
    </Paragraph>
    <Paragraph Type="Character">
      <Text>SARAH</Text>
    </Paragraph>
    <Paragraph Type="Dialogue">
      <Text>I can't believe you actually did it.</Text>
    </Paragraph>
  </Content>
</FinalDraft>
```

Valid `Paragraph Type` values: `Scene Heading`, `Action`, `Character`, `Dialogue`, `Parenthetical`, `Transition`, `General`. Text elements can carry style attributes (`@_Style`, `@_RevisionID`) but a minimal valid FDX only needs `Type` on Paragraph and plain `Text` children.

**Key implementation detail:** The existing `fdx-parser.ts` flattens FDX to plain text and discards paragraph types. For FDX **export**, the script text needs to be re-parsed into typed paragraphs. This means the internal data model for the revised script should preserve paragraph type annotations (Scene Heading, Action, Character, Dialogue, etc.), not just flat text. This is an architecture decision, not a library decision.

### Tracked Changes UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom React components | N/A | Display inline insertions/deletions with accept/reject buttons | **No new library needed.** Build a custom `<SuggestionDiff>` component that renders diff output (from diff-match-patch-es) as styled spans: green/underline for insertions, red/strikethrough for deletions, with per-suggestion accept/reject buttons. |

**Why NOT use Tiptap for tracked changes:**

Tiptap `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, and `@tiptap/static-renderer` are already in package.json (^3.20.4) but **not used anywhere in the codebase**. The Tracked Changes extension is a paid add-on requiring a Tiptap Platform subscription. For a personal single-user tool, paying for a collaboration-focused SaaS extension is unjustifiable. More importantly:

1. **The use case is review, not editing.** Users are not free-editing the script -- they are reviewing AI-generated suggestions and clicking accept/reject. This is a read-mostly UI with binary actions per suggestion, not a rich text editor.
2. **Tiptap adds ~150KB+ to the bundle** for functionality that amounts to rendering colored spans with buttons.
3. **The `@buddhima_a/tiptap-diff-suggestions` community extension** exists (7 commits, 22 stars, last updated Dec 2024) but is too immature and low-activity to depend on for production.

**Recommendation: Remove Tiptap from dependencies.** It was likely added speculatively for v3.0 but the tracked-changes UI is better served by a lightweight custom component. If Tiptap is genuinely needed later (e.g., for free-form script editing), it can be re-added.

**Why NOT use react-diff-viewer:** These libraries (react-diff-viewer, react-diff-viewer-continued) render side-by-side or unified code diffs in a GitHub-style view. They are designed for code review, not screenplay review with per-suggestion accept/reject. The UI metaphor is wrong -- we need inline tracked changes (like Word's Track Changes), not a diff panel.

### AI Structured Output for Suggestions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| AI SDK 6 `generateObject` | ^6.0.116 (already installed) | Generate structured array of rewrite suggestions | **No new dependency needed.** Use `generateObject` with `output: 'array'` mode and a Zod schema for each suggestion. This returns a typed array where each element conforms to the schema. Already proven in the codebase via `streamText` + `Output.object`. |
| Zod | ^4.3.6 (already installed) | Define suggestion schema | Already used for all analysis schemas. |

**Suggested Zod schema pattern:**

```typescript
const suggestionSchema = z.object({
  id: z.string().describe('Unique identifier for this suggestion'),
  location: z.object({
    paragraphIndex: z.number().describe('Index of the paragraph in the script'),
    originalText: z.string().describe('The exact original text being targeted'),
  }),
  replacementText: z.string().describe('The suggested replacement text'),
  rationale: z.string().describe('Why this change improves the script, referencing the analysis finding'),
  category: z.enum([
    'dialogue', 'action', 'pacing', 'structure', 'character', 'clarity'
  ]).describe('What aspect of the script this suggestion addresses'),
  severity: z.enum(['minor', 'moderate', 'significant']).describe('Impact level of the issue'),
  analysisRef: z.string().describe('Which analysis dimension flagged this issue'),
});
```

**Why `generateObject` not `streamText`:** Suggestions are discrete items with clear structure. Unlike the analysis (which benefits from streaming for progressive display), suggestions should be generated as a complete batch so the UI can render the full tracked-changes view at once. If generation is slow, a loading state is more appropriate than partial suggestion rendering. If streaming is desired later, `streamObject` with `output: 'array'` can stream individual array elements as they complete.

### Script Text Export (PDF, DOCX, Plain Text)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Playwright (chromium) | ^1.58.2 (already installed) | PDF export of revised script | Same pattern as existing `export-pdf.ts`. Render script as HTML, print to PDF via Playwright. |
| `docx` | ^9.6.1 (already installed) | DOCX export of revised script | Same library used for existing analysis DOCX export. Build screenplay-formatted Document with paragraph types mapped to Word styles. |

**No new dependencies for script export.** The existing export infrastructure handles the output formats. The new work is building screenplay-formatted templates (as opposed to the current analysis-report templates), but that is implementation work, not library work.

## What NOT to Add

| Avoid | Why | What to Do Instead |
|-------|-----|-------------------|
| Tiptap Tracked Changes (paid extension) | Paid SaaS add-on for a personal tool; review UI is simpler than a full editor | Custom React component with diff-match-patch-es |
| `@tiptap/*` packages (remove existing) | 4 packages in package.json, 0 imports in codebase; adds ~150KB+ bundle weight for unused functionality | Remove from package.json; re-add only if free-form editing is needed later |
| `react-diff-viewer` or similar | Code-review UI metaphor (side-by-side panels) doesn't match the tracked-changes UX needed | Custom inline diff rendering with styled spans |
| `prosemirror-changeset` | Low-level ProseMirror plugin; requires building an entire editor around it | Custom component is simpler for review-only use case |
| Fountain.js or other screenplay parsers | The project already parses all needed formats; adding another parser adds complexity | Enhance existing parsers to preserve paragraph type metadata |
| Any collaboration/real-time library (Y.js, Automerge) | Single-user personal tool; no collaboration use case | N/A |
| `xml2js`, `xmlbuilder2`, or other XML libraries | fast-xml-parser already handles both read (XMLParser) and write (XMLBuilder) | Use existing fast-xml-parser |

## Summary: Total New Dependencies

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `diff-match-patch-es` | Diff computation and patch application | ~15KB minified (tree-shakable) |

**That's it. One new package.** Everything else is already installed or should be removed (Tiptap).

## Installation

```bash
# One new dependency
npm install diff-match-patch-es

# Remove unused Tiptap packages (speculatively added, never used)
npm uninstall @tiptap/pm @tiptap/react @tiptap/starter-kit @tiptap/static-renderer
```

## Integration Points with Existing Stack

### AI Suggestion Generation
- **Existing:** `streamText` + `Output.object` + Zod schema + provider registry in `src/app/api/analyze/route.ts`
- **New:** `generateObject` + `output: 'array'` + suggestion Zod schema + same provider registry
- **Pattern:** Create `src/app/api/suggestions/route.ts` following the identical pattern as the analysis route (settings loading, provider health check, registry building)

### FDX Export
- **Existing:** `fast-xml-parser` XMLParser in `src/lib/parsers/fdx-parser.ts`
- **New:** `fast-xml-parser` XMLBuilder in new `src/lib/documents/export-fdx.ts`
- **Pattern:** Mirror the export-pdf.ts / export-docx.ts pattern but output XML string via XMLBuilder

### Diff/Merge Engine
- **New module:** `src/lib/diff/` containing:
  - `compute-diff.ts` -- wraps diff-match-patch-es to produce typed diff results
  - `apply-patches.ts` -- applies accepted suggestions to produce final text
  - `types.ts` -- shared types for suggestions, diffs, patches

### Tracked Changes UI
- **New component:** `src/components/suggestions/` containing:
  - `SuggestionCard.tsx` -- single suggestion with inline diff display and accept/reject
  - `SuggestionList.tsx` -- scrollable list of all suggestions for a script
  - `SuggestionToolbar.tsx` -- accept all / reject all / export revised script
- **Styling:** Use existing Tailwind + shadcn patterns; insertion = green text, deletion = red strikethrough

### Revised Script Data Model
- **Existing:** Scripts stored as flat text in SQLite after parsing
- **New:** Need a structured representation preserving paragraph types for FDX export
- **Approach:** Store paragraph-typed script data (array of `{type, text}` objects) in SQLite JSON column alongside the flat text

## Version Compatibility

| New Package | Compatible With | Notes |
|-------------|-----------------|-------|
| `diff-match-patch-es` ^0.1.x | Node 22 LTS, Next.js 15+, ESM | Pure TypeScript, no native dependencies, tree-shakable ESM |
| `fast-xml-parser` XMLBuilder ^5.5.x | Same version already in use | Same package, different export (`XMLBuilder` instead of `XMLParser`) |

## Sources

- [diff-match-patch-es GitHub (antfu)](https://github.com/antfu/diff-match-patch-es) -- ESM rewrite, HIGH confidence
- [diff-match-patch-es npm](https://www.npmjs.com/package/diff-match-patch-es) -- package info, HIGH confidence
- [@sanity/diff-match-patch npm](https://www.npmjs.com/package/@sanity/diff-match-patch) -- alternative evaluated, MEDIUM confidence
- [fast-xml-parser XMLBuilder docs](https://naturalintelligence.github.io/fast-xml-parser/) -- official docs confirming XMLBuilder, HIGH confidence
- [fast-xml-parser GitHub](https://github.com/NaturalIntelligence/fast-xml-parser) -- 52M+ weekly downloads, HIGH confidence
- [FDX format sample (rsdoiel/fdx)](https://github.com/rsdoiel/fdx/blob/main/testdata/sample-01.fdx) -- XML structure reference, MEDIUM confidence
- [FDX format documentation (Just Solve)](http://justsolve.archiveteam.org/wiki/Final_Draft) -- format overview, MEDIUM confidence
- [Tiptap Tracked Changes docs](https://tiptap.dev/docs/editor/extensions/functionality/tracked-changes) -- paid extension confirmation, HIGH confidence
- [Tiptap pricing page](https://tiptap.dev/pricing) -- tracked changes is paid add-on, HIGH confidence
- [tiptap-diff-suggestions community extension](https://github.com/bsachinthana/tiptap-diff-suggestions) -- too immature, LOW confidence
- [AI SDK generateObject docs](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) -- array output mode, HIGH confidence
- [AI SDK structured data generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) -- schema patterns, HIGH confidence

---
*Stack research for: FilmIntern v3.0 Script Improvement Features*
*Researched: 2026-03-21*
