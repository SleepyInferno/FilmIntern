# Architecture Patterns

**Domain:** Filmmaking analysis app -- UI theming, card-based workspaces, local persistence
**Researched:** 2026-03-17
**Milestone:** v1.1 UI and Formatting

## Current Architecture Snapshot

The app is a Next.js 15 (app router) single-page workflow. Key structural facts:

- **Layout:** `layout.tsx` wraps everything in `<Providers>` (WorkspaceProvider + TooltipProvider). The `<html>` tag is hardcoded to `className="dark"`.
- **State:** All workspace state lives in `WorkspaceContext` (React context with `useState` calls). No persistence -- refreshing the page loses everything.
- **Navigation:** `AppTopNav` provides horizontal nav (Projects, Dashboard, Shot Lists, Image Prompts, Exports, Settings). Routes exist as stubs.
- **Analysis flow:** `page.tsx` (Home) owns the full workflow: select project type via `ProjectTypeTabs`, upload file, run analysis via `/api/analyze`, build report document, render in `DocumentWorkspace`.
- **Report rendering:** Two parallel rendering paths exist:
  1. `NarrativeReport` -- purpose-built card-based component with 8 evaluation dimension cards (already exists for narrative type only)
  2. `DocumentWorkspace` + `TiptapContentRenderer` -- generic Tiptap JSON renderer used for all project types' report documents and generated documents
- **Normalization registry:** `reportNormalizers` maps `AnalysisReportKind` to normalizer functions that convert typed analysis data into Tiptap JSON. Each project type has its own normalizer.
- **CSS:** Tailwind CSS v4 with CSS custom properties for light/dark themes already defined in `globals.css` (both `:root` and `.dark` blocks exist). The app just never toggles off `.dark`.

## Recommended Architecture for v1.1

### Overview

Three features, three layers:

```
Theme System         Card Workspaces              Library Persistence
     |                     |                             |
  globals.css        per-type workspace           IndexedDB via Dexie
  next-themes        components that consume       +
  ThemeProvider       existing analysis schemas    LibraryContext
     |                     |                             |
  layout.tsx -----> Providers.tsx <------------- providers.tsx
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ThemeProvider` (next-themes) | Manages dark/light toggle, persists choice, prevents flash | `layout.tsx`, `globals.css` |
| `ThemeToggle` | UI button for switching themes | `ThemeProvider` via `useTheme()` |
| `AnalysisWorkspace` (new) | Orchestrates which card workspace renders based on project type | `page.tsx`, per-type workspace components |
| `NarrativeWorkspace` | 8 evaluation dimension cards for narrative projects | `AnalysisWorkspace`, `NarrativeAnalysis` schema |
| `DocumentaryWorkspace` (new) | Interview-specific evaluation cards | `AnalysisWorkspace`, `DocumentaryAnalysis` schema |
| `CorporateWorkspace` (new) | Messaging-specific evaluation cards | `AnalysisWorkspace`, `CorporateAnalysis` schema |
| `TvEpisodicWorkspace` (new) | Episode/series evaluation cards | `AnalysisWorkspace`, `TvEpisodicAnalysis` schema |
| `ShortFormWorkspace` (new) | Pacing/messaging evaluation cards | `AnalysisWorkspace`, `ShortFormAnalysis` schema |
| `LibraryProvider` / `useLibrary` (new) | CRUD operations on saved analyses in IndexedDB | `providers.tsx`, Library page, `page.tsx` (auto-save) |
| `LibraryPage` (new) | Browse, open, delete saved analyses | `LibraryProvider`, router |
| `DocumentWorkspace` (existing, modified) | Still handles generated docs (outline, treatment, proposal) and export | `page.tsx`, export APIs |

### Data Flow

#### Current Flow (v1.0)
```
Upload -> /api/analyze -> streaming JSON -> setAnalysisData (in-memory)
                                              |
                                              v
                                      buildReportDocument -> DocumentWorkspace (Tiptap render)
```

#### New Flow (v1.1)
```
Upload -> /api/analyze -> streaming JSON -> setAnalysisData (in-memory)
                                              |
                                   +----------+----------+
                                   |                     |
                                   v                     v
                          AnalysisWorkspace         auto-save to
                          (card-based, per-type)    IndexedDB via
                               |                    LibraryProvider
                               v
                          DocumentWorkspace
                          (generated docs only,
                           export still here)
```

Key change: The analysis report is no longer rendered through the Tiptap normalizer path for on-screen display. Instead, `AnalysisWorkspace` dispatches to a per-type card component that renders directly from the typed analysis data (like `NarrativeReport` already does). The Tiptap/normalizer path remains for generated documents (outlines, treatments, proposals) and PDF/DOCX export.

## Feature 1: Theme System

### Architecture Decision

Use `next-themes` because:
- It handles SSR hydration mismatch (the hardest part of theme toggles in Next.js)
- It persists user preference to localStorage automatically
- It prevents flash-of-wrong-theme on page load
- It is the standard recommended by shadcn/ui docs for dark mode
- The app already has both `:root` and `.dark` CSS custom property blocks in `globals.css`

**Confidence:** HIGH -- next-themes is the de facto standard for Next.js theming, and the CSS variables are already in place.

### What Changes

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Remove hardcoded `className="dark"` from `<html>`. Add `suppressHydrationWarning` to `<html>`. |
| `src/app/providers.tsx` | Wrap children in `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>` from `next-themes`. |
| `src/app/globals.css` | Add orange/amber brand accent CSS variables to both `:root` and `.dark` blocks (e.g., `--brand`, `--brand-foreground`). The existing light/dark variable sets are already defined. |
| `src/components/theme-toggle.tsx` (new) | Button component using `useTheme()` from next-themes. Sun/Moon icon toggle. |
| `src/components/app-topnav.tsx` | Add `ThemeToggle` button next to the Settings icon. |
| Hardcoded colors | Audit `bg-stone-900`, `text-stone-50`, `bg-white`, `hover:bg-gray-100` etc. in `app-topnav.tsx`, `document-workspace.tsx` and replace with semantic tokens (`bg-background`, `text-foreground`, `bg-card`, etc.). |

### Brand Color System

Add to `globals.css`:
```css
:root {
  --brand: oklch(0.705 0.191 47.604);      /* amber-500 equivalent */
  --brand-foreground: oklch(0.145 0 0);
}
.dark {
  --brand: oklch(0.769 0.188 70.08);       /* amber-400 equivalent */
  --brand-foreground: oklch(0.145 0 0);
}
```

Then reference as `bg-brand`, `text-brand` via Tailwind theme inline config. The existing amber-500/amber-600 hardcoded references in `NarrativeReport`, `AppTopNav`, and `AppSidebar` should migrate to `text-brand` / `border-brand`.

### Tailwind v4 Note

Tailwind CSS v4 uses the `@custom-variant dark (&:is(.dark *))` approach already present in `globals.css`. The `darkMode: 'class'` config from v3 is not needed -- the custom variant declaration handles it. next-themes toggles the `dark` class on `<html>`, which matches this setup.

## Feature 2: Card-Based Analysis Workspaces

### Architecture Decision

Follow the pattern already established by `NarrativeReport` -- each project type gets a dedicated component that renders directly from the typed analysis schema using shadcn `Card`, `Badge`, and semantic layout. Do NOT use the Tiptap normalizer path for card rendering.

**Rationale:** `NarrativeReport` already demonstrates this exact pattern and it works well. The normalizers flatten rich structured data into linear Tiptap nodes, losing the ability to do per-dimension cards with badges, strength/weakness columns, etc. Card workspaces need the full typed data.

**Confidence:** HIGH -- proven pattern already in the codebase.

### New Components

| Component | File | Cards/Dimensions | Source Schema |
|-----------|------|-------------------|---------------|
| `AnalysisWorkspace` | `src/components/analysis-workspace.tsx` | Dispatcher -- renders correct workspace by project type | N/A |
| `NarrativeWorkspace` | `src/components/workspaces/narrative-workspace.tsx` | Rename/refactor from existing `NarrativeReport` (8 cards) | `NarrativeAnalysis` |
| `DocumentaryWorkspace` | `src/components/workspaces/documentary-workspace.tsx` | Summary, Key Quotes, Recurring Themes, Key Moments, Editorial Notes | `DocumentaryAnalysis` |
| `CorporateWorkspace` | `src/components/workspaces/corporate-workspace.tsx` | Summary, Soundbites, Messaging Themes, Speaker Effectiveness, Editorial Notes | `CorporateAnalysis` |
| `TvEpisodicWorkspace` | `src/components/workspaces/tv-episodic-workspace.tsx` | Cold Open, Story Strands, Episode Arc, Series Analysis, Serialized Hooks, Season Arc | `TvEpisodicAnalysis` |
| `ShortFormWorkspace` | `src/components/workspaces/short-form-workspace.tsx` | Summary, Hook Strength, Pacing, Messaging Clarity, CTA Effectiveness | `ShortFormAnalysis` |

### Workspace Registry Pattern

Create a registry similar to `reportNormalizers` but for workspace components:

```typescript
// src/components/workspaces/registry.ts
import type { ComponentType } from 'react';

export interface WorkspaceProps<T = unknown> {
  data: Partial<T> | null;
  isStreaming: boolean;
}

export const workspaceRegistry: Record<string, ComponentType<WorkspaceProps<any>>> = {
  'narrative': NarrativeWorkspace,
  'documentary': DocumentaryWorkspace,
  'corporate': CorporateWorkspace,
  'tv-episodic': TvEpisodicWorkspace,
  'short-form': ShortFormWorkspace,
};
```

### Shared Sub-Components

Extract reusable pieces from `NarrativeReport` into shared components:

| Component | Purpose | Currently In |
|-----------|---------|-------------|
| `CategoryLabel` | Numbered evaluation dimension header with brand-colored circle | `narrative-report.tsx` |
| `EffectivenessBadge` | Color-coded badge for effectiveness/quality ratings | `narrative-report.tsx` |
| `StrengthWeaknessGrid` | Two-column green/red bullet list layout | `narrative-report.tsx` (inline) |
| `SectionSkeleton` | Loading placeholder for streaming sections | `narrative-report.tsx` |
| `QuoteBadge` | Styled quote display with speaker attribution | New (for documentary/corporate) |

### Integration with page.tsx

`page.tsx` currently renders `DocumentWorkspace` for the report. The change:

**Before:** Analysis complete -> `buildReportDocument` -> `DocumentWorkspace` renders report + generated docs.

**After:** Analysis complete -> `AnalysisWorkspace` renders card-based report (primary display). `DocumentWorkspace` renders only generated docs (outline, treatment, proposal) when user requests them. `buildReportDocument` still runs for export purposes (PDF/DOCX still use Tiptap path).

The `AnalysisWorkspace` replaces the report tab inside `DocumentWorkspace`. The tabs for generated documents (Outline, Treatment, Proposal) stay in `DocumentWorkspace`.

### Impact on Existing Normalizers

The normalizers in `report-normalization.ts` are NOT removed. They are still needed for:
- PDF/DOCX export (which renders from Tiptap JSON via `render-document-html.ts`)
- Generated documents (outlines, treatments, proposals)

The card workspaces are a parallel rendering path for on-screen display only.

## Feature 3: Library Persistence

### Architecture Decision

Use **Dexie.js** (IndexedDB wrapper) because:
- This is a personal single-user tool -- no server database needed
- IndexedDB handles large analysis objects (JSON blobs) that would exceed localStorage's 5MB limit
- Dexie provides a clean Promise-based API with TypeScript support and schema versioning
- No backend changes required -- persistence is entirely client-side
- Analyses include source text and analysis snapshots which can be large (50KB+ each)

**Confidence:** MEDIUM -- Dexie is well-established but this is the most architecturally novel feature. The key risk is that IndexedDB is browser-only, so all database access must be guarded against SSR execution.

### Data Model

```typescript
// src/lib/storage/schema.ts
import type { AnalysisReportKind } from '@/lib/documents/report-normalization';

export interface SavedAnalysis {
  id: string;                              // crypto.randomUUID()
  projectType: string;                     // 'narrative' | 'documentary' | etc.
  title: string;                           // User-editable, defaults to filename
  createdAt: string;                       // ISO timestamp
  updatedAt: string;                       // ISO timestamp
  sourceFileName: string;                  // Original upload filename
  sourceText: string;                      // Full source text
  analysisData: Record<string, unknown>;   // Full analysis JSON
  reportKind: AnalysisReportKind;          // For export reconstruction
}
```

### Storage Layer

```typescript
// src/lib/storage/db.ts
import Dexie from 'dexie';
import type { SavedAnalysis } from './schema';

class FilmInternDB extends Dexie {
  analyses!: Dexie.Table<SavedAnalysis, string>;

  constructor() {
    super('filmintern');
    this.version(1).stores({
      analyses: 'id, projectType, createdAt, updatedAt, title',
    });
  }
}

export const db = new FilmInternDB();
```

### Library Context

```typescript
// src/contexts/library-context.tsx
interface LibraryState {
  analyses: SavedAnalysis[];
  isLoading: boolean;
}

interface LibraryActions {
  saveAnalysis: (data: Omit<SavedAnalysis, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteAnalysis: (id: string) => Promise<void>;
  loadAnalysis: (id: string) => Promise<SavedAnalysis | undefined>;
  refreshList: () => Promise<void>;
}
```

### Auto-Save Flow

In `page.tsx`, after analysis completes and `finalData` is set:

```
Analysis completes -> buildReportDocument (existing)
                   -> saveAnalysis via LibraryContext (new, automatic)
```

The save happens automatically after analysis completion. No explicit "Save" button needed for v1.1.

### Library Page

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `LibraryPage` | Grid/list of saved analyses, sorted by date |

The existing `/dashboard` route stub becomes the Library page. Each item shows: title, project type badge, date, preview snippet. Click opens the analysis in the workspace. Delete button with confirmation.

### Opening a Saved Analysis

When a user clicks an item in the Library, the flow is:
1. Load `SavedAnalysis` from IndexedDB
2. Populate `WorkspaceContext` with the loaded data (projectType, analysisData, sourceText, etc.)
3. Navigate to `/` (the main workspace page)
4. The workspace renders the card-based analysis from the loaded data

This requires adding a `loadFromSaved` action to `WorkspaceContext` that hydrates all the relevant state fields at once.

### SSR Guard

Because IndexedDB is browser-only, the `LibraryProvider` must lazy-initialize:

```typescript
// In LibraryProvider
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  setIsReady(true);
  refreshList();
}, []);
```

All Dexie calls are naturally async and only execute client-side. The provider just needs to avoid calling `db` during SSR rendering.

## Modified Existing Components

| Component | Modification | Risk |
|-----------|-------------|------|
| `layout.tsx` | Remove `className="dark"`, add `suppressHydrationWarning` | Low -- minimal change |
| `providers.tsx` | Add `ThemeProvider`, add `LibraryProvider` | Low -- additive wrapping |
| `app-topnav.tsx` | Add `ThemeToggle`, replace hardcoded dark colors with semantic tokens | Low -- visual only |
| `page.tsx` | Add `AnalysisWorkspace` above `DocumentWorkspace`, add auto-save after analysis, track `sourceFileName` | Medium -- core page logic changes |
| `document-workspace.tsx` | Remove report tab rendering (report now in `AnalysisWorkspace`), keep generated docs + export. Replace hardcoded `bg-white`/`hover:bg-gray-100` with semantic tokens. | Medium -- structural change to tabs |
| `narrative-report.tsx` | Rename to `narrative-workspace.tsx`, move to `workspaces/` directory, extract shared sub-components | Low -- refactor only, no behavior change |
| `globals.css` | Add `--brand` / `--brand-foreground` CSS variables | Low -- additive |
| `workspace-context.tsx` | Add `sourceFileName` field, add `loadFromSaved` action for Library | Medium -- context shape change |

## New Files Summary

| File | Purpose |
|------|---------|
| `src/components/theme-toggle.tsx` | Dark/light mode toggle button |
| `src/components/analysis-workspace.tsx` | Project-type dispatcher for card workspaces |
| `src/components/workspaces/narrative-workspace.tsx` | Narrative 8-card workspace (from existing NarrativeReport) |
| `src/components/workspaces/documentary-workspace.tsx` | Documentary card workspace |
| `src/components/workspaces/corporate-workspace.tsx` | Corporate card workspace |
| `src/components/workspaces/tv-episodic-workspace.tsx` | TV/Episodic card workspace |
| `src/components/workspaces/short-form-workspace.tsx` | Short-form card workspace |
| `src/components/workspaces/registry.ts` | Workspace component registry |
| `src/components/workspaces/shared.tsx` | Shared sub-components (CategoryLabel, EffectivenessBadge, etc.) |
| `src/lib/storage/db.ts` | Dexie database definition |
| `src/lib/storage/schema.ts` | SavedAnalysis type definition |
| `src/contexts/library-context.tsx` | Library CRUD context |
| `src/app/dashboard/page.tsx` | Library page (replace existing stub) |

## Patterns to Follow

### Pattern 1: Registry-Based Dispatch
**What:** Map project type strings to components/functions instead of switch statements.
**When:** Anywhere behavior varies by project type.
**Why:** Already established with `reportNormalizers`. Keeps `page.tsx` clean and makes adding new project types a single-file addition.

### Pattern 2: Typed Analysis Props with Streaming Support
**What:** Each workspace component accepts `Partial<T> | null` where T is the specific analysis schema type (e.g., `NarrativeAnalysis`).
**When:** All card workspace components.
**Why:** Enables streaming (partial data renders as cards fill in with skeleton fallbacks) and type safety. Already proven in `NarrativeReport`.

### Pattern 3: CSS Custom Properties for Theme
**What:** All colors referenced through CSS variables, toggled via class on `<html>`.
**When:** All styling decisions.
**Why:** The infrastructure is already in `globals.css`. Adding next-themes just automates the class toggle. Brand accent color should be a variable, not hardcoded `amber-500`.

### Pattern 4: Shared Sub-Component Extraction
**What:** Extract common card patterns (numbered headers, effectiveness badges, strength/weakness grids) into shared components.
**When:** Building the 4 new workspace components.
**Why:** `NarrativeReport` already has these patterns. Duplicating across 5 workspaces would create maintenance burden.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rendering Cards via Tiptap Normalizers
**What:** Trying to make the normalizer output render as cards.
**Why bad:** Normalizers flatten structured data into linear document nodes. Cards need the original typed structure for layouts like two-column strength/weakness grids, badges, etc.
**Instead:** Use normalizers for export only. Card workspaces render from typed analysis data directly.

### Anti-Pattern 2: Server-Side Database for Library
**What:** Adding SQLite/Postgres for a single-user personal tool.
**Why bad:** Massive complexity increase for no benefit. No multi-device sync is needed.
**Instead:** IndexedDB via Dexie. Zero server changes. Data lives in the browser.

### Anti-Pattern 3: Lifting All State to URL/Search Params
**What:** Trying to make every workspace state URL-addressable.
**Why bad:** Analysis data is large (can be 50KB+ JSON). URL state is for navigation, not data storage.
**Instead:** React context for active session, IndexedDB for persistence. URL only for Library item IDs (e.g., `/dashboard?open=abc` to deep-link a saved analysis).

### Anti-Pattern 4: Removing the Normalizer Layer
**What:** Deleting `report-normalization.ts` because card workspaces replace on-screen rendering.
**Why bad:** The normalizer layer is still needed for PDF/DOCX export via `render-document-html.ts` and for generated documents.
**Instead:** Keep both paths. Cards for screen, Tiptap for export.

## Suggested Build Order

Build order is driven by dependencies:

### Phase 1: Theme System (no dependencies on other features)
1. Install `next-themes`
2. Create `ThemeProvider` wrapper in `providers.tsx`
3. Update `layout.tsx` (remove hardcoded dark, add `suppressHydrationWarning`)
4. Create `ThemeToggle` component
5. Add to `AppTopNav`
6. Add brand CSS variables to `globals.css`
7. Audit and replace hardcoded colors in existing components

**Why first:** Zero risk to existing functionality. Purely additive. Establishes the visual foundation that card workspaces will use.

### Phase 2: Card Workspaces (depends on theme for consistent styling)
1. Extract shared sub-components from `NarrativeReport` into `workspaces/shared.tsx`
2. Move `NarrativeReport` to `workspaces/narrative-workspace.tsx` (refactor, keep behavior)
3. Create `AnalysisWorkspace` dispatcher and workspace registry
4. Build remaining 4 workspace components (documentary, corporate, tv-episodic, short-form)
5. Integrate `AnalysisWorkspace` into `page.tsx`
6. Adjust `DocumentWorkspace` to only handle generated docs (remove report tab)

**Why second:** The schemas and normalizers already exist as a reference for what each workspace must display. The pattern is proven by `NarrativeReport`. This is mostly feature work, not infrastructure.

### Phase 3: Library Persistence (depends on workspaces for "open saved analysis" flow)
1. Install `dexie`
2. Create `db.ts` and `schema.ts`
3. Create `LibraryContext` with CRUD operations
4. Add `LibraryProvider` to `providers.tsx`
5. Add `sourceFileName` tracking to `WorkspaceContext`
6. Add auto-save after analysis completion in `page.tsx`
7. Build Library page at `/dashboard`
8. Add `loadFromSaved` to `WorkspaceContext` for opening saved analyses
9. Wire up "open from Library" navigation flow

**Why third:** Persistence is the most self-contained feature but needs the workspace rendering to be in place so that opening a saved analysis displays correctly in the card-based format.

## Scalability Considerations

| Concern | At 10 analyses | At 100 analyses | At 1000 analyses |
|---------|----------------|-----------------|------------------|
| IndexedDB storage | Trivial (~5MB) | Fine (~50MB) | May need cleanup UI (~500MB) |
| Library page rendering | Simple list | Paginate or virtual scroll | Virtual scroll + search |
| Memory (open analysis) | Fine | Fine (only 1 loaded at a time) | Fine |

For a personal tool, 100 analyses is the likely ceiling. No virtual scrolling needed in v1.1. Simple date-sorted list is sufficient.

## Sources

- [next-themes GitHub](https://github.com/pacocoursey/next-themes) -- HIGH confidence, de facto standard for Next.js dark mode
- [shadcn/ui dark mode docs](https://ui.shadcn.com/docs/dark-mode/next) -- HIGH confidence, official docs recommending next-themes
- [Dark mode in Next.js 15 + Tailwind v4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) -- MEDIUM confidence, community guide confirming approach
- [Dexie.js](https://dexie.org/) -- HIGH confidence, mature IndexedDB wrapper with TypeScript support
- [Next.js + IndexedDB pattern](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9) -- MEDIUM confidence, reference architecture for client-side persistence
