# Pitfalls Research

**Domain:** Adding theme toggle, card-based UI redesign, and local persistence to existing Next.js filmmaking analysis app
**Researched:** 2026-03-17
**Confidence:** HIGH (based on direct codebase analysis + well-documented Next.js patterns)

## Critical Pitfalls

### Pitfall 1: Theme Flash of Unstyled Content (FOUC) on Hydration

**What goes wrong:**
The app loads with the server-rendered theme (currently hardcoded `className="dark"` on `<html>` in layout.tsx), then React hydrates and applies the user's stored preference. This causes a visible flash where the entire page switches themes after load. For dark-to-light transitions this is especially jarring -- a bright white flash.

**Why it happens:**
Next.js server-renders HTML before the client JavaScript runs. If the theme preference is stored in localStorage (client-only), the server has no access to it and renders with the default. The mismatch between server HTML and client state causes the flash.

**How to avoid:**
Use `next-themes` which injects a blocking `<script>` tag into `<head>` that reads localStorage and sets the `class` attribute on `<html>` BEFORE the browser paints. This eliminates the flash entirely. The current layout already has `className="dark"` on `<html>` (line 24 of layout.tsx) -- this needs to become dynamic via `suppressHydrationWarning` on the `<html>` element.

Concrete steps:
1. Install `next-themes`
2. Wrap app in `ThemeProvider` inside `providers.tsx` (already has a Providers component)
3. Add `suppressHydrationWarning` to `<html>` tag
4. Remove hardcoded `className="dark"` from `<html>`
5. Use `useTheme()` hook in toggle component

**Warning signs:**
- Visible color flash on page load or navigation
- Hydration mismatch warnings in console
- `className` on `<html>` is hardcoded rather than dynamic

**Phase to address:**
Phase 1 (Theme System) -- must be the first thing built because all subsequent UI work depends on the color system being correct.

---

### Pitfall 2: Hardcoded Colors That Break in Opposite Theme

**What goes wrong:**
The codebase currently has many hardcoded color classes that only work in dark mode: `bg-white` in document-workspace.tsx (line 267), `hover:bg-gray-100` (lines 269, 275), `text-stone-50`, `bg-white/5`, `text-stone-400`, `hover:bg-white/10` across app-sidebar.tsx. These will look wrong or be invisible in light mode. Similarly, `text-green-500`, `text-red-400`, and `bg-amber-500/20` across 11+ component files use raw Tailwind colors instead of semantic tokens.

**Why it happens:**
The app was built dark-mode-only (hardcoded `className="dark"`), so colors were chosen to look correct in dark mode without considering the inverse. This is the natural result of building single-theme first and adding a theme toggle later.

**How to avoid:**
Before building any new card components, audit and replace all hardcoded colors with semantic Tailwind classes:
- `bg-white` becomes `bg-popover` or `bg-card`
- `hover:bg-gray-100` becomes `hover:bg-muted`
- `text-stone-400` becomes `text-muted-foreground`
- Status colors (`text-green-500`, `text-red-400`) need CSS custom properties that adapt per theme, or use `dark:` variants

The shadcn/ui components already use semantic tokens (the app uses shadcn -- `Card`, `Badge`, `Button` etc.). The problem is the custom rendering code that bypasses shadcn primitives.

Files confirmed to have hardcoded colors: narrative-report.tsx, document-workspace.tsx, app-sidebar.tsx, app-topnav.tsx, short-form-report.tsx, tv-report.tsx, corporate-report.tsx, moments-section.tsx, themes-section.tsx, quotes-section.tsx, settings/page.tsx (11 files total).

**Warning signs:**
- Any Tailwind class using a specific color number (e.g., `gray-100`, `stone-400`, `green-500`) instead of semantic names (`muted`, `foreground`, `destructive`)
- Export dropdown (document-workspace.tsx lines 267-281) uses `bg-white` and `hover:bg-gray-100` -- will be invisible or wrong in light mode
- Components that render correctly in one theme but have invisible text, wrong backgrounds, or unreadable contrast in the other

**Phase to address:**
Phase 1 (Theme System) -- color audit must happen during theme setup, not deferred to card redesign.

---

### Pitfall 3: localStorage Quota Exceeded for Large Analysis Data

**What goes wrong:**
Analysis results for a full screenplay can be substantial -- the `analysisData` field in WorkspaceContext is `Record<string, unknown>` and for a narrative analysis includes story structure beats, character assessments, dialogue analysis, theme extraction, and script coverage. A single analysis could easily be 50-200KB of JSON. localStorage has a ~5MB limit per origin. Saving 20-30 analyses could approach or exceed this limit, causing silent data loss when `setItem` throws.

**Why it happens:**
localStorage seems like the obvious choice for a personal single-user tool with no backend database. The limit feels generous until you store structured AI analysis output, which is verbose JSON. Most developers never test with realistic data volumes.

**How to avoid:**
Use IndexedDB instead of localStorage for analysis data storage. IndexedDB has effectively no practical storage limit for this use case (typically hundreds of MB). Use a thin wrapper like `idb-keyval` (3KB) to keep the API simple -- it provides `get`/`set`/`del` that work like localStorage but with async and IndexedDB backing.

Reserve localStorage only for small preferences (theme choice, last project type selected). Never store analysis payloads in localStorage.

**Warning signs:**
- `try/catch` around `localStorage.setItem` that silently swallows errors
- No storage usage monitoring or user feedback when storage is full
- Analysis data disappearing after many saves with no error shown

**Phase to address:**
Phase 3 (Library/Persistence) -- this is the core storage decision and must be right from the start of persistence work.

---

### Pitfall 4: Breaking Existing Report Display During Card Redesign

**What goes wrong:**
The app has 6+ report components (`narrative-report.tsx`, `short-form-report.tsx`, `tv-report.tsx`, `corporate-report.tsx`, plus section components in `report-sections/`) that render analysis data. A "card-based redesign" risks breaking the data-to-UI mapping for project types that aren't the primary focus of testing. The narrative report already IS card-based (it renders 8 `Card` components with `CategoryLabel` headings), so the redesign is really about extracting reusable patterns and applying workspace layout consistency, not inventing a new card pattern.

**Why it happens:**
Each project type has unique analysis schemas (narrative has `scriptCoverage.characters`, documentary has different fields). Redesigning the card layout for one project type and assuming the pattern applies to all 5 types leads to runtime errors or missing data display for the less-tested types.

**How to avoid:**
1. Recognize that `narrative-report.tsx` is already the target pattern (numbered CategoryLabel cards with EffectivenessBadge ratings). The work is extracting reusable card primitives from it, not redesigning from scratch.
2. Build a shared `EvaluationCard` component that all 5 project types use, but keep the per-type data mapping in separate files.
3. Test all 5 project types after each card component change, not just the narrative type.
4. Keep the old report components working until the new ones are verified -- don't delete and rebuild simultaneously.

**Warning signs:**
- Changes to card components tested only with narrative project type
- Removing old report components before new ones render all data fields
- `undefined` errors in less-tested project types (corporate, short-form)

**Phase to address:**
Phase 2 (Card Redesign) -- needs explicit test coverage for all 5 project types, not just narrative.

---

### Pitfall 5: WorkspaceContext Becomes an Unmaintainable God Object

**What goes wrong:**
The current `WorkspaceContext` already has 11 state fields and 11 setters (22 values in a single context). Adding persistence (saved analyses list, active library item, save/load status), theme state, and UI state for card-based workspace will balloon this to 30+ fields. Every state change re-renders every consumer. The context becomes impossible to reason about.

**Why it happens:**
The initial WorkspaceContext was fine for v1.0's simple flow. Adding features incrementally to the same context is the path of least resistance. Each new feature "just needs one more field" until the context is unmanageable.

**How to avoid:**
Split into focused contexts before adding new features:
- `ThemeContext` (or use `next-themes` which provides its own) -- theme preference only
- `WorkspaceContext` -- current analysis session state (upload, analysis, documents) -- keep as-is
- `LibraryContext` -- saved analyses list, CRUD operations, active/loaded state

Each context should have a clear boundary. The `Providers` component in `providers.tsx` already provides a clean composition point for nesting multiple providers.

**Warning signs:**
- Adding more than 2-3 new fields to WorkspaceContext
- Components re-rendering when unrelated state changes (e.g., theme toggle causes analysis card to re-render)
- Context value object growing past 15 fields

**Phase to address:**
Phase 1 (Theme) and Phase 3 (Library) -- theme gets its own provider from the start; library persistence gets its own context rather than extending WorkspaceContext.

---

### Pitfall 6: Persisting Stale or Incompatible Analysis Schema Versions

**What goes wrong:**
Analysis data is saved to IndexedDB with the current schema shape. A future update changes the AI analysis schema (adds fields, renames properties, restructures). Old saved analyses fail to render because the UI expects fields that don't exist in the stored data. The Library page crashes or shows blank cards when opening old analyses.

**Why it happens:**
Schema evolution is invisible -- the analysis schemas in `src/lib/ai/schemas/` define what the AI returns, and the report components expect that shape. Storing raw analysis output without versioning means there is no migration path.

**How to avoid:**
1. Add a `schemaVersion: number` field to every persisted analysis record
2. Write a simple migration function that upgrades old records when loaded: `if (record.schemaVersion < CURRENT_VERSION) { record = migrate(record); }`
3. Use Zod's `.safeParse()` (already in dependencies as zod v4) to validate loaded data before rendering -- gracefully degrade rather than crash
4. Never delete fields from analysis schemas in updates -- only add new optional fields or use explicit versioned migrations

**Warning signs:**
- Saved analyses with no version identifier
- Report components that crash on `undefined` when opening old saves
- No validation step between loading from storage and rendering

**Phase to address:**
Phase 3 (Library/Persistence) -- versioning must be part of the storage schema from day one, not retrofitted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store analysis in localStorage instead of IndexedDB | Simpler synchronous API | 5MB limit hit with ~25-50 analyses, silent data loss | Never for analysis data; OK for tiny preferences like theme |
| Add all new state to existing WorkspaceContext | No refactoring needed | Context becomes unmaintainable, every consumer re-renders on every change | Never -- split contexts at feature boundaries |
| Use raw Tailwind color values for status badges | Faster to code, visually correct in dark mode | Every theme addition requires auditing status colors across 11+ files | Only acceptable if you also add `dark:` variant for each |
| Use `window.matchMedia` instead of `next-themes` | No dependency added | FOUC on every page load, no SSR support, manual system-preference sync | Never in Next.js |
| Skip schema versioning on stored analyses | Ships persistence faster | First schema change breaks all saved data with no migration path | Never |
| Copy-paste card layout per project type instead of shared components | Each type is independent, faster initial build | 5 nearly-identical card components to maintain; bug fixes applied inconsistently | Only for the first prototype of one project type; extract shared components immediately after |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| next-themes + shadcn/ui | Forgetting `attribute="class"` in ThemeProvider config, so shadcn components don't respond to theme changes | Set `attribute="class"` and `defaultTheme="dark"` to match current behavior; shadcn uses CSS variables scoped to `.dark` class |
| IndexedDB + React state | Reading IndexedDB on every render (it is async), causing loading flickers or stale state | Load from IndexedDB once into React state on mount; write-through on changes. Use a custom hook like `usePersistedState` |
| Tailwind dark mode + CSS variables | Defining CSS variables only in `.dark` block and forgetting `:root` (light) values in globals.css | shadcn's globals.css already defines both `:root` and `.dark` blocks -- ensure both have complete variable sets, especially for custom brand colors (orange/amber) |
| ContentEditable + theme switching | The contentEditable div in document-workspace.tsx (line 333) uses `prose` class which has theme-unaware colors | Use `dark:prose-invert` so Tailwind prose plugin adapts to theme automatically |
| next-themes + Next.js App Router | Using `useTheme()` in a Server Component, which fails because it requires client context | Only use `useTheme()` in components marked `'use client'`; the ThemeProvider must wrap children in a Client Component (already the pattern in providers.tsx) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering all cards on any context change | Visible lag when toggling theme, switching tabs, or typing | Split contexts; use `React.memo` on card components | Noticeable with 8+ evaluation cards rendered simultaneously |
| Loading full analysis JSON to render Library list | Library page is slow to load, memory usage spikes | Store a lightweight index (title, date, project type, id) separately from full analysis data; load full data only when user opens a specific analysis | With 50+ saved analyses |
| Serializing large objects on every state change for persistence | UI jank when interacting with analysis workspace | Debounce persistence writes; only persist on explicit save or navigation away | With analysis data over 100KB |
| Prose typography recalculation on theme switch | Layout shift visible when toggling theme with report displayed | Apply prose classes at container level, not per-card; set both `prose` and `dark:prose-invert` once on wrapper | Visible with 8+ cards each with their own prose wrapper |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Theme toggle without smooth transition | Jarring instant color swap feels broken | Add `transition-colors duration-200` to `<body>` for a brief crossfade between themes |
| Library shows raw JSON dates or IDs | Analyses list feels technical, not professional | Show formatted date, project type icon/label, and title prominently |
| No confirmation before deleting saved analysis | User loses hours of AI analysis with one click | Require confirmation dialog for destructive actions |
| Card layout requiring scroll to see any evaluation summary | User cannot scan analysis overview at a glance | Show compact summary or score row at top, with expandable detail cards below |
| Theme toggle buried in settings page | User cannot quickly switch themes | Place toggle in app-topnav.tsx (already exists) -- visible on every page |
| Auto-save with no visible indication | User unsure if analysis was persisted | Show brief "Saved" indicator or toast after auto-save completes |
| Inconsistent card heights across evaluation dimensions | Layout looks messy, cards jump during streaming | Set minimum card heights; use consistent content structure across all evaluation cards |

## "Looks Done But Isn't" Checklist

- [ ] **Theme toggle:** Works on initial load with cleared localStorage + hard refresh -- verify no FOUC
- [ ] **Theme toggle:** Respects system preference as default when no user preference is stored
- [ ] **Theme colors:** Export dropdown in document-workspace.tsx uses semantic colors (currently hardcoded `bg-white`, `hover:bg-gray-100`)
- [ ] **Theme colors:** Status badges (green/red/amber EffectivenessBadge) are readable in BOTH themes -- test all effectiveness values across narrative-report.tsx
- [ ] **Theme colors:** `prose` content areas (TiptapContentRenderer) are readable in both themes
- [ ] **Theme colors:** Sidebar (app-sidebar.tsx) hardcoded `text-stone-50`, `bg-white/5`, `text-stone-400` replaced with semantic tokens
- [ ] **Card redesign:** All 5 project types render without errors (not just narrative)
- [ ] **Card redesign:** Streaming/skeleton states still work during analysis (currently page.tsx lines 272-295)
- [ ] **Card redesign:** CategoryLabel numbering and EffectivenessBadge pattern works for non-narrative project types that may have different evaluation dimensions
- [ ] **Persistence:** Saving and loading works with analysis data over 100KB (test with a full screenplay analysis)
- [ ] **Persistence:** Old saved analyses still load after schema changes (version migration tested)
- [ ] **Persistence:** Library handles IndexedDB unavailability gracefully (private browsing in some browsers restricts it)
- [ ] **Persistence:** Deleting an analysis that is currently displayed does not crash the workspace
- [ ] **Persistence:** Loading a saved analysis correctly populates WorkspaceContext (projectType, analysisData, reportDocument, generatedDocuments all restored)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Theme FOUC shipped | LOW | Install next-themes, add suppressHydrationWarning, update Providers -- 1-2 hour fix |
| Hardcoded colors found after redesign | MEDIUM | Grep for raw color classes across 11 files, replace with semantic tokens -- tedious but mechanical, 2-4 hours |
| localStorage quota exceeded, data lost | HIGH | Data is gone and unrecoverable. Migrate to IndexedDB going forward, but lost analyses cannot be restored |
| WorkspaceContext became god object | MEDIUM | Extract into separate contexts, update imports across all consumers -- mechanical refactoring, 3-4 hours |
| Schema version missing, old analyses crash | MEDIUM | Add version field retroactively, write migration handling "no version" as v1, add safeParse validation |
| Card redesign broke non-narrative types | LOW-MEDIUM | Revert to old components for broken types, fix one type at a time. Lower cost if old components kept as fallbacks |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Theme FOUC (Pitfall 1) | Phase 1: Theme System | Hard refresh with cleared localStorage shows no flash; `suppressHydrationWarning` present on `<html>` |
| Hardcoded colors (Pitfall 2) | Phase 1: Theme System | Toggle light/dark on every page; no invisible text, wrong backgrounds, or unreadable badges in either theme |
| localStorage quota (Pitfall 3) | Phase 3: Library/Persistence | IndexedDB used from the start; test saving 50+ analyses without errors |
| Breaking report components (Pitfall 4) | Phase 2: Card Redesign | All 5 project types tested after each card component change; old components kept until verified |
| Context god object (Pitfall 5) | Phase 1 + Phase 3 | WorkspaceContext stays at ~15 fields max; theme and library have separate contexts |
| Schema versioning (Pitfall 6) | Phase 3: Library/Persistence | Every stored record has `schemaVersion`; loading a v1 record into a v2+ app works without crashes |

## Sources

- Direct codebase analysis of: layout.tsx (hardcoded `className="dark"`, line 24), workspace-context.tsx (11 state fields + 11 setters), document-workspace.tsx (hardcoded `bg-white` line 267, `hover:bg-gray-100` lines 269/275), narrative-report.tsx (hardcoded `text-green-500`, `text-red-400`, `bg-amber-500/20`), app-sidebar.tsx (hardcoded `text-stone-50`, `bg-white/5`, `text-stone-400`)
- 11 files confirmed with hardcoded color classes via codebase grep
- next-themes: well-established community standard for Next.js theme management; blocking script approach prevents FOUC (HIGH confidence)
- localStorage 5MB limit: Web Storage API specification (HIGH confidence)
- IndexedDB storage limits: effectively unlimited for this scale per MDN documentation (HIGH confidence)
- shadcn/ui theming: uses CSS custom properties scoped to `.dark` class via `attribute="class"` in theme provider (HIGH confidence, verified from package.json dependency)
- idb-keyval: minimal IndexedDB wrapper, ~3KB, widely used (MEDIUM confidence -- verify current API before adopting)

---
*Pitfalls research for: FilmIntern v1.1 UI and Formatting milestone*
*Researched: 2026-03-17*
