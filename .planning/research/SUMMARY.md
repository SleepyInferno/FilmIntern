# Project Research Summary

**Project:** FilmIntern v1.1 — UI and Formatting Milestone
**Domain:** Filmmaking AI analysis app — theme system, card-based workspaces, local persistence
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

FilmIntern v1.1 is a focused UI and persistence upgrade to an existing Next.js filmmaking analysis application. The app already has a complete v1.0 foundation: five project types with dedicated AI schemas, report components, a streaming analysis pipeline, and a Tiptap-based document workspace. What it lacks is a theme system (currently hardcoded dark-only), a coherent workspace identity per project type (cards exist but are generic sections, not evaluation dimensions), and any form of persistence (analyses disappear on page refresh). The v1.1 milestone closes all three gaps without touching the AI pipeline or adding any server-side infrastructure.

The recommended approach follows a strict dependency order driven by the codebase's current state: theme system first (zero risk, purely additive, visual foundation everything else depends on), card workspace redesign second (follows the pattern already proven by the existing `NarrativeReport` component), and IndexedDB persistence third (the most architecturally novel feature, correctly isolated as a dedicated `LibraryContext` rather than an extension of `WorkspaceContext`). The entire milestone is client-side. Three packages are added: `next-themes`, `dexie`, and `dexie-react-hooks`. No new API routes. No server changes. No AI schema changes.

The primary risk is the hardcoded-color surface area: 11 files use raw Tailwind color values (`bg-stone-900`, `text-stone-50`, `bg-white`, `hover:bg-gray-100`, `text-green-500`, `text-red-400`, etc.) that were chosen for dark mode only. These must be replaced with semantic tokens before the theme toggle ships — building cards before fixing colors means the debt compounds across 5 workspace components instead of being resolved once. The secondary risk is storage: using localStorage for analysis data would silently fail after roughly 20-30 full screenplay analyses due to the 5MB quota. Dexie/IndexedDB is the correct choice and must be used from day one; retrofitting is expensive and loses already-stored data.

## Key Findings

### Recommended Stack

The existing stack (Next.js, React 19, Tailwind CSS v4, shadcn + @base-ui/react, TypeScript, Zod) requires only three new packages for the entire v1.1 milestone. `next-themes` is the de facto standard for dark/light toggling in Next.js — it handles SSR hydration flash prevention via a blocking `<script>` tag injected into `<head>`, localStorage persistence of user preference, system preference detection, and `class`-based toggling that Tailwind v4 requires. No alternative is worth considering for Next.js theming.

For persistence, `dexie` (IndexedDB wrapper) with `dexie-react-hooks` is the correct choice over localStorage, idb-keyval, or a server database. Structured analysis JSON for a full screenplay can easily be 50-200KB per entry; localStorage's 5MB limit fails after 20-30 saves. Dexie provides queryable, typed, versioned IndexedDB storage with `useLiveQuery()` for reactive Library updates. Card layouts require zero new packages — the existing shadcn Cards, Tailwind grid, CVA, and lucide-react cover all visual needs.

**Core technologies:**
- `next-themes ^0.4.6`: Dark/light/system theme toggling — prevents FOUC, handles SSR, manages localStorage automatically; zero alternatives worth considering
- `dexie ^4.0.11`: IndexedDB wrapper for saved analyses — queryable, typed, versioned, no server required; handles analysis payloads that exceed localStorage's limit
- `dexie-react-hooks ^4.2.0`: `useLiveQuery()` hook — reactive Library list component auto-updates when IndexedDB changes, works across tabs
- Existing shadcn Cards + Tailwind CSS grid: Card workspace layouts — no new UI library needed; responsive 2-column grid via `grid-cols-1 md:grid-cols-2`
- CSS custom properties (`--brand`, `--brand-foreground`, `--brand-muted`): Orange/amber brand accent system in both `:root` and `.dark` scopes

**Do not add:** zustand/jotai (Dexie IS the storage layer, not state management middleware), framer-motion (tw-animate-css already handles card animations), react-grid-layout (card positions are fixed, not user-configurable), @radix-ui primitives (project uses @base-ui/react successor), any server database.

### Expected Features

See `.planning/research/FEATURES.md` for full feature tables and per-project-type evaluation dimension mappings.

**Must have (table stakes for v1.1):**
- Dark/light theme toggle with system preference detection and localStorage persistence — every modern creative tool supports this; current hardcoded dark is a v1 shortcut
- Orange/amber brand accent color system — currently used ad hoc (`amber-500` in NarrativeReport); must be systematic via CSS variables that adapt to both themes
- Card-based evaluation dimension workspaces for all 5 project types — the core v1.1 deliverable; named workspace identities give each type a distinct professional identity
- Auto-save analyses to IndexedDB after analysis completes — Library is useless without saved content; no explicit "Save" button required
- Library page: browse, open, and delete saved analyses — PROJECT.md requirement; `/dashboard` route (existing stub) becomes the Library

**Should have (differentiators, add within v1.1 if time permits):**
- Named workspace identities: "Story Lab Workspace", "Interview Mining Workspace", "Messaging Workspace", "Episode Lab", "Content Pulse"
- Card grid layout (2-column on wide screens) — makes evaluation dimensions scannable as a dashboard, not a linear scroll
- Library project-type filtering and search — high usability value, low implementation cost; client-side only
- Library card previews with title, date, type badge, and overview snippet
- Workspace header component showing project title, type badge, analysis date, and source filename

**Defer (v2+):**
- Analysis comparison view (side-by-side) — new layout paradigm, unclear UX for different project types
- Cloud backup/sync — requires backend, auth, and storage infrastructure
- Drag-and-drop card reordering — evaluation dimensions have a logical order; user-configurable order is premature
- Collaborative annotations — multi-user is explicitly out of scope; export PDF/DOCX to share
- Tagging/folder organization in Library — flat list with search/filter is sufficient until 50+ analyses exist

**No AI schema changes needed for any project type.** The existing Zod schemas already produce all data required for every evaluation dimension card across all 5 workspace types. This is a strong finding: v1.1 is entirely a UI and infrastructure milestone.

### Architecture Approach

The v1.1 architecture adds three parallel layers to the existing system without modifying the core analysis pipeline. A `ThemeProvider` layer (next-themes) wraps the existing `Providers` component. A card workspace rendering layer (`AnalysisWorkspace` dispatcher plus 5 per-type workspace components) creates a parallel on-screen rendering path alongside the existing Tiptap normalizer path. A `LibraryContext` layer (Dexie-backed CRUD) is an independent context separate from `WorkspaceContext`.

The key architectural insight: card workspaces render directly from typed analysis data (the pattern `NarrativeReport` already uses), while the Tiptap/normalizer path is retained for PDF/DOCX export and generated documents. Neither path is removed; they serve different purposes. The normalizer layer is NOT a refactor target for this milestone.

**Major components:**
1. `ThemeProvider` (next-themes) + `ThemeToggle` — manages dark/light/system state; persists choice; prevents hydration flash; wraps app via `providers.tsx`
2. `AnalysisWorkspace` dispatcher + workspace registry — maps project type string to correct workspace component; follows the existing `reportNormalizers` registry pattern already in the codebase
3. Per-type workspace components (5 total, 4 new) — render evaluation dimension cards directly from typed analysis schemas; extracted shared sub-components (`CategoryLabel`, `EffectivenessBadge`, `StrengthWeaknessGrid`, `SectionSkeleton`) avoid duplication
4. `LibraryContext` + `db.ts` (Dexie) — CRUD operations on `SavedAnalysis` records in IndexedDB; completely separate from `WorkspaceContext`; SSR-safe via `useEffect` initialization guard
5. `LibraryPage` at `/dashboard` — replaces existing route stub; grid of saved analyses with type filtering, search, open, and delete with confirmation
6. Modified `DocumentWorkspace` — report tab removed (report now in `AnalysisWorkspace`); generated docs tabs and export functionality unchanged

### Critical Pitfalls

1. **Theme flash of unstyled content (FOUC) on hydration** — Use `next-themes` with `suppressHydrationWarning` on `<html>`. The blocking `<script>` next-themes injects sets the theme class before browser paint, eliminating the flash. Never attempt a manual theme toggle in Next.js without this library.

2. **Hardcoded colors breaking in light mode** — 11 files (confirmed via codebase grep) use raw Tailwind color values chosen for dark mode only. All must be replaced with semantic tokens (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`) during Phase 1, before any card work begins. This is a prerequisite, not an afterthought.

3. **localStorage quota exceeded for large analysis data** — localStorage's 5MB limit is hit after approximately 20-30 full screenplay analyses (50-200KB each). Use Dexie/IndexedDB from day one. Reserve localStorage only for small preferences (theme choice). Data lost to quota overflow is unrecoverable.

4. **Breaking non-narrative project types during card redesign** — `NarrativeReport` already works; the other 4 types have different schemas and receive less testing attention. Test all 5 project types after every card component change. Keep old report components working until new workspace components are verified for every type.

5. **`WorkspaceContext` becoming a god object** — Currently 22 values (11 state fields + 11 setters). Theme gets `next-themes` own context. Library persistence gets a dedicated `LibraryContext`. `WorkspaceContext` gains at most 2-3 fields (`sourceFileName`, `loadFromSaved` action) and stays focused on the current analysis session.

6. **Persisting analysis data without schema versioning** — AI schemas will evolve. Every stored `SavedAnalysis` record must include `schemaVersion: number` from day one. Load with Zod `safeParse()` and migrate old records rather than crashing. Retrofitting versioning after data exists is medium-cost; having no recovery path when old analyses fail to render is high-cost.

## Implications for Roadmap

All research converges on a three-phase structure. The dependency graph is deterministic: theme has no dependencies and is safe to build first; card workspaces depend on theme for correct rendering in both modes; persistence depends on the workspace layer being in place so that "open saved analysis" renders correctly.

### Phase 1: Theme System and Color Audit

**Rationale:** Zero dependencies on other v1.1 features. Purely additive. Establishes the visual foundation (CSS variables, semantic token usage) that card workspaces and Library must be built on top of. Fixing the 11 hardcoded-color files once during Phase 1 costs far less than debugging color issues across 5 workspace components in Phase 2.

**Delivers:** Dark/light/system theme toggle; orange/amber brand accent CSS variable system (`--brand`, `--brand-foreground`, `--brand-muted` in both `:root` and `.dark`); all 11 hardcoded-color files updated to semantic tokens; `ThemeToggle` button in `AppTopNav`; smooth theme crossfade on `<body>`; `dark:prose-invert` on TiptapContentRenderer.

**Addresses:** Dark/light theme toggle (P1), theme persistence (P1), brand accent system (P1).

**Avoids:** FOUC (Pitfall 1) via next-themes blocking script; hardcoded colors breaking light mode (Pitfall 2) by auditing all 11 files; context god object for theme state (Pitfall 5) by using next-themes' own context.

**Research flags:** None needed. next-themes + shadcn + Tailwind v4 integration is official, documented, and widely used. Standard implementation.

### Phase 2: Card-Based Analysis Workspaces

**Rationale:** The pattern is proven by the existing `NarrativeReport`. All 5 AI schemas already produce all data needed for every evaluation dimension card — no schema work required. This phase is UI restructuring: extract shared sub-components, refactor `NarrativeReport` into a workspace, build the remaining 4 workspace components, wire up the `AnalysisWorkspace` dispatcher. Theme must be complete first so cards render correctly in both light and dark modes.

**Delivers:** `AnalysisWorkspace` dispatcher and workspace registry; `NarrativeWorkspace` (refactored from existing `NarrativeReport`, 8 dimension cards); `DocumentaryWorkspace`, `CorporateWorkspace`, `TvEpisodicWorkspace`, `ShortFormWorkspace` (4 new); shared workspace sub-components in `workspaces/shared.tsx`; workspace header component with project metadata; 2-column grid layout on wide screens; named workspace identities per project type.

**Uses:** Existing shadcn Cards + Tailwind CSS grid (no new packages). All 5 existing AI schemas. `EffectivenessBadge`, `CategoryLabel`, `StrengthWeaknessGrid` patterns extracted from `NarrativeReport`.

**Implements:** `AnalysisWorkspace` + workspace registry (parallel rendering path to Tiptap normalizers; normalizers retained for export).

**Avoids:** Breaking non-narrative types (Pitfall 4) by testing all 5 types after every change and keeping old components as fallbacks until verified; rendering cards via Tiptap normalizers (anti-pattern identified in ARCHITECTURE.md).

**Research flags:** None needed. Pattern is proven in existing codebase. Well-documented shadcn Card + CVA approach.

### Phase 3: Library Persistence

**Rationale:** The most architecturally novel feature. Requires Dexie/IndexedDB infrastructure, a new `LibraryContext`, modifications to `WorkspaceContext` for `loadFromSaved`, and a new Library page. Must be built last because opening a saved analysis must display in the card-based workspace format, which requires Phase 2 to be complete. Storage schema versioning must be baked in from the start of this phase.

**Delivers:** Dexie database setup (`db.ts`, `schema.ts` with `schemaVersion`); `LibraryContext` with save/load/delete/list operations; auto-save after analysis completion with "Saved" toast indicator; Library page at `/dashboard` with project-type filtering, search, and card previews; open saved analysis (hydrates `WorkspaceContext`, navigates to workspace); delete with confirmation dialog; SSR guard (`isReady` pattern) for IndexedDB access.

**Uses:** `dexie ^4.0.11`, `dexie-react-hooks ^4.2.0` (2 new packages). Zod `safeParse()` for load-time validation (already in stack at v4.3.6).

**Implements:** `LibraryContext` (separate from `WorkspaceContext`); `SavedAnalysis` schema with versioning; SSR-safe Dexie initialization pattern.

**Avoids:** localStorage quota (Pitfall 3) by using IndexedDB from day one; schema versioning gap (Pitfall 6) by building it in immediately; context god object (Pitfall 5) by keeping library state in its own context; Library list performance trap by storing a lightweight index (title, date, projectType, id) separately from full analysis payloads.

**Research flags:** Mild flag for Dexie SSR integration with Next.js App Router. The pattern is well-understood but the client/server boundary requires that all Dexie access be behind `useEffect` or within `'use client'` components. Recommend validating the `LibraryProvider` `isReady` guard pattern with a small implementation spike before building the full Library page. Also verify the complete list of `WorkspaceContext` fields that `loadFromSaved` must restore to avoid partial hydration bugs.

### Phase Ordering Rationale

- Theme must be first because all color values cascade downstream. Fixing semantic tokens once during Phase 1 (11 files) costs 3x less than debugging color issues after building across 5 workspace components in Phase 2.
- Card workspaces must be second because the `AnalysisWorkspace` rendering layer must exist before "open saved analysis" can work. Opening a saved analysis without a card workspace to render it into is a dead end.
- Library must be last because it is the only feature with new infrastructure dependency (Dexie) and its primary user-facing value — opening a saved analysis in its correct workspace — requires Phases 1 and 2 to be stable.
- The entire milestone is client-side. No deployment coordination, no migration risk beyond IndexedDB schema versioning, no backend changes.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Library Persistence):** Dexie SSR guard pattern in Next.js App Router — recommend an implementation spike before building the full Library page. Also enumerate the complete set of `WorkspaceContext` fields that `loadFromSaved` must restore before building the open-from-Library flow.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Theme System):** next-themes + shadcn + Tailwind v4 is official, documented, and widely used. Zero novel decisions.
- **Phase 2 (Card Workspaces):** Pattern is proven by `NarrativeReport`. Extending to 4 more types follows the same approach. No unknown territory.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified at specific versions (next-themes 0.4.6, dexie 4.0.11, dexie-react-hooks 4.2.0). Mature, widely used libraries with no known compatibility issues with Next.js 16 / React 19. |
| Features | HIGH | Grounded in direct codebase analysis and PROJECT.md requirements. Key finding — no AI schema changes needed — is verifiable against the 5 existing Zod schemas. Competitor feature analysis is lower confidence (training data may be stale) but does not affect v1.1 scope. |
| Architecture | HIGH | Two of three features follow patterns already in the codebase (NarrativeReport for card workspaces, reportNormalizers registry for dispatch). Library/Dexie architecture is well-established with one known integration complexity (SSR guard pattern). |
| Pitfalls | HIGH | Five of six pitfalls are grounded in direct codebase inspection with confirmed file names and line numbers. One (localStorage quota) is based on the Web Storage API specification. All recovery strategies are well-understood and mechanical. |

**Overall confidence:** HIGH

### Gaps to Address

- **IndexedDB availability in private browsing:** Some browsers restrict IndexedDB in private/incognito mode. The Library feature must degrade gracefully (show a "storage unavailable" notice) rather than crash. A try/catch wrapper around Dexie initialization is needed; the exact implementation pattern should be decided during Phase 3 planning.

- **`loadFromSaved` field completeness:** `WorkspaceContext` currently holds 11 state fields. The complete list of fields that must be restored when opening a saved analysis needs to be enumerated and verified during Phase 3. Missing a field (e.g., `generatedDocuments`, `reportDocument`) would silently leave the workspace in a partial state with no obvious error.

- **Library list index vs. full payload split:** Storing a lightweight index (title, date, type, id) separately from full analysis data is the correct approach for Library list performance at scale. The exact field split should be decided during Phase 3 planning, not deferred to implementation time.

- **`dark:prose-invert` on TiptapContentRenderer:** The contentEditable div in `document-workspace.tsx` uses the `prose` Tailwind typography class which has theme-unaware colors by default. Adding `dark:prose-invert` is a Phase 1 fix that must be included in the color audit checklist alongside the 11 hardcoded-color files.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `layout.tsx` (hardcoded `className="dark"`, line 24), `workspace-context.tsx` (11 state fields + 11 setters), `document-workspace.tsx` (hardcoded `bg-white` line 267, `hover:bg-gray-100` lines 269/275), `narrative-report.tsx` (hardcoded `text-green-500`, `text-red-400`, `bg-amber-500/20`), `app-sidebar.tsx` (hardcoded `text-stone-50`, `bg-white/5`, `text-stone-400`), all 5 AI schemas, `report-normalization.ts`
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — v0.4.6 API reference, SSR flash prevention approach
- [shadcn/ui dark mode docs](https://ui.shadcn.com/docs/dark-mode/next) — official Next.js + next-themes integration pattern
- [Dexie.js documentation](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) — v4.0.11 API, useLiveQuery hooks reference
- PROJECT.md v1.1 milestone requirements

### Secondary (MEDIUM confidence)
- [Dark Mode in Next.js 15 + Tailwind v4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) — Tailwind v4 `@custom-variant` configuration confirmation
- [Tailwind v4 + next-themes integration](https://medium.com/@kevstrosky/theme-colors-with-tailwind-css-v4-0-and-next-themes-dark-light-custom-mode-36dca1e20419) — CSS-first dark mode config walkthrough
- [Next.js + IndexedDB architecture reference](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9) — client-side persistence patterns in App Router
- [npm-compare: idb vs dexie vs localforage](https://npm-compare.com/dexie,idb,localforage) — library comparison for storage decision

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
