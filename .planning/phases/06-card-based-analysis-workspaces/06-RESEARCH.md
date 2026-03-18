# Phase 6: Card-Based Analysis Workspaces - Research

**Researched:** 2026-03-18
**Domain:** React component architecture, streaming UI, Zod schema evolution
**Confidence:** HIGH

## Summary

Phase 6 replaces the existing analysis display (which currently shows a generic skeleton during streaming, then renders a Tiptap-based report document after completion) with five project-type-specific workspace components that progressively reveal evaluation dimension cards as streaming data arrives. The workspaces are purely frontend React components consuming existing streaming data; the only backend changes are adding `overallScore` and `overallSummary` fields to each of the five Zod schemas and their corresponding prompts.

The codebase already has the complete foundation: Card/Badge/Skeleton/Accordion UI components from shadcn, a `Partial<T>` streaming pattern in `page.tsx`, and five existing report components (`narrative-report.tsx`, `analysis-report.tsx`, `corporate-report.tsx`, `tv-report.tsx`, `short-form-report.tsx`) whose rendering logic can be directly refactored into the new card-based architecture. The existing report components contain proven badge color conventions and data-to-UI mapping logic that should be preserved, not reinvented.

**Primary recommendation:** Build a shared `EvaluationCard` collapsible wrapper and per-project-type workspace components, wire them into `page.tsx` during the streaming phase (replacing the current skeleton-only display), and update `DocumentWorkspace` to render the workspace in the Report tab post-streaming.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cards render **structured rich data** -- schema fields displayed meaningfully with badges and ratings, not dumped as prose
- Key Quotes card shows quotes with `[must-use]` / `[strong]` / `[supporting]` usefulness badges; Story Structure card shows beat list with name, page position, and effectiveness badge per row
- For cards with dense nested data (e.g., Character Arcs), show **top 3 items** with "Show more" toggle
- **Story Structure beats are interactive**: each beat row is clickable and expands inline to show description text (data already exists in schema)
- All cards are **collapsible** via card header click, **start expanded by default**, collapse state is **not persisted**
- Workspace header: workspace title + project type chip + numeric overall quality score (format: `Story Lab Workspace  [Narrative Film]  8.0 / 10`)
- Overall quality score requires adding `overallScore: z.number()` and `overallSummary: z.string()` to each schema and prompt
- **Workspace names** (locked): Narrative Film = "Story Lab Workspace", Documentary = "Documentary Workspace"
- Cards **appear progressively** as data streams in; skeleton shimmer for cards not yet arrived
- **Subtle status bar** above card grid during streaming: "Analyzing * Extracting key quotes..." updates per section, disappears on completion
- Extends existing progressive `JSON.parse` streaming pattern

### Claude's Discretion
- Exact workspace names for Corporate Interview, TV/Episodic, and Short-Form/Branded
- Visual design of the collapsible card header toggle (chevron, arrow, or similar)
- Color/style of the overall quality score badge
- Exact "Show more" / "Show less" wording and visual treatment
- Status bar copy during streaming
- How to determine which cards are "ready" during streaming

### Deferred Ideas (OUT OF SCOPE)
- Score/rating visualizations (circular gauges, dimension radar charts) -- WORK-06
- User annotation of individual cards -- WORK-07
- Collapse state persistence per analysis -- Phase 7 / Library scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-01 | Narrative analysis displays as "Story Lab Workspace" with 8 evaluation dimension cards | Narrative schema fully mapped to 8 cards in UI-SPEC; schema needs `overallScore`/`overallSummary` addition |
| WORK-02 | Documentary analysis displays with 6 interview-specific evaluation cards | Documentary schema has 4 of 6 data sources; Subject Profiles and Story Arc need new schema fields or derivation from existing data |
| WORK-03 | Corporate interview analysis displays with 6 messaging-specific cards | Corporate schema has 3 of 6 directly; Spokesperson Assessment, Audience Alignment, Message Consistency need new fields or derivation |
| WORK-04 | TV/Episodic analysis displays with 6 episode/series evaluation cards | TV schema structure maps to 6 cards with restructuring; current `episodeAnalysis`/`seriesAnalysis` nesting needs remapping |
| WORK-05 | Short-form/branded analysis displays with 6 pacing/messaging cards | Short-form schema maps directly to 6 cards (hookStrength, pacing, messagingClarity->CTA Clarity, ctaEffectiveness, emotionalRationalBalance, summary-derived audience fit) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App framework | Already in use |
| React | 19.x | UI library | Already in use |
| Zod | 4.x | Schema validation | Already in use for all analysis schemas |
| shadcn/base-ui | v4 / 1.3.0 | Component library | Already initialized with base-nova preset |
| lucide-react | 0.577.0 | Icons | ChevronDown/ChevronUp for card collapse toggle |
| Tailwind CSS | 4.x | Styling | Already configured with theme tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react Accordion | 1.3.0 | Collapse animation | Reference animation timing for card collapse; may use directly for beat expand |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom collapse animation | Accordion primitive directly | Accordion adds item/trigger/content nesting overhead; simpler to use CSS height transition matching accordion timing |
| Separate workspace routing | Single component with projectType switch | All workspaces share identical shell (header + grid + status bar); only card content varies per type |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    workspaces/
      workspace-header.tsx          # WorkspaceHeader (title + chip + score)
      workspace-grid.tsx            # WorkspaceGrid (responsive CSS grid container)
      evaluation-card.tsx           # EvaluationCard (collapsible card wrapper)
      streaming-status-bar.tsx      # StreamingStatusBar (pulsing dot + text)
      score-badge.tsx               # ScoreBadge (numeric score display)
      show-more-toggle.tsx          # ShowMoreToggle (top 3 + expand)
      narrative-workspace.tsx       # 8-card workspace
      documentary-workspace.tsx     # 6-card workspace
      corporate-workspace.tsx       # 6-card workspace
      tv-workspace.tsx              # 6-card workspace
      short-form-workspace.tsx      # 6-card workspace
    ui/                             # Existing shadcn components (unchanged)
  lib/
    ai/
      schemas/                      # Add overallScore + overallSummary to each
      prompts/                      # Add overall assessment instruction to each
```

### Pattern 1: Shared Workspace Shell
**What:** All 5 workspace components share identical structure: WorkspaceHeader + StreamingStatusBar + WorkspaceGrid containing EvaluationCards. Only the card definitions differ.
**When to use:** Every workspace component.
**Example:**
```typescript
// Each workspace component follows this pattern:
interface WorkspaceProps {
  data: Partial<SpecificAnalysis> | null;
  isStreaming: boolean;
}

function NarrativeWorkspace({ data, isStreaming }: WorkspaceProps) {
  return (
    <>
      <WorkspaceHeader
        title="Story Lab Workspace"
        projectType="Narrative Film"
        score={data?.overallScore}
      />
      {isStreaming && (
        <StreamingStatusBar currentSection={detectCurrentSection(data)} />
      )}
      <WorkspaceGrid>
        <EvaluationCard title="Logline & Premise" ready={!!data?.scriptCoverage?.marketability}>
          {/* Card content */}
        </EvaluationCard>
        {/* ... more cards */}
      </WorkspaceGrid>
    </>
  );
}
```

### Pattern 2: Progressive Card Readiness Detection
**What:** Each card declares a "ready" condition based on which schema fields have been populated by streaming. Cards whose data hasn't arrived yet show a Skeleton placeholder.
**When to use:** During streaming, to determine whether to show real content or skeleton.
**Example:**
```typescript
// The EvaluationCard handles the skeleton/content toggle:
function EvaluationCard({ title, ready, children }: {
  title: string;
  ready: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardAction>
          <button aria-label={collapsed ? "Expand card" : "Collapse card"}>
            {collapsed ? <ChevronDown /> : <ChevronUp />}
          </button>
        </CardAction>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          {ready ? children : <CardSkeleton />}
        </CardContent>
      )}
    </Card>
  );
}
```

### Pattern 3: Unified Badge Helper (extracted from existing reports)
**What:** Extract the duplicated `EffectivenessBadge` / `RatingBadge` switch statements from the 5 existing report components into a single shared utility.
**When to use:** Every badge rendering across all workspace cards.
**Why:** Currently duplicated in narrative-report.tsx, corporate-report.tsx, tv-report.tsx, short-form-report.tsx with slightly different value mappings. Unify into one component covering all enum values.

### Pattern 4: Schema Field -> Card Data Source Mapping
**What:** Each workspace card maps to specific schema fields. The UI-SPEC defines these mappings.
**When to use:** Reference during implementation to know which Partial<T> fields to check for readiness.

**Critical mapping observations from schema analysis:**

- **Narrative**: All 8 cards map cleanly to existing schema fields. `storyStructure.beats` has `description` for inline expand. No new schema fields needed beyond overallScore/overallSummary.
- **Documentary**: `keyQuotes`, `recurringThemes`, `keyMoments`, `editorialNotes` exist. **Subject Profiles** and **Story Arc** need new schema fields -- they don't exist in current `documentaryAnalysisSchema`.
- **Corporate**: `soundbites`, `messagingThemes`, `speakerEffectiveness`, `editorialNotes` exist. **Spokesperson Assessment**, **Audience Alignment**, **Message Consistency** as standalone card data sources need to be derived from existing fields or added as new schema fields.
- **TV/Episodic**: `episodeAnalysis.episodeArc`, `seriesAnalysis` exists but card mapping requires restructuring. **Character Development** needs to come from `characterIntroductions`. **Tone & Voice**, **Pilot Effectiveness**, **Franchise Potential** need new schema fields.
- **Short-form**: `hookStrength`, `pacing`, `messagingClarity`, `ctaEffectiveness`, `emotionalRationalBalance` map to 5 of 6 cards. **Audience Fit** needs a new field or derivation.

### Anti-Patterns to Avoid
- **Monolith workspace component:** Don't put all 5 project types in one file. Each gets its own component file with clear card definitions.
- **Re-implementing badge logic:** Don't create new badge color mappings. Extract from existing report components and share.
- **Breaking the DocumentWorkspace contract:** The Report tab in DocumentWorkspace currently renders a Tiptap document. Phase 6 replaces the content of that tab, but must preserve the Outline/Treatment/Proposal tab functionality and export capability.
- **Schema breaking changes:** Adding `overallScore`/`overallSummary` must not break existing analyses. Make them optional in the schema (`.optional()`) so partial streaming data and older cached results still parse.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapse animation | Custom CSS keyframes | Match existing accordion `animate-accordion-down`/`animate-accordion-up` timing | Consistency with existing UI; animation already defined in Tailwind config |
| Responsive grid | Custom media queries | Tailwind `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` | Standard responsive pattern |
| Skeleton loading | Custom loading states | Existing `Skeleton` component from `ui/skeleton.tsx` | Already styled with `animate-pulse bg-muted` |
| Badge color mapping | Per-component switch statements | Single shared `EffectivenessBadge` helper | Currently duplicated 4x across report components |

## Common Pitfalls

### Pitfall 1: Schema Changes Breaking Streaming
**What goes wrong:** Adding required fields to Zod schemas causes `JSON.parse` of in-progress streaming data to fail validation.
**Why it happens:** New fields like `overallScore` won't exist in partial JSON until the AI generates them (typically late in the response).
**How to avoid:** Make all new schema fields optional (`.optional()`) or ensure the workspace components handle `undefined` gracefully. The streaming consumer in `page.tsx` uses raw `JSON.parse`, NOT Zod validation, so the schema additions won't break streaming -- but the TypeScript types derived from the schema need to match.
**Warning signs:** Type errors when accessing `data?.overallScore` on `Partial<T>`.

### Pitfall 2: Card Grid Layout Shifts During Streaming
**What goes wrong:** Cards appear and change size as data streams in, causing layout jumps.
**Why it happens:** Skeleton cards have fixed height but real content varies.
**How to avoid:** Use consistent min-height on skeleton cards. Grid with `auto-rows-min` handles variable heights gracefully.
**Warning signs:** Visual jumping when cards transition from skeleton to content.

### Pitfall 3: Losing DocumentWorkspace Integration
**What goes wrong:** New workspace components break the existing Report/Outline/Treatment tab structure and export functionality.
**Why it happens:** Over-scoping -- replacing DocumentWorkspace entirely instead of just the Report tab content.
**How to avoid:** Phase 6 replaces what renders INSIDE the Report tab. The DocumentWorkspace tab shell, generate buttons, and export functionality remain unchanged. The workspace component is a child of the Report tab, not a replacement of DocumentWorkspace.
**Warning signs:** Export or document generation stops working after Phase 6 changes.

### Pitfall 4: Workspace Component Renders Both During AND After Streaming
**What goes wrong:** The workspace needs to work in two contexts: (1) during streaming with `Partial<T>` data and skeletons, and (2) after streaming with complete data.
**Why it happens:** Currently, streaming shows a generic skeleton and post-streaming shows DocumentWorkspace with a Tiptap report. Phase 6 needs the workspace to replace BOTH displays.
**How to avoid:** The workspace component receives `data` and `isStreaming` props (same pattern as existing report components). During streaming, it renders in `page.tsx` where the skeleton currently is. After streaming, it renders inside DocumentWorkspace's Report tab. Consider extracting the workspace rendering to be used in both locations, or restructuring so the workspace appears in one place that persists from streaming through completion.

### Pitfall 5: Schema Field Gaps for Documentary/Corporate/TV Cards
**What goes wrong:** UI-SPEC card inventory references fields that don't exist in current schemas (Subject Profiles, Story Arc, Spokesperson Assessment, Audience Alignment, Message Consistency, Tone & Voice, Pilot Effectiveness, Franchise Potential, Audience Fit).
**Why it happens:** The card names from WORK-01 through WORK-05 requirements were designed for the ideal workspace experience, but current schemas were designed for the original analysis report format.
**How to avoid:** For each missing field, choose between: (a) adding new fields to the schema + prompt, or (b) deriving the card content from existing fields. Decision should be per-card based on whether existing data supports the card's intent.
**Warning signs:** Cards rendering empty because the schema doesn't produce the expected data.

## Code Examples

### Existing Streaming Pattern (from page.tsx)
```typescript
// Current pattern -- accumulate JSON, attempt parse, set partial data
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  accumulated += decoder.decode(value, { stream: true });
  try {
    const partial = JSON.parse(accumulated);
    setAnalysisData(partial);  // This is Partial<T> during streaming
  } catch {
    // Incomplete JSON -- continue
  }
}
```

### Existing Badge Color Convention (from narrative-report.tsx)
```typescript
// Green for strong/positive
<Badge className="bg-green-600 text-white hover:bg-green-600/80">{value}</Badge>
// Secondary for adequate/moderate
<Badge variant="secondary">{value}</Badge>
// Destructive for weak/negative
<Badge variant="destructive">{value}</Badge>
// Muted for missing
<Badge className="bg-muted-foreground text-white hover:bg-muted-foreground/80">{value}</Badge>
// Outline for unknown/other
<Badge variant="outline">{value}</Badge>
```

### Existing Card Component API (from ui/card.tsx)
```typescript
// CardAction slot positions in top-right of CardHeader via grid
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction>
      {/* Chevron toggle goes here */}
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Card body */}
  </CardContent>
</Card>
```

### Accordion Animation Timing (from ui/accordion.tsx)
```typescript
// Animations to match for card collapse:
// data-open:animate-accordion-down
// data-closed:animate-accordion-up
// Height transition: h-(--accordion-panel-height) with data-ending-style:h-0 data-starting-style:h-0
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic skeleton during streaming | Project-type-specific workspace with progressive card reveal | Phase 6 | Users see structured analysis emerging card-by-card |
| Tiptap document for Report tab | Workspace cards for Report tab | Phase 6 | Richer, interactive display vs. flat document |
| Separate report components per type | Unified workspace architecture with shared shell | Phase 6 | Code reuse via EvaluationCard, WorkspaceHeader, etc. |

## Open Questions

1. **Streaming-to-Post-Streaming Transition**
   - What we know: Currently, streaming shows a skeleton block and post-streaming shows DocumentWorkspace with Report tab. Phase 6 workspace needs to appear during streaming AND persist after.
   - What's unclear: Should the workspace render in both locations (page.tsx streaming block AND DocumentWorkspace Report tab), or should the architecture change so streaming and post-streaming use the same component mount point?
   - Recommendation: Restructure page.tsx to show the workspace component in a single location that works for both states. During streaming, hide the DocumentWorkspace tabs (since no Report tab content is needed yet); after streaming, mount the workspace inside DocumentWorkspace Report tab. OR: show workspace during streaming in a standalone position, then "move" it into DocumentWorkspace after completion. The simplest approach: keep workspace rendering during streaming outside DocumentWorkspace, then after completion build the report document AND render the workspace inside DocumentWorkspace's Report tab.

2. **Schema Additions for Missing Card Fields**
   - What we know: Documentary needs Subject Profiles + Story Arc; Corporate needs Spokesperson Assessment + Audience Alignment + Message Consistency; TV needs Tone & Voice + Pilot Effectiveness + Franchise Potential; Short-form needs Audience Fit.
   - What's unclear: Whether to add entirely new top-level fields to each schema (more AI generation work, longer responses, higher token cost) or derive card content from existing fields (less schema change but potentially thinner card content).
   - Recommendation: Add new schema fields for cards that genuinely need new analysis (e.g., Subject Profiles, Franchise Potential). For cards where existing data can be restructured (e.g., Spokesperson Assessment from speakerEffectiveness data), derive rather than duplicate. Make a per-card decision during planning.

3. **Report Document Compatibility**
   - What we know: `buildReportDocument` creates a Tiptap JSON document from analysis data, used for export (PDF/DOCX). Phase 6 replaces the visual display but exports still need document format.
   - What's unclear: Should the export pipeline also change, or should `buildReportDocument` continue generating Tiptap documents from the same analysis data?
   - Recommendation: Keep `buildReportDocument` and the export pipeline unchanged. The workspace is a view layer change; exports continue using the normalized document format.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (jsdom environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | Narrative workspace renders 8 cards with correct titles | unit | `npx vitest run src/components/workspaces/__tests__/narrative-workspace.test.tsx -x` | Wave 0 |
| WORK-02 | Documentary workspace renders 6 cards | unit | `npx vitest run src/components/workspaces/__tests__/documentary-workspace.test.tsx -x` | Wave 0 |
| WORK-03 | Corporate workspace renders 6 cards | unit | `npx vitest run src/components/workspaces/__tests__/corporate-workspace.test.tsx -x` | Wave 0 |
| WORK-04 | TV/Episodic workspace renders 6 cards | unit | `npx vitest run src/components/workspaces/__tests__/tv-workspace.test.tsx -x` | Wave 0 |
| WORK-05 | Short-form workspace renders 6 cards | unit | `npx vitest run src/components/workspaces/__tests__/short-form-workspace.test.tsx -x` | Wave 0 |
| ALL | EvaluationCard collapse/expand toggles correctly | unit | `npx vitest run src/components/workspaces/__tests__/evaluation-card.test.tsx -x` | Wave 0 |
| ALL | Schema additions (overallScore, overallSummary) validate | unit | `npx vitest run src/lib/ai/schemas/__tests__/ -x` | Existing (update) |
| ALL | Streaming skeleton shown for cards without data | unit | `npx vitest run src/components/workspaces/__tests__/narrative-workspace.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/workspaces/__tests__/evaluation-card.test.tsx` -- covers collapse/expand behavior, skeleton display, aria-labels
- [ ] `src/components/workspaces/__tests__/narrative-workspace.test.tsx` -- covers WORK-01 (8 cards, correct titles, streaming skeleton)
- [ ] `src/components/workspaces/__tests__/documentary-workspace.test.tsx` -- covers WORK-02
- [ ] `src/components/workspaces/__tests__/corporate-workspace.test.tsx` -- covers WORK-03
- [ ] `src/components/workspaces/__tests__/tv-workspace.test.tsx` -- covers WORK-04
- [ ] `src/components/workspaces/__tests__/short-form-workspace.test.tsx` -- covers WORK-05
- [ ] Update existing schema tests to cover new overallScore/overallSummary fields

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 5 existing schemas: `src/lib/ai/schemas/{narrative,documentary,corporate,tv-episodic,short-form}.ts`
- Direct codebase analysis of all 5 existing report components: `src/components/{narrative-report,analysis-report,corporate-report,tv-report,short-form-report}.tsx`
- Direct codebase analysis of integration surfaces: `src/app/page.tsx`, `src/components/document-workspace.tsx`, `src/contexts/workspace-context.tsx`
- Direct codebase analysis of UI components: `src/components/ui/{card,accordion,skeleton,badge}.tsx`
- Phase 6 UI-SPEC: `.planning/phases/06-card-based-analysis-workspaces/06-UI-SPEC.md`
- Phase 6 CONTEXT.md: `.planning/phases/06-card-based-analysis-workspaces/06-CONTEXT.md`

### Secondary (MEDIUM confidence)
- None needed -- this phase is entirely about codebase-internal architecture

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - clear patterns from existing report components, well-defined UI-SPEC
- Pitfalls: HIGH - identified from direct code analysis of streaming pattern and schema structures

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- internal architecture, no external dependency risk)
