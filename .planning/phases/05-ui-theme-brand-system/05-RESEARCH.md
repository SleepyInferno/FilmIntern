# Phase 5: UI Theme & Brand System - Research

**Researched:** 2026-03-18
**Domain:** CSS theming, dark/light mode, design token system, Next.js theme management
**Confidence:** HIGH

## Summary

Phase 5 adds a dark/light theme toggle and an orange/amber brand color system to a Next.js 16 + Tailwind CSS 4 + shadcn v4 application. The existing codebase already has both `:root` (light) and `.dark` (dark) CSS variable blocks in `globals.css`, and the `.dark` class toggle mechanism is already wired via `@custom-variant dark (&:is(.dark *))`. The primary work is: (1) install `next-themes` to manage the `.dark` class dynamically, (2) update `--primary` from grayscale to amber across both theme blocks, (3) replace all hardcoded `stone-*` and `amber-*` Tailwind classes with CSS variable references, and (4) add an accent color preset picker on the settings page that swaps `--primary` via inline styles on `<html>`.

This is a well-understood problem domain. `next-themes` is the standard library (4M+ weekly downloads), the shadcn ecosystem documents this exact pattern, and the existing CSS variable architecture already supports the approach. The main risk is missing hardcoded color classes scattered across report components.

**Primary recommendation:** Use `next-themes` v0.4.6 for theme switching and apply accent presets by setting CSS custom properties directly on `document.documentElement.style`. No custom theme provider needed beyond what `next-themes` provides.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Toggle lives in the **top nav only** -- sun/moon icon button next to the existing settings gear icon
- **Dark mode is the default** -- aligns with current `className="dark"` on `<html>`
- Toggle shows: moon icon in dark mode, sun icon in light mode
- **Instant switch** -- no CSS transition animation when toggling
- Theme preference persists in `localStorage`
- **`--primary` CSS variable becomes the orange/amber brand color** (amber-500/amber-600 range) -- so shadcn buttons, focus rings, and interactive components inherit it automatically
- Orange/amber appears on: primary buttons, active/focus states, link and icon hover states, section headings/card borders
- **3-4 preset accent colors** available in settings page: Orange/Amber (default), Electric Blue, Emerald Green, Purple
- Each preset updates the `--primary` token across the full UI (both light and dark themes)
- Selected accent color **persists in `localStorage`** alongside the theme preference
- **Clean white/light gray** backgrounds for light theme -- pure white pages, light gray card backgrounds
- Card components use **subtle elevation**: thin `border-border` border + soft `box-shadow`

### Claude's Discretion
- Implementation details for accent color application (inline styles on `<html>` vs CSS class approach)
- Test strategy for theme switching

### Deferred Ideas (OUT OF SCOPE)
- Phase 6 card layout decision (responsive 2-3 column grid below analysis trigger area) -- Phase 6 scope, not Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| THEME-01 | User can toggle between light and dark theme | `next-themes` ThemeProvider with `attribute="class"` manages `.dark` class on `<html>`; toggle button in AppTopNav using Sun/Moon lucide icons |
| THEME-02 | App applies orange/amber brand accent colors consistently in both themes | Update `--primary` in globals.css to amber OKLCH values; replace all hardcoded `text-amber-*`, `bg-amber-*`, `text-stone-*`, `bg-stone-*` classes with CSS variable references; accent preset picker applies `--primary` overrides via `document.documentElement.style` |
| THEME-03 | Theme preference persists across page refreshes | `next-themes` handles theme persistence in `localStorage` automatically (key: `theme`); accent color stored separately in `localStorage` (key: `accent-color`) with a blocking `<script>` to apply before paint |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 | Dark/light mode management | De facto standard for Next.js theme switching; handles SSR flash prevention, localStorage persistence, system preference detection, and class toggling. No runtime dependencies. |
| lucide-react | 0.577.0 (existing) | Sun/Moon icons for toggle | Already installed; provides `Sun` and `Moon` icon components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.x (existing) | Utility classes + CSS variables | Already installed; `@custom-variant dark` already configured |
| shadcn | 4.x (existing) | UI components using `--primary` token | Already installed; components auto-inherit `--primary` changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-themes | Manual React context + localStorage | next-themes handles SSR flash, system preference, and `<script>` injection for free; hand-rolling would duplicate 200+ lines of edge-case handling |

**Installation:**
```bash
npm install next-themes
```

**Version verification:** `next-themes@0.4.6` confirmed via npm registry (2026-03-18). Peer deps: `react ^16.8 || ^17 || ^18 || ^19`. No direct dependency on `next` package -- works with any Next.js version. Zero runtime dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    layout.tsx              # Remove hardcoded className="dark", add suppressHydrationWarning
    providers.tsx           # Add ThemeProvider from next-themes wrapping existing providers
    globals.css             # Update --primary to amber OKLCH values in both :root and .dark
    settings/
      page.tsx              # Add accent color picker section
  components/
    app-topnav.tsx          # Add theme toggle button, replace hardcoded colors
    app-sidebar.tsx         # Replace hardcoded stone-* colors with CSS variable refs
    narrative-report.tsx    # Replace hardcoded amber-* colors
    corporate-report.tsx    # Replace hardcoded stone-* colors
    report-sections/
      moments-section.tsx   # Replace hardcoded amber-* colors
      themes-section.tsx    # Replace hardcoded amber-* colors
      quotes-section.tsx    # Replace hardcoded amber-*/stone-* colors
    ui/
      card.tsx              # Add subtle shadow class
  lib/
    theme.ts                # Accent color preset definitions and application logic (NEW)
```

### Pattern 1: next-themes ThemeProvider Integration
**What:** Wrap the app with `ThemeProvider` from `next-themes` to manage dark/light mode via class toggling.
**When to use:** Any Next.js app that needs dark/light theme switching without flash-of-unstyled-content (FOUC).
**Example:**
```typescript
// src/app/providers.tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme" disableTransitionOnChange>
      <WorkspaceProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  );
}
```

```typescript
// src/app/layout.tsx -- remove hardcoded dark class
<html lang="en" suppressHydrationWarning>
```

### Pattern 2: Accent Color Presets via CSS Custom Properties
**What:** Override `--primary` and `--primary-foreground` on `document.documentElement.style` to switch accent colors at runtime. Use a blocking `<script>` in `layout.tsx` to read `localStorage` and apply before first paint.
**When to use:** When you need runtime CSS variable overrides that persist across page loads without flash.
**Example:**
```typescript
// src/lib/theme.ts
export const ACCENT_PRESETS = {
  amber: {
    dark:  { primary: 'oklch(0.769 0.188 70.08)',  primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.666 0.179 58.318)', primaryFg: 'oklch(1 0 0)' },
  },
  blue: {
    dark:  { primary: 'oklch(0.7 0.15 250)',   primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.55 0.18 250)',  primaryFg: 'oklch(1 0 0)' },
  },
  emerald: {
    dark:  { primary: 'oklch(0.72 0.17 160)',  primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.6 0.18 160)',   primaryFg: 'oklch(1 0 0)' },
  },
  purple: {
    dark:  { primary: 'oklch(0.7 0.15 300)',   primaryFg: 'oklch(0.145 0 0)' },
    light: { primary: 'oklch(0.55 0.17 300)',  primaryFg: 'oklch(1 0 0)' },
  },
} as const;

export type AccentColor = keyof typeof ACCENT_PRESETS;

export function applyAccentColor(accent: AccentColor, theme: 'dark' | 'light') {
  const preset = ACCENT_PRESETS[accent][theme];
  document.documentElement.style.setProperty('--primary', preset.primary);
  document.documentElement.style.setProperty('--primary-foreground', preset.primaryFg);
}
```

### Pattern 3: Flash Prevention Script for Accent Colors
**What:** Inline `<script>` in `layout.tsx` `<head>` that reads accent color from `localStorage` and sets CSS variables before React hydrates.
**When to use:** When CSS variable overrides must apply before first paint to avoid a color flash.
**Example:**
```typescript
// In layout.tsx <head>
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var accent = localStorage.getItem('accent-color') || 'amber';
      var theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      var presets = { /* inline preset values */ };
      var p = presets[accent] && presets[accent][theme];
      if (p) {
        document.documentElement.style.setProperty('--primary', p[0]);
        document.documentElement.style.setProperty('--primary-foreground', p[1]);
      }
    } catch(e) {}
  })();
`}} />
```

### Pattern 4: Replacing Hardcoded Colors with CSS Variable References
**What:** Replace Tailwind utility classes like `text-amber-500`, `bg-stone-950`, `text-stone-400` with semantic CSS variable classes.
**When to use:** When components must respect the active theme.
**Mapping:**
```
text-amber-500 / text-amber-600  -->  text-primary
bg-amber-500 / bg-amber-600     -->  bg-primary
border-amber-500 / border-amber-600 --> border-primary
bg-stone-950                     -->  bg-background (or specific dark-bg token)
text-stone-50                    -->  text-foreground
text-stone-400                   -->  text-muted-foreground
bg-stone-900                     -->  bg-card (sidebar)
border-stone-800                 -->  border-border
bg-amber-500/20                  -->  bg-primary/20
```

### Anti-Patterns to Avoid
- **Hardcoding Tailwind color classes:** Every `text-amber-*`, `bg-stone-*` instance bypasses the theme system. All brand and surface colors must go through CSS variables.
- **Using CSS transitions on theme toggle:** User explicitly decided "instant switch" -- do not add `transition-colors` to the theme toggle mechanism. Use `disableTransitionOnChange` on the ThemeProvider.
- **Forgetting `suppressHydrationWarning`:** next-themes injects a blocking script that modifies `<html>` before hydration. Without `suppressHydrationWarning`, React will log a hydration mismatch warning.
- **Storing accent in server-side state:** Accent color is client-only (localStorage). Do not create an API endpoint for it or add it to the settings API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme switching with SSR | Custom context + useEffect + localStorage | `next-themes` ThemeProvider | Handles SSR flash, system preference, script injection, multiple themes, and class/attribute toggling. 200+ lines of edge cases. |
| Flash prevention | Custom `<script>` for theme class | `next-themes` built-in script | next-themes automatically injects a blocking script in `<head>` that reads localStorage and sets the class before paint |

**Key insight:** next-themes solves the "flash of wrong theme on page load" problem that is notoriously difficult to handle correctly in SSR frameworks. It handles localStorage, system preference fallback, and hydration mismatches automatically.

Note: For accent color flash prevention, a small custom `<script>` IS needed because next-themes only handles the theme class, not custom CSS variable overrides. This is a simple 10-line script, not a hand-rolled theme system.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch on `<html>` Element
**What goes wrong:** React logs a hydration warning because the server renders `<html>` without a class, but the client-side script adds `class="dark"` before hydration.
**Why it happens:** next-themes injects a blocking script that modifies the DOM before React hydrates.
**How to avoid:** Add `suppressHydrationWarning` to the `<html>` element in `layout.tsx`.
**Warning signs:** Console warning about "Extra attributes from the server: class".

### Pitfall 2: Accent Color Flash on Page Load
**What goes wrong:** Page loads with default amber accent, then flashes to user's selected accent after React hydrates and reads localStorage.
**Why it happens:** CSS variables in `globals.css` define the default amber values, and React-based accent application runs after hydration.
**How to avoid:** Add a small inline `<script>` in `<head>` (via `dangerouslySetInnerHTML`) that reads `localStorage('accent-color')` and sets `--primary` / `--primary-foreground` on `document.documentElement.style` before paint.
**Warning signs:** Brief amber flash when user has selected blue/emerald/purple accent.

### Pitfall 3: Accent Color Not Updating When Theme Toggles
**What goes wrong:** User has "blue" accent selected, toggles from dark to light, but the `--primary` value still shows the dark-mode blue instead of light-mode blue.
**Why it happens:** The accent script only runs once on page load; theme toggle changes the class but doesn't re-apply accent-specific `--primary` overrides.
**How to avoid:** Listen for theme changes (via `next-themes` `useTheme()` hook or a MutationObserver on the `<html>` class attribute) and re-apply the accent color preset for the new theme.
**Warning signs:** Accent colors look wrong after toggling theme.

### Pitfall 4: Missing Hardcoded Color Replacements
**What goes wrong:** Some components still show amber/stone colors in light mode because hardcoded Tailwind classes bypass the CSS variable system.
**Why it happens:** Hardcoded classes are scattered across 8+ files (topnav, sidebar, narrative-report, corporate-report, moments-section, themes-section, quotes-section).
**How to avoid:** Grep for `text-amber`, `bg-amber`, `border-amber`, `text-stone`, `bg-stone`, `border-stone` across `src/` and replace systematically. See the full list of affected files below.
**Warning signs:** Components that look correct in dark mode but wrong in light mode (or vice versa).

### Pitfall 5: Ring Color Not Following Primary
**What goes wrong:** Focus rings on buttons and inputs stay the default grayscale color instead of matching the amber/accent brand color.
**Why it happens:** The `--ring` CSS variable is separate from `--primary` and doesn't update with accent presets.
**How to avoid:** Set `--ring` to match `--primary` in both theme blocks of `globals.css`, and include `--ring` in the accent color preset application logic.
**Warning signs:** Focus outlines don't match brand color.

## Code Examples

### Files Requiring Hardcoded Color Replacement

Complete audit of files with hardcoded color classes that must be replaced:

```
src/components/app-topnav.tsx
  - bg-stone-950 --> bg-background
  - border-stone-800 --> border-border
  - text-stone-50 --> text-foreground
  - text-amber-500 --> text-primary
  - border-amber-500 --> border-primary
  - text-stone-400 --> text-muted-foreground
  - hover:text-stone-50 --> hover:text-foreground

src/components/app-sidebar.tsx
  - bg-stone-900 --> bg-card (or a sidebar-specific token)
  - border-stone-800 --> border-border
  - text-stone-50 --> text-foreground
  - text-stone-400 --> text-muted-foreground
  - border-l-amber-600 --> border-l-primary
  - hover:text-stone-50 --> hover:text-foreground

src/components/narrative-report.tsx
  - bg-stone-500 --> bg-muted-foreground (Badge)
  - bg-amber-500/20 --> bg-primary/20
  - text-amber-500 --> text-primary
  - border-amber-500/40 --> border-primary/40

src/components/corporate-report.tsx
  - border-stone-400 --> border-muted-foreground
  - border-stone-200 --> border-border

src/components/report-sections/moments-section.tsx
  - bg-amber-600 --> bg-primary
  - bg-amber-500 --> bg-primary

src/components/report-sections/themes-section.tsx
  - bg-amber-600 --> bg-primary

src/components/report-sections/quotes-section.tsx
  - border-amber-600 --> border-primary
  - border-stone-400 --> border-muted-foreground
  - border-stone-200 --> border-border
  - bg-amber-600 --> bg-primary
```

### useTheme Hook Usage (Theme Toggle)
```typescript
// Source: next-themes documentation
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
```

### Accent Color Picker Swatches
```typescript
// Settings page accent picker
const SWATCH_COLORS: Record<AccentColor, string> = {
  amber:   'oklch(0.769 0.188 70.08)',
  blue:    'oklch(0.7 0.15 250)',
  emerald: 'oklch(0.72 0.17 160)',
  purple:  'oklch(0.7 0.15 300)',
};

function AccentPicker({ current, onChange }: { current: AccentColor; onChange: (c: AccentColor) => void }) {
  return (
    <div className="flex gap-2">
      {(Object.keys(SWATCH_COLORS) as AccentColor[]).map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{ backgroundColor: SWATCH_COLORS[color] }}
          aria-label={`${color} accent color`}
        >
          {current === color && <Check size={14} className="text-white" />}
        </button>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual localStorage + useEffect for theme | next-themes ThemeProvider | Stable since 2022 | Eliminates FOUC and SSR hydration issues |
| data-theme attribute | class-based toggling (`.dark` on `<html>`) | Tailwind CSS 4 default | `@custom-variant dark (&:is(.dark *))` already configured in this project |
| Separate dark: prefixed utility classes | CSS variables with theme-aware values | shadcn v4 | All shadcn components use `--primary`, `--background`, etc. automatically |

**Deprecated/outdated:**
- Tailwind CSS 3 `darkMode: 'class'` config: replaced by `@custom-variant dark` in Tailwind CSS 4 (already configured)

## Open Questions

1. **Sidebar visibility in Phase 5 scope**
   - What we know: `app-sidebar.tsx` exists with hardcoded colors but the main layout uses `AppTopNav` not `AppSidebar`. Sidebar may be unused or conditionally rendered.
   - What's unclear: Whether sidebar is actively rendered in any route.
   - Recommendation: Replace hardcoded colors in sidebar anyway since it exists in the codebase and will need theming eventually. Low cost to include.

2. **next-themes `useTheme()` initial render on server**
   - What we know: `useTheme()` returns `undefined` for `theme` on the server/first render to avoid hydration mismatches.
   - What's unclear: Whether this causes a brief icon flash (no icon -> correct icon).
   - Recommendation: Use `mounted` state check pattern: render a placeholder or default icon until `mounted` is true. This is a standard next-themes pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-01 | Theme toggle switches between light/dark | unit | `npx vitest run src/components/__tests__/theme-toggle.test.tsx -x` | No -- Wave 0 |
| THEME-02 | Primary CSS variable set to amber OKLCH values | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | No -- Wave 0 |
| THEME-02 | Accent preset changes --primary on document | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | No -- Wave 0 |
| THEME-03 | Theme persists in localStorage | unit | `npx vitest run src/components/__tests__/theme-toggle.test.tsx -x` | No -- Wave 0 |
| THEME-03 | Accent color persists in localStorage | unit | `npx vitest run src/lib/__tests__/theme.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/theme-toggle.test.tsx` -- covers THEME-01, THEME-03 (toggle behavior, localStorage persistence)
- [ ] `src/lib/__tests__/theme.test.ts` -- covers THEME-02, THEME-03 (accent preset definitions, applyAccentColor function, localStorage persistence)
- [ ] Framework install: `npm install next-themes` -- required dependency

## Sources

### Primary (HIGH confidence)
- `next-themes` npm registry -- version 0.4.6 confirmed, peer deps React ^16.8+, zero runtime deps
- `globals.css` codebase inspection -- existing `:root` and `.dark` CSS variable blocks with OKLCH values
- `05-UI-SPEC.md` -- full color values, interaction contract, OKLCH presets for all 4 accent colors
- `05-CONTEXT.md` -- locked decisions on toggle location, default theme, persistence, accent presets

### Secondary (MEDIUM confidence)
- next-themes GitHub repository (pacocoursey/next-themes) -- ThemeProvider API, `attribute="class"`, `disableTransitionOnChange`, `suppressHydrationWarning` pattern

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or npm registry

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - next-themes is the undisputed standard for Next.js theme switching; verified version and peer deps
- Architecture: HIGH - existing CSS variable system and shadcn integration already support the approach; UI-SPEC provides exact OKLCH values
- Pitfalls: HIGH - well-known issues (FOUC, hydration mismatch, accent flash) with documented solutions

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, unlikely to change)
