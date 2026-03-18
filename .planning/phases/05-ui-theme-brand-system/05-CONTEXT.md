# Phase 5: UI Theme & Brand System - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a dark/light theme toggle to the app and wire orange/amber brand accent colors through the full design token system. Includes 3-4 preset accent color options in settings. No new pages, no layout changes.

</domain>

<decisions>
## Implementation Decisions

### Theme Toggle
- Toggle lives in the **top nav only** — sun/moon icon button next to the existing settings gear icon
- **Dark mode is the default** — aligns with current `className="dark"` on `<html>`
- Toggle shows: moon icon in dark mode, sun icon in light mode
- **Instant switch** — no CSS transition animation when toggling
- Theme preference persists in `localStorage`

### Brand Color System
- **`--primary` CSS variable becomes the orange/amber brand color** (amber-500/amber-600 range) — so shadcn buttons, focus rings, and interactive components inherit it automatically
- Orange/amber appears on: primary buttons (Run Analysis, Generate, etc.), active/focus states, link and icon hover states, section headings/card borders
- **3-4 preset accent colors** available in the settings page:
  1. **Orange/Amber** (default)
  2. Electric Blue
  3. Emerald Green
  4. Purple
- Each preset updates the `--primary` token across the full UI (both light and dark themes)
- Selected accent color **persists in `localStorage`** alongside the theme preference
- Orange/Amber is the default; other colors activate when user selects them in settings

### Light Theme
- **Clean white/light gray** backgrounds — pure white pages, light gray card backgrounds (like Linear/Notion professional feel)
- Same **amber-500/600** used in light mode — amber has sufficient contrast on white backgrounds
- Generic shadcn `:root` defaults (currently grayscale) updated to reflect the clean white/gray professional direction

### Card Style (Phase 5 scope)
- Card components use **subtle elevation**: thin `border-border` border + soft `box-shadow`
- Works in both dark and light themes
- Applies to the existing `card.tsx` component and anywhere cards appear in the UI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Theme & Requirements
- `.planning/REQUIREMENTS.md` — THEME-01, THEME-02, THEME-03 (theme toggle, brand accent colors, persistence)
- `.planning/PROJECT.md` — Milestone v1.1 goals and current feature state

### Existing Code (read before modifying)
- `src/app/globals.css` — Current CSS variables (`:root` light and `.dark` color tokens, `--primary` definition)
- `src/app/layout.tsx` — Hardcoded `className="dark"` that needs to become dynamic
- `src/app/providers.tsx` — Where a ThemeProvider should be added
- `src/components/app-topnav.tsx` — Where the toggle button gets added; currently uses hardcoded `text-amber-500`/`bg-stone-950`
- `src/app/settings/page.tsx` — Where accent color picker goes (alongside existing AI provider settings)
- `src/components/ui/card.tsx` — Card component to receive subtle elevation styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Providers` component (`src/app/providers.tsx`): The right place to wrap a `ThemeProvider` — currently wraps `WorkspaceProvider` and `TooltipProvider`
- `AppTopNav` (`src/components/app-topnav.tsx`): Already has settings gear icon on right side — theme toggle button goes here
- `globals.css`: Already has both `:root` and `.dark` CSS variable blocks — just need to update `--primary` to amber and make switching dynamic
- Shadcn `button.tsx`, `tabs.tsx`, etc.: Will automatically pick up `--primary` change once the token is updated

### Established Patterns
- Color system: OKLCH color values used throughout (`oklch(...)` format)
- Dark mode toggle pattern: `@custom-variant dark (&:is(.dark *))` — works by toggling `.dark` class on `<html>` element
- Settings page already exists and uses the same pattern as other settings (AI provider config)

### Integration Points
- `<html>` element in `layout.tsx`: Currently `className="dark"` — needs to become class-toggled dynamically via `next-themes` or equivalent
- `localStorage`: Both theme and accent color persist here
- Settings page `/settings`: New accent color picker section added below existing AI provider settings

</code_context>

<specifics>
## Specific Ideas

- Brand color presets should feel "sleek and modern" — not garish. Electric Blue, Emerald, and Purple should be muted/saturated tastefully, not neon
- The 3-4 color presets should be displayed as clickable swatches in the settings page, not a dropdown

</specifics>

<deferred>
## Deferred Ideas

- **Phase 6 card layout decision** (captured here for Phase 6 context): Analysis workspace cards appear as a **responsive 2-3 column grid** below the analysis trigger area. Single column on mobile. This is Phase 6 scope, not Phase 5.

</deferred>

---

*Phase: 05-ui-theme-brand-system*
*Context gathered: 2026-03-18*
