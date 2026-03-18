# Feature Research: v1.1 UI Redesign -- Card Workspaces, Theme, Library

**Domain:** Filmmaking AI Workflow / Analysis Workspace UI
**Researched:** 2026-03-17
**Confidence:** HIGH (features are well-scoped in PROJECT.md; existing codebase thoroughly reviewed; UI patterns well-established)

## Existing Foundation (Already Built in v1.0)

Understanding what exists is critical for scoping what v1.1 adds:

- **5 project types** with dedicated report components: `NarrativeReport`, `AnalysisReport` (documentary), `CorporateReport`, `TvReport`, `ShortFormReport`
- **AI schemas** with structured Zod schemas per type returning typed analysis data
- **DocumentWorkspace** component with tabbed document switching (report, generated docs)
- **WorkspaceContext** holding all state in React context (no persistence -- entirely in-memory)
- **Sidebar navigation** with Dashboard, Projects, Shot Lists, Image Prompts, Exports, Settings
- **No storage layer** -- zero localStorage, IndexedDB, or database usage. Analyses vanish on page refresh.
- **Dark-only UI** -- currently hardcoded `stone-900` sidebar, no theme system

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that the v1.1 milestone must deliver. Missing any of these makes the update feel incomplete.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Dark/light theme toggle** | Every modern creative tool supports this. The current hardcoded dark UI is a v1 shortcut. Users working in bright environments need a light mode. | LOW | Requires `next-themes` + Tailwind CSS dark mode class strategy. Existing shadcn/ui components already support dark mode via CSS variables. |
| **Theme persistence** | If I set dark mode, it must stay dark mode after refresh. System-preference detection is also expected. | LOW | `next-themes` handles this via localStorage automatically. No custom storage needed. |
| **Orange/amber brand accent system** | PROJECT.md specifies this. Already partially present (amber-500 in NarrativeReport CategoryLabel) but inconsistent. Must be systematic. | LOW | CSS variable definitions for primary/accent colors that adapt to light/dark. Already using some `amber-500/600` classes. |
| **Card-based evaluation dimensions per project type** | This is the core v1.1 deliverable. The current reports are already card-based (using shadcn Card components) but the cards are generic sections, not "evaluation dimension" cards with clear scoring/rating. The redesign makes each card a focused evaluation lens. | MEDIUM | Existing report components and AI schemas provide all the data. This is primarily a UI restructuring, not new AI work. |
| **Narrative "Story Lab Workspace" with 8 cards** | Explicitly specified in PROJECT.md. The current NarrativeReport already renders 8 numbered sections (Logline, Structure, Characters, Dialogue, Theme, Pacing, Genre, Recommendations). The redesign elevates these into a named workspace identity. | MEDIUM | Existing `narrativeAnalysisSchema` already produces all needed data for 8 cards. No schema changes needed. |
| **Auto-save analyses after completion** | A Library is useless without saved content. Analyses must persist without user action. | MEDIUM | Requires a storage layer (IndexedDB via `idb` or localStorage). Currently zero persistence exists. This is the biggest infrastructure addition. |
| **Library page: browse saved analyses** | PROJECT.md requirement. Users need to see what they've previously analyzed. | MEDIUM | Depends on storage layer. Needs a list view with project type, title, date, and quick status. |
| **Library: open a saved analysis** | Users must be able to click a saved analysis and see it rendered in its workspace view. | MEDIUM | Requires hydrating WorkspaceContext from stored data. Need a routing scheme (e.g., `/library/[id]` or rehydrating the main page). |
| **Library: delete a saved analysis** | Basic CRUD. Users need to remove old or test analyses. | LOW | Simple storage deletion + UI confirmation. |

### Differentiators (Set This Update Apart)

Features that make the v1.1 redesign feel like a genuine upgrade, not just a reskin.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| **Named workspace identities per project type** | "Story Lab Workspace" (narrative), "Interview Mining Workspace" (documentary), "Messaging Workspace" (corporate), "Episode Lab" (TV/episodic), "Content Pulse" (short-form). Gives each analysis type a distinct professional personality beyond generic "Analysis Report." | LOW | Naming + workspace header component. No data changes. |
| **Evaluation dimension cards with visual scoring** | Each card shows a clear effectiveness rating (badge system already exists) but enhanced with visual weight: color-coded borders, summary scores, expand/collapse for detail. The current flat list of cards becomes a scannable dashboard. | MEDIUM | Existing badge system (EffectivenessBadge, RatingBadge) is the foundation. Add card-level summary indicators. |
| **Card grid layout (not just vertical stack)** | Current reports are a single vertical column of cards. A 2-column grid for wider screens lets users scan evaluation dimensions at a glance, like a dashboard. | LOW | CSS Grid/Flexbox. Already using responsive `grid-cols-1 md:grid-cols-2` inside cards -- extend to card-level layout. |
| **Library with project-type filtering** | Filter saved analyses by documentary, narrative, corporate, etc. Small feature, big usability win when the Library grows. | LOW | Client-side filter on stored metadata. |
| **Library with search** | Search by title or content keywords across saved analyses. | LOW | Client-side text search on stored metadata (title, overview text). |
| **Library card previews** | Show a preview snippet of the analysis (overview text, key rating, date) on each Library card rather than just a title and date. | LOW | Pull summary/overview from stored analysis data for the card preview. |
| **Workspace header with project metadata** | Show project title, project type badge, analysis date, file name at the top of every workspace. Currently this metadata is scattered or absent. | LOW | Pull from WorkspaceContext. Already stores `title`, `projectType`. |

### Anti-Features (Do NOT Build in v1.1)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Server-side database for Library** | "Real" persistence, future multi-device sync | Massively overengineered for a single-user personal tool. Adds API routes, migrations, connection management. IndexedDB gives the same persistence for this use case. | Use IndexedDB via `idb` library. Revisit server storage only if multi-device becomes a real need. |
| **Drag-and-drop card reordering** | Users might want to rearrange evaluation cards | Adds complexity (drag library, state management for custom order, persistence of order) for minimal value. Evaluation dimensions have a logical order that should be opinionated. | Fixed card order per project type, designed for logical reading flow. |
| **Custom theme colors / theme editor** | Power users want to customize beyond light/dark | Scope creep. Two themes (light/dark) with a good brand palette is more than enough. | Ship light and dark with orange/amber accents. Done. |
| **Collaborative annotations on cards** | "Share feedback with my editor" | Multi-user is explicitly out of scope. Adds auth, real-time sync, comment threading. | Export the analysis as PDF/DOCX (already built) and share that. |
| **Analysis comparison view** | "Compare two analyses side by side" | Cool but complex: requires a new layout paradigm, data alignment logic, and unclear UX for different project types. | Defer to v2+. Users can open two browser tabs for now. |
| **Cloud sync / backup** | "What if I lose my data" | Requires a backend service, auth, and storage infrastructure. | IndexedDB is persistent across sessions. Users can export to PDF/DOCX for archival. Mention in UI that analyses are stored locally. |
| **Tagging or folder organization in Library** | "Organize my analyses into projects" | Premature structure. Until the Library has 50+ items, flat list with search/filter is simpler and faster. | Filter by project type + search by title. Add folders later if needed. |

---

## Evaluation Dimensions Per Project Type

This is the core intellectual design of v1.1. Each project type gets a workspace with evaluation "dimension" cards tailored to what matters for that type.

### Narrative -- "Story Lab Workspace" (8 Dimensions)

Already mapped 1:1 to existing NarrativeReport sections and `narrativeAnalysisSchema` data:

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 1 | Logline & Premise Clarity | `scriptCoverage.marketability.loglineQuality`, `suggestedLogline` | Quality badge + suggested logline |
| 2 | Story Structure / Act Breakdown | `storyStructure.beats[]` | Beat-by-beat with effectiveness badges, structural strengths/weaknesses |
| 3 | Character Arcs & Development | `scriptCoverage.characters[]` | Per-character cards with role, arc assessment, strengths/weaknesses |
| 4 | Dialogue & Voice | `scriptCoverage.dialogueQuality` | Overall rating, strengths/weaknesses, notable lines |
| 5 | Theme & Emotional Resonance | `themes` | Central themes as tags, emotional resonance and audience impact text |
| 6 | Pacing & Tension | `storyStructure.pacingAssessment`, `tensionArc` | Pacing assessment + tension arc narrative |
| 7 | Genre Positioning & Comparables | `scriptCoverage.marketability` | Comp titles, commercial viability badge, conflict assessment |
| 8 | Development Recommendations | `developmentRecommendations`, `scriptCoverage.overallStrengths/Weaknesses` | Numbered priorities + overall strengths/weaknesses |

**No schema changes needed.** The current AI output already maps perfectly to 8 cards.

### Documentary -- "Interview Mining Workspace" (5 Dimensions)

Maps to existing `documentaryAnalysisSchema` and `AnalysisReport` sections:

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 1 | Source Overview | `summary` | Overview, interviewee count, dominant themes, total quotes |
| 2 | Key Quotes & Soundbites | `keyQuotes[]` | Quotes ranked by usefulness with category badges, speaker attribution |
| 3 | Recurring Themes | `recurringThemes[]` | Theme cards with frequency badges, supporting evidence quotes |
| 4 | Key Moments | `keyMoments[]` | Moment type badges, significance, approximate location |
| 5 | Editorial Direction | `editorialNotes` | Narrative threads, missing perspectives, suggested structure |

**No schema changes needed.**

### Corporate Interview -- "Messaging Workspace" (5 Dimensions)

Maps to existing `corporateAnalysisSchema` and `CorporateReport`:

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 1 | Executive Summary | `summary` | Overview, speaker count, context badge, dominant messages |
| 2 | Soundbite Quality | `soundbites[]` | Ranked soundbites with usability badges, category tags, speaker attribution |
| 3 | Messaging Consistency | `messagingThemes[]` | Theme cards with consistency ratings, supporting evidence |
| 4 | Speaker Effectiveness | `speakerEffectiveness[]` | Per-speaker scorecards: strengths, areas for improvement, quotability + on-message badges |
| 5 | Editorial Recommendations | `editorialNotes` | Recommended narrative, messaging gaps, suggested cuts |

**No schema changes needed.**

### TV/Episodic -- "Episode Lab Workspace" (2 Tabs, 8 Dimensions Total)

Maps to existing `tvEpisodicAnalysisSchema` and `TvReport` (already uses Tabs for Episode/Series split):

**Episode Arc Tab (4 cards):**

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 1 | Cold Open & Hook | `episodeAnalysis.coldOpen` | Hook strength badge, description, notes |
| 2 | Story Strands | `episodeAnalysis.storyStrands[]` | A/B/C story with effectiveness badges, character lists |
| 3 | Character Introductions | `episodeAnalysis.characterIntroductions[]` | Intro method + effectiveness per character |
| 4 | Episode Arc & Pacing | `episodeAnalysis.episodeArc` | Setup/escalation/resolution flow, pacing badge, cliffhanger |

**Series Structure Tab (4 cards):**

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 5 | Premise Longevity | `seriesAnalysis.premiseLongevity` | Multi-season/limited/one-season badge + reasoning |
| 6 | Serialized Hooks | `seriesAnalysis.serializedHooks[]` | Hook type + sustainability badges |
| 7 | Episodic vs Serial Balance | `seriesAnalysis.episodicVsSerial` | Balance badge + assessment |
| 8 | Season Arc Potential | `seriesAnalysis.seasonArcPotential` | Suggested arc, strengths/concerns split |

**No schema changes needed.** Tab structure already exists in TvReport.

### Short-Form/Branded -- "Content Pulse Workspace" (6 Dimensions)

Maps to existing `shortFormAnalysisSchema` and `ShortFormReport`:

| # | Dimension | Data Source | Card Focus |
|---|-----------|-------------|------------|
| 1 | Content Overview | `summary` | Overview, detected format badge, estimated duration, primary objective |
| 2 | Hook Strength | `hookStrength` | Hook rating badge, time to hook, suggestions |
| 3 | Pacing | `pacing` | Overall rating badge, dead spots, recommendations |
| 4 | Messaging Clarity | `messagingClarity` | Clarity badge, primary message, retention assessment, improvements |
| 5 | CTA Effectiveness | `ctaEffectiveness` | Has-CTA boolean, placement badge, urgency badge, suggestions |
| 6 | Emotional/Rational Balance | `emotionalRationalBalance` | Balance badge, emotional moments, rational elements |

**No schema changes needed.**

---

## Feature Dependencies

```
Theme System (next-themes + CSS variables)
    -- independent, no dependencies on other features --

Card Workspace Redesign
    requires --> Existing AI schemas (already built)
    requires --> Existing report components (refactor targets)
    requires --> Theme system (cards must work in both themes)

Storage Layer (IndexedDB)
    -- new infrastructure, no dependencies on existing features --

Auto-Save
    requires --> Storage Layer
    requires --> WorkspaceContext (already built, needs save trigger)

Library Page
    requires --> Storage Layer
    requires --> Auto-Save (Library is empty without saved analyses)

Library: Open Analysis
    requires --> Library Page
    requires --> WorkspaceContext hydration from stored data
    requires --> Card Workspace Redesign (what gets rendered when opened)

Library: Delete Analysis
    requires --> Library Page
    requires --> Storage Layer
```

### Dependency Notes

- **Theme system is independent.** It can be built first with zero impact on other features. Good warm-up task.
- **Card workspace redesign depends on theme system** because cards must look right in both light and dark. Build theme first, then redesign cards.
- **Storage layer is the linchpin for Library.** Without it, Library/auto-save/open/delete are all impossible. Build storage before any Library features.
- **Library page depends on storage + auto-save.** An empty Library is useless, so auto-save must work before the Library page matters.
- **Opening a saved analysis requires both the workspace redesign AND the storage hydration.** This is where the two feature tracks converge.

---

## MVP Definition

### Phase 1: Theme + Card Workspaces

Build first because they have no storage dependency and deliver visible UI improvement.

- [ ] **next-themes integration** -- light/dark/system with localStorage persistence
- [ ] **CSS variable-based brand color system** -- orange/amber accents that adapt to theme
- [ ] **Refactor sidebar, topnav, and layout** for theme-aware colors (currently hardcoded `stone-900`)
- [ ] **Narrative Story Lab Workspace** -- refactor NarrativeReport into workspace layout with 8 dimension cards, grid layout on wide screens
- [ ] **Workspace header component** -- project title, type badge, date, consistent across all types
- [ ] **Apply workspace pattern to remaining 4 types** -- Documentary, Corporate, TV/Episodic, Short-Form

### Phase 2: Storage + Library

Build second because it requires new infrastructure.

- [ ] **IndexedDB storage layer** -- save/load/delete/list operations for analyses
- [ ] **Auto-save on analysis completion** -- trigger save when streaming finishes
- [ ] **Library page** -- list view with project-type filter, search, card previews
- [ ] **Open saved analysis** -- hydrate workspace from stored data
- [ ] **Delete saved analysis** -- with confirmation dialog

### Add After Validation

- [ ] **Library sort options** (by date, by type, by title) -- add when Library has enough content to need sorting
- [ ] **Analysis rename** -- edit the title of a saved analysis from Library
- [ ] **Storage size indicator** -- show how much IndexedDB space is used, warn when approaching limits

### Future Consideration (v2+)

- [ ] **Analysis comparison view** -- side-by-side comparison of two analyses
- [ ] **Cloud backup/sync** -- only if multi-device need is validated
- [ ] **Custom card order** -- drag-and-drop reordering within a workspace
- [ ] **Analysis versioning** -- re-run analysis on same material, compare versions

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dark/light theme toggle | HIGH | LOW | P1 |
| Brand color system (amber/orange) | MEDIUM | LOW | P1 |
| Narrative Story Lab Workspace (8 cards) | HIGH | MEDIUM | P1 |
| Workspace header with metadata | MEDIUM | LOW | P1 |
| Doc/Corp/TV/Short workspaces (4 types) | HIGH | MEDIUM | P1 |
| Card grid layout (2-col on wide screens) | MEDIUM | LOW | P1 |
| IndexedDB storage layer | HIGH | MEDIUM | P1 |
| Auto-save after analysis | HIGH | LOW | P1 |
| Library page (browse) | HIGH | MEDIUM | P1 |
| Library: open saved analysis | HIGH | MEDIUM | P1 |
| Library: delete analysis | MEDIUM | LOW | P1 |
| Named workspace identities | MEDIUM | LOW | P2 |
| Library: project-type filter | MEDIUM | LOW | P2 |
| Library: search | LOW | LOW | P2 |
| Library card previews | MEDIUM | LOW | P2 |
| Visual scoring enhancements on cards | MEDIUM | MEDIUM | P2 |
| Library sort options | LOW | LOW | P3 |
| Analysis rename from Library | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1.1 launch
- P2: Should have, add within v1.1 if time permits
- P3: Nice to have, defer to v1.2+

---

## Competitor Feature Analysis

| Feature | StudioBinder | Descript | Final Draft | Our Approach |
|---------|-------------|----------|-------------|--------------|
| Card-based analysis | N/A (breakdown sheets, not analysis) | N/A (transcription, not analysis) | N/A (writing tool) | Evaluation dimension cards per project type -- unique in this space |
| Theme toggle | Light only | Dark/light | Dark only | Full dark/light with system preference |
| Saved analyses library | Project-based file management | Media library for transcripts | Script list (files, not analyses) | Analysis-centric Library with type filtering and previews |
| Project-type-aware UI | Partial (breakdown categories vary) | No (one-size-fits-all) | No (screenplay only) | Fully differentiated workspaces per type with unique dimension cards |
| Named workspace identity | No | No | No | "Story Lab", "Interview Mining", etc. -- professional identity per workflow |

No direct competitor does analysis workspace cards. The closest patterns are dashboard/scorecard UIs from business intelligence tools (Tableau, Looker) and educational rubric displays, adapted for creative analysis.

---

## Sources

- Existing codebase: `narrative-report.tsx`, `analysis-report.tsx`, `corporate-report.tsx`, `tv-report.tsx`, `short-form-report.tsx`, all 5 AI schemas, `workspace-context.tsx`, `app-sidebar.tsx`, `page.tsx`
- PROJECT.md v1.1 milestone requirements
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) -- standard Next.js theme library
- [shadcn/ui dark mode docs](https://ui.shadcn.com/docs/dark-mode/next) -- integration with Next.js and next-themes
- [Card UI Design Examples (BricxLabs)](https://bricxlabs.com/blogs/card-ui-design-examples) -- card layout patterns
- [Dashboard Design Trends 2025 (Fuselab)](https://fuselabcreative.com/top-dashboard-design-trends-2025/) -- workspace dashboard patterns
- [Dashboard Design Trends for SaaS (UITop)](https://uitop.design/blog/design/top-dashboard-design-trends/) -- card grid and scoring patterns
- [SaaS UI Workflow Patterns (GitHub Gist)](https://gist.github.com/mpaiva-cc/d4ef3a652872cb5a91aa529db98d62dd) -- document management UI patterns
- Training data knowledge of StudioBinder, Descript, Final Draft feature sets (MEDIUM confidence -- may have changed since cutoff)

---
*Feature research for: FilmIntern v1.1 UI Redesign*
*Researched: 2026-03-17*
