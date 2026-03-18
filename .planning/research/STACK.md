# Stack Research

**Domain:** UI redesign additions for filmmaking analysis app (theme toggle, card layouts, local persistence)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Existing Stack (DO NOT change)

Already validated and in use -- listed for reference only:

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | App framework (App Router) |
| React | 19.2.3 | UI rendering |
| Tailwind CSS | v4 | Styling (CSS-first config) |
| shadcn + @base-ui/react | 4.0.8 / 1.3.0 | Component library |
| TypeScript | ^5 | Type safety |
| Zod | ^4.3.6 | Schema validation |
| lucide-react | ^0.577.0 | Icons |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Class composition |
| tw-animate-css | ^1.4.0 | CSS animations |

## New Dependencies to Add

### 1. Theme Toggle: next-themes

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-themes | ^0.4.6 | Dark/light theme switching with system preference support | De facto standard for Next.js theming. Handles SSR flash prevention, localStorage persistence, system preference detection, and class-based toggling that Tailwind CSS needs. Used by shadcn documentation and virtually every Next.js project with theme support. Zero alternatives worth considering. |

**Integration notes:**

- The project already has the `.dark` class hardcoded on `<html>` in layout.tsx and a `@custom-variant dark (&:is(.dark *));` rule in globals.css. next-themes replaces the hardcoded class with dynamic toggling.
- The existing custom-variant should be updated to `@custom-variant dark (&:where(.dark, .dark *));` -- the `:where()` selector has zero specificity (prevents cascade conflicts), and the additional `.dark` match (not just `.dark *`) ensures styles apply to the `<html>` element itself, not only its descendants.
- ThemeProvider wraps children in the existing `Providers` component (`src/app/providers.tsx`). Configuration: `attribute="class"`, `defaultTheme="dark"`, `enableSystem`.
- Remove the hardcoded `className="dark"` from `<html>` in layout.tsx -- next-themes manages this dynamically.
- The `useTheme()` hook provides `theme`, `setTheme`, and `resolvedTheme` for building the toggle button.
- No Tailwind config changes needed -- the CSS custom-variant handles everything in Tailwind v4.

### 2. Card-Based Layouts: No new dependencies needed

The existing stack is sufficient for building card-based analysis workspaces:

| Need | Already Available |
|------|-------------------|
| Card components | shadcn Card, CardHeader, CardContent, CardFooter |
| Responsive grid layouts | Tailwind CSS grid/flex (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) |
| Component variants per card type | class-variance-authority (CVA) |
| Icons for evaluation dimensions | lucide-react |
| Entrance animations | tw-animate-css |
| Class composition | `cn()` utility via clsx + tailwind-merge |

**Implementation approach:**

- Use Tailwind CSS grid with responsive columns for card layouts.
- Extend shadcn Card components with CVA variants for different evaluation dimension card styles (color-coded borders, accent indicators per dimension category).
- Brand accent colors (orange/amber) should be added as CSS custom properties in globals.css for both `:root` and `.dark` scopes (see CSS section below).
- No animation library needed -- tw-animate-css covers entrance animations.
- No drag-and-drop library needed -- card positions are fixed by project type, not user-configurable.

### 3. Client-Side Persistence: Dexie.js

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| dexie | ^4.0.11 | IndexedDB wrapper for storing saved analyses | Analyses contain structured JSON (Tiptap documents, Zod-validated report data) that can be large. localStorage has a 5-10MB limit which is too small for multiple saved analyses with rich content. Dexie wraps IndexedDB with a clean Promise-based API, typed schemas, versioned migrations, and reactive queries. |
| dexie-react-hooks | ^4.2.0 | React hooks for reactive Dexie queries | Provides `useLiveQuery()` which auto-updates components when IndexedDB data changes. Eliminates manual state sync between the database and React. Works across tabs. |

**Why Dexie over alternatives:**

- **vs. idb-keyval (~600B):** idb-keyval is key-value only. The Library feature needs querying (filter by project type, sort by date, search by title). idb-keyval cannot do this without loading everything into memory.
- **vs. localStorage:** 5-10MB limit is too small. No querying. Synchronous API blocks main thread on large reads.
- **vs. raw IndexedDB:** IndexedDB native API is callback-based and verbose. Dexie wraps it in ~40KB gzipped with dramatically better DX.
- **vs. localForage:** Polyfill-era library for pre-IndexedDB browsers. No querying. Essentially unmaintained.
- **vs. PouchDB / RxDB:** Sync-capable databases designed for CouchDB replication. Massive overkill for single-user local persistence with no sync target.

**Integration notes:**

- Define a `db.ts` file with a Dexie subclass. Primary table: `analyses` with fields for id, title, projectType, createdAt, updatedAt, reportData (Zod-validated JSON), documentJson (Tiptap format).
- Index on `projectType` and `createdAt` for Library filtering and sorting.
- Use `useLiveQuery()` in the Library page component for reactive listing.
- Wire save into the existing workspace context -- auto-save after AI streaming completes.
- Schema versioning via `db.version(1).stores(...)` handles future migrations.
- Dexie is client-side only. Only import in `'use client'` components -- never in Server Components or API routes.

## Installation

```bash
# Theme toggle
npm install next-themes

# Client-side persistence
npm install dexie dexie-react-hooks
```

Three packages total. No dev dependencies needed.

## CSS Custom Properties to Add

For the orange/amber brand system, add these to globals.css alongside existing variables:

```css
:root {
  --brand: oklch(0.705 0.213 47.604);        /* warm orange */
  --brand-foreground: oklch(0.985 0 0);       /* white text on brand */
  --brand-muted: oklch(0.905 0.081 70.697);   /* light amber for backgrounds */
}

.dark {
  --brand: oklch(0.792 0.194 60.627);         /* brighter amber for dark mode */
  --brand-foreground: oklch(0.145 0 0);        /* dark text on bright brand */
  --brand-muted: oklch(0.321 0.066 50.265);   /* dark amber for backgrounds */
}
```

Register in the `@theme inline` block:
```css
--color-brand: var(--brand);
--color-brand-foreground: var(--brand-foreground);
--color-brand-muted: var(--brand-muted);
```

This enables `bg-brand`, `text-brand-foreground`, `bg-brand-muted` Tailwind classes that automatically switch between light/dark values.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| next-themes | Manual React context + localStorage | Never for Next.js -- next-themes handles SSR hydration flash, system preference sync, and class toggling in ways that are tedious and error-prone to replicate manually |
| next-themes | CSS-only prefers-color-scheme | Only if you want system-only theming with no user toggle -- not the case here |
| Dexie.js | idb-keyval | When you only need simple key-value caching with no querying (user preferences, tokens) |
| Dexie.js | localStorage | When data is small (<1MB), simple strings, and querying is not needed |
| Existing shadcn Cards | react-grid-layout or similar | When users need drag-and-drop card rearrangement -- not in scope for v1.1 |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @radix-ui/react-* directly | Already using @base-ui/react which is the successor to Radix primitives in shadcn v4. Adding Radix creates duplicate abstractions. | @base-ui/react via shadcn components |
| zustand / jotai for persistence | In-memory state managers that need middleware for persistence. Dexie IS the storage layer with built-in reactivity via useLiveQuery. | Dexie + useLiveQuery for persistent data; React context for ephemeral UI state |
| react-query / SWR for Library data | Server-state caching libraries. The Library is local-first with no server to cache from. | Dexie useLiveQuery for reactive local queries |
| framer-motion | Card layouts do not need physics-based animations. tw-animate-css (already installed) handles CSS transitions. Framer adds ~30KB for no benefit. | tw-animate-css + Tailwind transition utilities |
| CSS Modules / styled-components | The project uses Tailwind CSS exclusively. Mixing paradigms creates maintenance burden. | Tailwind CSS classes + CSS custom properties |
| A separate UI library for cards | shadcn Card components + Tailwind grid is all that is needed. Adding Material UI, Chakra, etc. would conflict with existing shadcn patterns. | shadcn Card + CVA variants |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next-themes@0.4.6 | Next.js 13-16, React 18-19 | Stable. Uses React context internally. No known issues with Next.js 16 or React 19. |
| dexie@4.0.11 | All modern browsers, any React version | IndexedDB available in all modern browsers. Dexie has zero React dependency. |
| dexie-react-hooks@4.2.0 | dexie@4.x, React 16.8+ | Must match major version with dexie (both v4). Works with React 19. |

## Key Architecture Notes

1. **Theme state is UI-only.** next-themes handles persistence (localStorage) and hydration. No database involvement.
2. **Card layouts are purely presentational.** No new data model needed -- cards render from existing Zod-validated analysis report schemas. Each project type maps to a different set of evaluation dimension cards.
3. **Library persistence is the only new data layer.** Dexie stores complete analysis results locally. The existing workspace context should gain save/load methods that bridge to the Dexie database.
4. **No server changes needed.** All three features (theme, cards, Library) are client-side only. No new API routes required.

## Sources

- [next-themes GitHub](https://github.com/pacocoursey/next-themes) -- v0.4.6 confirmed, API reference (HIGH confidence)
- [Dark Mode in Next.js 15 with Tailwind CSS v4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) -- Tailwind v4 custom-variant config (HIGH confidence)
- [shadcn dark mode guide](https://ui.shadcn.com/docs/dark-mode/next) -- official integration pattern (HIGH confidence)
- [Dexie.js npm](https://www.npmjs.com/package/dexie) -- v4.0.11 confirmed, Jan 2026 release (HIGH confidence)
- [Dexie useLiveQuery docs](https://dexie.org/docs/dexie-react-hooks/useLiveQuery()) -- React hooks API (HIGH confidence)
- [npm-compare: idb vs dexie vs localforage](https://npm-compare.com/dexie,idb,localforage) -- library comparison data (MEDIUM confidence)
- [Tailwind v4 + next-themes integration](https://medium.com/@kevstrosky/theme-colors-with-tailwind-css-v4-0-and-next-themes-dark-light-custom-mode-36dca1e20419) -- CSS-first dark mode config (MEDIUM confidence)

---
*Stack research for: FilmIntern v1.1 UI and Formatting milestone*
*Researched: 2026-03-17*
