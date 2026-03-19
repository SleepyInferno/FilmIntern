---
phase: 05-ui-theme-brand-system
plan: 01
subsystem: ui
tags: [next-themes, dark-mode, light-mode, oklch, css-variables, theme-toggle, accent-colors]

# Dependency graph
requires: []
provides:
  - ThemeProvider wiring with next-themes for dark/light switching
  - Amber/orange brand accent colors via --primary CSS variable
  - 4 accent color presets (amber, blue, emerald, purple) library
  - Theme toggle button in top navigation
  - Accent flash prevention script for page loads
  - Card elevation with shadow-sm
affects: [05-02-accent-picker-settings]

# Tech tracking
tech-stack:
  added: [next-themes]
  patterns: [CSS variable theme tokens, accent flash prevention, semantic color classes]

key-files:
  created:
    - src/lib/theme.ts
    - src/lib/__tests__/theme.test.ts
    - src/components/__tests__/theme-toggle.test.tsx
  modified:
    - src/app/providers.tsx
    - src/app/globals.css
    - src/app/layout.tsx
    - src/components/app-topnav.tsx
    - src/components/ui/card.tsx
    - package.json

key-decisions:
  - "Used vi.stubGlobal for localStorage mocking in vitest jsdom environment"
  - "Mounted state pattern for theme toggle to prevent hydration mismatch"

patterns-established:
  - "Semantic color classes: use bg-background, text-foreground, text-primary, etc. instead of hardcoded color classes"
  - "Accent flash prevention: inline script in head reads localStorage and sets CSS variables before paint"

requirements-completed: [THEME-01, THEME-02, THEME-03]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 5 Plan 01: Theme System Summary

**Dark/light theme toggle with next-themes, amber OKLCH brand colors, 4 accent presets, and flash prevention script**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T04:46:50Z
- **Completed:** 2026-03-18T04:50:37Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Installed next-themes and created complete theme library with 4 accent color presets (amber, blue, emerald, purple)
- Wired ThemeProvider, updated CSS tokens to amber/orange OKLCH values, added theme toggle with Sun/Moon icons
- Replaced all hardcoded stone-*/amber-* color classes in topnav with semantic CSS variable classes
- Added accent flash prevention inline script and card shadow-sm elevation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-themes, create theme library, write tests** - `f9e42bd` (feat)
2. **Task 2: Wire ThemeProvider, update CSS tokens, update layout, add toggle, card elevation** - `fd65d47` (feat)

## Files Created/Modified
- `src/lib/theme.ts` - Accent color presets, applyAccentColor, getStoredAccent, setStoredAccent, ACCENT_FLASH_SCRIPT
- `src/lib/__tests__/theme.test.ts` - 11 unit tests for theme library
- `src/components/__tests__/theme-toggle.test.tsx` - 2 tests for theme toggle in AppTopNav
- `src/app/providers.tsx` - Added ThemeProvider as outermost wrapper
- `src/app/globals.css` - Updated --primary, --primary-foreground, --ring, --card to amber OKLCH values
- `src/app/layout.tsx` - Removed className="dark", added suppressHydrationWarning and flash script
- `src/components/app-topnav.tsx` - Added theme toggle button, replaced all hardcoded colors with semantic classes
- `src/components/ui/card.tsx` - Added shadow-sm for subtle elevation
- `package.json` - Added next-themes dependency

## Decisions Made
- Used vi.stubGlobal for localStorage mocking in vitest jsdom environment because jsdom's built-in localStorage had incomplete API support
- Used mounted state pattern (useState + useEffect) for theme toggle to prevent server/client hydration mismatch with next-themes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed localStorage mock in theme tests**
- **Found during:** Task 1 (theme library tests)
- **Issue:** jsdom environment's localStorage.setItem/removeItem were not functions, causing test failures
- **Fix:** Used vi.stubGlobal to provide a complete localStorage mock with getItem, setItem, removeItem
- **Files modified:** src/lib/__tests__/theme.test.ts
- **Verification:** All 11 theme tests pass
- **Committed in:** f9e42bd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test infrastructure fix. No scope creep.

## Issues Encountered
- Pre-existing test failures in settings.test.ts, narrative.test.ts, page.test.tsx, and settings page.test.tsx are unrelated to this plan's changes (model name updates, schema changes). Not addressed per scope boundary rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Theme toggle fully functional, ready for accent color picker in Plan 02 (settings page)
- Accent preset library exported and ready for settings page integration
- All semantic color classes in place for theme-aware rendering

---
*Phase: 05-ui-theme-brand-system*
*Completed: 2026-03-18*
