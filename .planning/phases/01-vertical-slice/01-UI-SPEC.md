---
phase: 1
slug: vertical-slice
status: draft
shadcn_initialized: false
preset: pending-scaffolding
created: 2026-03-16
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the vertical slice: documentary project type with plain text upload, analysis, and structured report display. Defines the full app shell (sidebar, project type tabs) but only documentary content is implemented.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (to be initialized during scaffolding) |
| Preset | default (neutral) — customize theme tokens per color section below |
| Component library | Radix UI (via shadcn/ui) |
| Icon library | Lucide React 0.577.0 |
| Font | Inter (system default for shadcn) via `next/font/google` |

shadcn components required for Phase 1:
`button`, `card`, `tabs`, `badge`, `accordion`, `separator`, `skeleton`, `select`, `tooltip`

---

## Layout Contract

### App Shell

```
+-------------------+----------------------------------------------+
|                   |  Breadcrumb Bar (project context + actions)  |
|   Sidebar         +----------------------------------------------+
|   (240px fixed)   |                                              |
|                   |  Project Type Tabs                           |
|   - Logo/Brand    +----------------------------------------------+
|   - Nav items     |                                              |
|   - Settings      |  Main Content Area (scrollable)              |
|     (bottom)      |                                              |
|                   |                                              |
+-------------------+----------------------------------------------+
```

**Sidebar:** 240px fixed width. Dark background (`sidebar` color token). Icon + label navigation. Collapsible to 64px icon-only on narrow viewports (below 1024px). When collapsed to icon-only mode, each nav item shows a shadcn `Tooltip` on hover displaying the full label text.

**Breadcrumb bar:** Full width above content. Shows "Project: [Name] | [Analysis Type]". Right-aligned: future export button (disabled placeholder), user avatar placeholder.

**Project type tabs:** Horizontal tab bar across top of main content. Tabs: Documentary (active, implemented), Corporate Interview (placeholder), Narrative Film (placeholder), TV/Episodic (placeholder), Short-form (placeholder). Placeholder tabs show a "Coming soon" empty state when clicked.

**Main content area:** Fills remaining width. Max content width 1200px centered. Vertical scroll. Padding: 32px horizontal, 24px vertical.

### Sidebar Navigation Items

| Label | Icon (Lucide) | Phase 1 State |
|-------|---------------|---------------|
| Dashboard | `LayoutDashboard` | Placeholder — empty state |
| Projects | `FolderOpen` | Active — project type selection and analysis |
| Shot Lists | `ListVideo` | Placeholder — "Coming in a future update" |
| Image Prompts | `ImagePlus` | Placeholder — "Coming in a future update" |
| Exports | `Download` | Placeholder — "Coming in a future update" |
| Settings | `Settings` | Placeholder — bottom-pinned |

### Page Flow (Phase 1)

1. **Project Type Selection** — Cards for each project type. Documentary is selectable; others show "Coming soon" badge.
2. **Upload** — Drag-and-drop zone for .txt file. After upload: parsed content preview with word count, line count.
3. **Analysis Report** — Structured report with streaming sections: summary, key quotes, recurring themes, key moments, editorial notes.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline badge padding |
| sm | 8px | Compact element spacing, card internal gaps |
| md | 16px | Default element spacing, form field gaps |
| lg | 24px | Section padding, card body padding |
| xl | 32px | Layout gaps, main content horizontal padding |
| 2xl | 48px | Major section breaks, page top margin |
| 3xl | 64px | Page-level spacing (unused in Phase 1) |

Exceptions: Touch targets for buttons minimum 40px height (matching sidebar nav item height for consistent interactive elements). Sidebar nav items 40px height for comfortable click targets. On mobile contexts (if applicable), touch targets expand to 44px.

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 14px | 400 (regular) | 1.5 | Default text, transcript preview, report body |
| Label | 13px | 400 (regular) | 1.4 | Form labels, sidebar nav items, badge text, metadata |
| Heading | 20px | 600 (semibold) | 1.3 | Section headings in report, page titles |
| Display | 28px | 600 (semibold) | 1.2 | App brand text ("Nano Banana"), phase/page headers |

Font stack: `Inter, system-ui, -apple-system, sans-serif`

Weights used: 400 (regular), 600 (semibold) — load only these two via `next/font/google`.

---

## Color

Based on the reference screenshot: dark sidebar, light main content, warm amber accent.

| Role | Value | CSS Variable | Usage |
|------|-------|-------------|-------|
| Dominant (60%) | `#FAFAF8` | `--background` | Main content background, page surfaces |
| Secondary (30%) | `#1C1917` | `--sidebar` | Sidebar background, dark surfaces |
| Secondary card | `#FFFFFF` | `--card` | Card backgrounds, elevated surfaces |
| Secondary muted | `#F5F5F0` | `--muted` | Muted backgrounds, hover states, transcript preview bg |
| Accent (10%) | `#D97706` | `--primary` | See reserved list below |
| Destructive | `#DC2626` | `--destructive` | Error states, destructive action buttons |
| Border | `#E5E2DB` | `--border` | Card borders, dividers, input borders |
| Text primary | `#1C1917` | `--foreground` | Headings, body text on light backgrounds |
| Text secondary | `#78716C` | `--muted-foreground` | Labels, metadata, placeholder text |
| Text on dark | `#FAFAF8` | `--sidebar-foreground` | Sidebar text, text on dark surfaces |
| Accent foreground | `#FFFFFF` | `--primary-foreground` | Text on accent-colored buttons |

### Accent Reserved For

The amber accent (`#D97706`) is reserved exclusively for:
- Selected/active project type tab indicator
- Primary CTA buttons ("Run Analysis", "Upload Transcript")
- Active sidebar navigation indicator (left border highlight)
- Badge highlights for quote usefulness ratings ("must-use" quotes)
- Progress/loading bar fill during analysis streaming

Accent is NOT used for: links, all buttons generically, hover states, borders, or decorative elements.

### Key Moments Type Badge Colors

| Type | Tailwind Class | Hex Value | CSS Variable |
|------|---------------|-----------|--------------|
| turning-point | `bg-amber-600` | `#D97706` | `--primary` (accent) |
| emotional-peak | `bg-rose-500` | `#F43F5E` | `--km-emotional` |
| revelation | `bg-amber-500` | `#F59E0B` | `--km-revelation` |
| contradiction | `bg-orange-500` | `#F97316` | `--km-contradiction` |
| humor | `bg-emerald-500` | `#10B981` | `--km-humor` |

These CSS variables are declared in the app's global stylesheet alongside the shadcn theme tokens. They do not override any shadcn defaults.

### Dark Mode

Not in scope for Phase 1. Single light theme with dark sidebar.

---

## Component Inventory (Phase 1)

### Project Type Selector Card

| Property | Value |
|----------|-------|
| Component | shadcn `Card` |
| Size | 280px wide, auto height |
| Layout | Icon (48px Lucide) + title + description + badge |
| States | default, hover (border accent), selected (border accent + accent bg at 5%), disabled ("Coming soon" badge) |
| Badge | shadcn `Badge` variant="secondary" for "Coming soon"; variant="default" (accent) for active type |

### File Dropzone

| Property | Value |
|----------|-------|
| Component | Custom using react-dropzone + shadcn `Card` |
| Size | Full content width, 200px min-height |
| Border | 2px dashed, `--border` color default |
| States | default (dashed border), drag-active (dashed accent border + 5% accent bg), uploaded (solid border + file info) |
| Icon | `Upload` from Lucide, 40px, `--muted-foreground` color |
| Copy | See Copywriting Contract below |

### Content Preview

| Property | Value |
|----------|-------|
| Component | shadcn `Card` with scrollable body |
| Max height | 400px with overflow scroll |
| Background | `--muted` background for transcript text area |
| Metadata bar | Word count + line count as `Badge` components above preview |
| Typography | Body (14px/400) monospaced (`font-mono`) for transcript text |

### Analysis Report

| Property | Value |
|----------|-------|
| Layout | Vertical stack of section cards, 24px gap between sections |
| Sections | Summary, Key Quotes, Recurring Themes, Key Moments, Editorial Notes |
| Section card | shadcn `Card` with heading (20px/600) and body content |
| Streaming state | shadcn `Skeleton` blocks replacing content until section data arrives |

### Report Section: Summary

| Property | Value |
|----------|-------|
| Content | Overview text (body), stat badges (interviewee count, quote count, theme count) |
| Stat badges | shadcn `Badge` variant="outline", showing count + label |
| Theme chips | shadcn `Badge` variant="secondary" for each dominant theme |

### Report Section: Key Quotes

| Property | Value |
|----------|-------|
| Layout | Vertical list of quote cards, 16px gap |
| Quote card | Left amber border (3px solid accent) for "must-use" quotes; left muted border for others |
| Quote text | Italic, body size, `"` delimited |
| Speaker | Label size, semibold, below quote |
| Context | Body size, muted foreground, below speaker |
| Badges | Category badge (emotional/informational/etc.) + usefulness badge (must-use in accent, strong in secondary, supporting in outline) |

### Report Section: Recurring Themes

| Property | Value |
|----------|-------|
| Layout | shadcn `Accordion` — each theme is a collapsible item |
| Theme header | Theme name (heading size) + frequency badge |
| Theme body | Description text + evidence quotes as indented blockquotes |
| Frequency badge | "dominant" = accent, "recurring" = secondary, "emerging" = outline |

### Report Section: Key Moments

| Property | Value |
|----------|-------|
| Layout | Vertical timeline-style list with position indicators |
| Position indicator | Badge showing "Early" / "Middle" / "Late" in outline variant |
| Type badge | Colored by type: turning-point=`#D97706`, emotional-peak=`#F43F5E`, revelation=`#F59E0B`, contradiction=`#F97316`, humor=`#10B981` (see Key Moments Type Badge Colors table) |
| Moment text | Heading-size moment name, body-size significance below |

### Report Section: Editorial Notes

| Property | Value |
|----------|-------|
| Layout | Three subsections: Narrative Threads, Missing Perspectives, Suggested Structure |
| Narrative threads | Bulleted list, body text |
| Missing perspectives | Bulleted list, body text, muted foreground |
| Suggested structure | Paragraph, body text |

---

## Interaction States

### Upload Flow

| State | Visual |
|-------|--------|
| No file selected | Dropzone with dashed border, upload icon, instructional copy |
| Dragging over | Dashed accent border, 5% accent background tint, copy changes to "Drop your transcript here" |
| File accepted | Dropzone collapses to file info bar (filename, size, word count). Preview card appears below. "Run Analysis" button appears. |
| Invalid file type | Dropzone border turns destructive red. Error copy appears below. Resets after 3 seconds or next interaction. |
| Uploading | Skeleton placeholder in preview area. Upload icon animates (pulse). |

### Analysis Flow

| State | Visual |
|-------|--------|
| Ready | "Run Analysis" button in accent color, enabled |
| Analyzing (streaming) | Button disabled with spinner. Report sections appear as Skeleton blocks, then fill progressively as data streams in. Sections render top-to-bottom: summary first, editorial notes last. |
| Complete | All sections rendered. Button text changes to "Re-run Analysis". |
| Error | Error card appears above report area. Red border. Error copy with retry action. |

### Sidebar Navigation

| State | Visual |
|-------|--------|
| Default | Icon + label in sidebar foreground color |
| Hover | Background lightens to 10% white overlay |
| Active | Left 3px accent border. Text and icon at full white. Background at 5% white overlay. |
| Disabled (placeholder) | 50% opacity. No hover effect. Tooltip on hover: "Coming in a future update" |
| Icon-only (collapsed) | Tooltip on hover showing full label text via shadcn `Tooltip` component |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| App title | Nano Banana |
| Primary CTA (analysis) | Run Analysis |
| Primary CTA (re-run) | Re-run Analysis |
| Upload CTA | Upload Transcript |
| Dropzone heading | Drag & drop your transcript, or click to browse |
| Dropzone subtext | Accepts .txt files up to 10MB |
| Dropzone drag-active | Drop your transcript here |
| Empty state heading (project selection) | Choose a project type |
| Empty state body (project selection) | Select a project type to get started with your analysis. |
| Empty state heading (placeholder tabs) | Coming Soon |
| Empty state body (placeholder tabs) | This project type is not yet available. Documentary analysis is ready to use. |
| Empty state heading (placeholder nav) | Coming in a Future Update |
| Empty state body (placeholder nav) | Use the Projects section to get started with documentary analysis. |
| Error: upload failed | Upload failed. Check your file and try again. |
| Error: invalid file type | Only .txt files are supported. Please upload a plain text transcript. |
| Error: file too large | File exceeds 10MB limit. Please upload a smaller file. |
| Error: analysis failed | Analysis could not be completed. Check your connection and try again. |
| Streaming indicator | Analyzing your transcript... |
| Analysis complete | Analysis complete |
| Preview metadata | {wordCount} words, {lineCount} lines |

No destructive actions exist in Phase 1 (no delete, no data modification). Destructive confirmation patterns will be defined in later phases.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | button, card, tabs, badge, accordion, separator, skeleton, select, tooltip | not required |

No third-party registries declared for Phase 1.

---

## Responsive Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| >= 1280px | Full layout: 240px sidebar + main content (max 1200px centered) |
| 1024-1279px | Sidebar collapses to 64px icon-only. Main content expands. |
| < 1024px | Sidebar hidden, hamburger menu in top bar. Single column layout. |

Phase 1 is a desktop-first professional tool. Mobile layout is functional but not optimized. Minimum supported width: 768px.

---

## Accessibility

| Concern | Implementation |
|---------|----------------|
| Keyboard navigation | All interactive elements reachable via Tab. Sidebar nav items focusable. Dropzone activates on Enter/Space. |
| Screen reader | Dropzone has `aria-label`. Report sections use semantic headings (h2 for section titles). Badges have `aria-label` for category meaning. |
| Color contrast | All text meets WCAG AA (4.5:1 for body, 3:1 for large text). Accent `#D97706` on white passes at 3.1:1 for large text only — use only on buttons with white foreground text (passes 4.7:1). |
| Focus indicators | Default shadcn focus ring (2px offset ring in accent color). |
| Motion | Skeleton shimmer animation respects `prefers-reduced-motion`. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
