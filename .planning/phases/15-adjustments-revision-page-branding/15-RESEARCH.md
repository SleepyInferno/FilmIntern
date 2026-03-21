# Phase 15: Adjustments / Revision Page + Branding - Research

**Researched:** 2026-03-21
**Domain:** Next.js App Router routing, UI shell creation, branding rename
**Confidence:** HIGH

## Summary

Phase 15 is a low-risk, well-scoped phase with two distinct workstreams: (1) creating a new "Adjustments / Revision" page as a separate Next.js route accessible from the analysis workspace, and (2) renaming "Nano Banana" to "Film Intern" across the entire application.

The codebase is a Next.js 16 App Router application with a clear routing structure (`src/app/` filesystem routing). The existing navigation lives in two components: `AppTopNav` (horizontal top bar used in current layout) and `AppSidebar` (legacy sidebar, still rendered but secondary). The workspace context (`WorkspaceContext`) already carries `currentProjectId`, `analysisData`, and `reportDocument` -- all data the revision page will need to reference. No new dependencies are required.

**Primary recommendation:** Create `src/app/revision/[projectId]/page.tsx` as the new route. Add a navigation link/button from the completed analysis workspace. Update "Nano Banana" to "Film Intern" in the two known locations. No new libraries needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-05 | Suggestion review lives on a dedicated "Adjustments / Revision" page, separate from the existing analysis workspace | New Next.js route at `/revision/[projectId]` with shell layout; navigation from completed workspace |
| REVW-06 | Existing analysis workflow is unchanged -- the new page is additive only | Additive-only: new route + new component + nav button; zero modifications to analysis flow in `page.tsx` |
| BRAND-01 | App name is updated from "Nano Banana" to "Film Intern" across all pages, titles, and metadata | Two source locations: `layout.tsx` metadata title, `app-sidebar.tsx` brand text. TopNav already says "FilmIntern" |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router filesystem routing | Already in use; new route is just a new directory |
| react | 19.2.3 | UI components | Already in use |
| lucide-react | 0.577.0 | Icons for nav/buttons | Already in use throughout |
| tailwindcss | 4.x | Styling | Already in use throughout |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation | (bundled) | `useRouter`, `useParams`, `Link` | Navigation to/from revision page |
| @/components/ui/* | (project) | Card, Button, Skeleton, Badge | Shell layout placeholder UI |

### No New Dependencies

This phase requires zero new npm packages. All routing, navigation, and UI primitives are already available in the project.

## Architecture Patterns

### Recommended Route Structure

```
src/app/
  revision/
    [projectId]/
      page.tsx          # Shell page component for revision/adjustments
```

**Why `[projectId]` dynamic segment:** The revision page is tied to a specific completed analysis. Using a dynamic route segment (1) makes the URL bookmarkable/shareable, (2) allows direct navigation without requiring workspace context to be pre-loaded, and (3) follows the same pattern the project API already uses (`/api/projects/[id]`).

### Pattern 1: Revision Page Shell

**What:** A page that loads project data from the API, displays a minimal shell layout, and renders placeholder content areas where downstream phases (16-18) will add suggestion generation, review UI, and export.

**When to use:** Now -- this is the entire purpose of Phase 15.

**Example:**
```typescript
// src/app/revision/[projectId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RevisionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  // Load project data from /api/projects/[id]
  // Display shell with placeholder sections
}
```

### Pattern 2: Navigation from Completed Workspace

**What:** A button/link in the completed analysis view (in `page.tsx` at line ~473-501) that navigates to the revision page.

**When to use:** Only when analysis is complete (`reportDocument` exists and `!isAnalyzing`).

**Key constraint:** The button must be additive -- added alongside existing workspace UI, not replacing anything. The existing `DocumentWorkspace` component and its tabs must remain untouched.

**Placement options:**
- Best: Add a button in the project info bar above `DocumentWorkspace` (around line 474-485 of `page.tsx`), next to the project type label and title
- The button should use `Link` from `next/link` to navigate to `/revision/${currentProjectId}`

### Pattern 3: Branding Update

**What:** Find-and-replace "Nano Banana" with "Film Intern" in two locations.

**Locations (exhaustive -- verified via grep):**
1. `src/app/layout.tsx` line 16: `title: "Nano Banana"` --> `title: "Film Intern"`
2. `src/components/app-sidebar.tsx` line 117: `Nano Banana` --> `Film Intern`
3. `src/components/app-sidebar.tsx` line 119-120: collapsed abbreviation `NB` --> `FI`

**Already correct:** `src/components/app-topnav.tsx` line 33 already reads `FilmIntern` (one word, no space). Consider whether to update to "Film Intern" (with space) for consistency with the branding requirement.

### Anti-Patterns to Avoid

- **Putting revision content in a tab inside DocumentWorkspace:** REVW-05 explicitly requires a separate page/route, not a tab in the existing workspace.
- **Modifying the analysis streaming/save flow:** REVW-06 requires the existing workflow to be completely unchanged. The revision page is additive only.
- **Building actual suggestion UI in this phase:** Phase 15 is shell-only. Placeholder content is the correct output. Downstream phases (16-18) fill it in.
- **Coupling revision page to WorkspaceContext:** The revision page should load its own data from the API (via `projectId` param), not rely on in-memory workspace state that may not be populated if the user navigates directly to the URL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route-based navigation | Custom SPA routing | Next.js App Router filesystem routes | Already the project pattern |
| Project data loading | Custom fetch hooks | Simple `useEffect` + `fetch('/api/projects/${id}')` | Matches existing patterns (see `projects-sidebar.tsx`) |
| Placeholder UI | Complex skeleton screens | Existing `Card` + `Skeleton` components from `@/components/ui/` | Already built and themed |

## Common Pitfalls

### Pitfall 1: Breaking the Existing Layout

**What goes wrong:** The root layout (`layout.tsx`) wraps ALL pages with `AppTopNav` + `ProjectsSidebar` + constrained `max-w-[1100px]` container. The revision page will inherit this layout.
**Why it matters:** The revision page may eventually need a wider layout for side-by-side diff views (Phase 17). But for Phase 15, the existing layout is fine -- shell/placeholder content fits within 1100px.
**How to avoid:** Accept the existing layout for now. If Phase 17 needs a different layout, a route group with its own layout can be added then. Don't prematurely restructure.

### Pitfall 2: Stale Navigation State

**What goes wrong:** User navigates to revision page, but the sidebar doesn't highlight the current project or the "back to analysis" flow is broken.
**Why it matters:** The `ProjectsSidebar` loads projects from the API and highlights based on `currentProjectId` from `WorkspaceContext`. If the revision page doesn't set `currentProjectId`, the sidebar state may be stale.
**How to avoid:** The revision page should call `loadProject(projectId)` or at minimum set `currentProjectId` from the URL param so the sidebar stays in sync.

### Pitfall 3: Incomplete Branding Grep

**What goes wrong:** Missing a "Nano Banana" reference leaves old branding visible somewhere.
**Why it matters:** BRAND-01 requires the name to be updated "across all pages, titles, and metadata."
**How to avoid:** Full grep has been done -- only 2 source code locations exist. The `AppTopNav` already says "FilmIntern." The `package.json` already says `"name": "filmintern"`. No environment variables or config files reference "Nano Banana."

### Pitfall 4: Revision Page Without Project Data

**What goes wrong:** User navigates to `/revision/some-id` for a project that doesn't have analysis data yet (project stub without completed analysis).
**Why it matters:** The revision page shell should handle this gracefully -- showing a message like "Analysis not yet completed" with a link back.
**How to avoid:** Check for `analysisData` in the loaded project; show appropriate empty state if missing.

## Code Examples

### Navigation Button (additive to page.tsx)

```typescript
// Added in the completed analysis section of page.tsx, around line 474
// Source: project codebase pattern
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Inside the {reportDocument && !isAnalyzing && (...)} block:
<Link
  href={`/revision/${currentProjectId}`}
  className={buttonVariants({ variant: 'outline', size: 'sm' })}
>
  Adjustments & Revision
  <ArrowRight className="ml-2 h-4 w-4" />
</Link>
```

### Revision Page Shell

```typescript
// src/app/revision/[projectId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectData {
  id: string;
  title: string;
  projectType: string;
  analysisData: Record<string, unknown> | null;
}

export default function RevisionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) setProject(await res.json());
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;

  if (!project?.analysisData) {
    return (
      <div className="text-center py-24">
        <p>Analysis not yet completed.</p>
        <Link href="/">Back to workspace</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold">{project.title}</h1>
      </div>

      {/* Placeholder sections -- downstream phases fill these */}
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Suggestion generation will appear here
        </CardContent>
      </Card>
    </div>
  );
}
```

### Branding Update

```typescript
// src/app/layout.tsx -- line 16
export const metadata: Metadata = {
  title: "Film Intern",
  description: "Filmmaking analysis tool",
};

// src/components/app-sidebar.tsx -- line 117
<h1 className="text-[28px] font-semibold text-foreground leading-[1.2] hidden xl:block">
  Film Intern
</h1>
<span className="text-foreground text-[28px] font-semibold xl:hidden block text-center">
  FI
</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router (`pages/`) | App Router (`app/`) | Next.js 13+ (2023) | Project already uses App Router -- new route follows same pattern |
| Client-side routing only | Server Components by default | Next.js 13+ | Revision page uses `'use client'` directive since it needs hooks -- consistent with all other pages in this project |

## Open Questions

1. **TopNav brand text format**
   - What we know: `app-topnav.tsx` already says "FilmIntern" (one word). `app-sidebar.tsx` says "Nano Banana" (two words). BRAND-01 says "Film Intern" (two words with space).
   - What's unclear: Should the topnav be changed to "Film Intern" (with space) for consistency?
   - Recommendation: Yes, update topnav to "Film Intern" (with space) for consistency with BRAND-01. This is a minor text change.

2. **Revision page layout width for future phases**
   - What we know: Current root layout constrains content to `max-w-[1100px]`. Phase 17 needs side-by-side diff views that may want more width.
   - What's unclear: Will 1100px be sufficient for Phase 17's tracked-changes UI?
   - Recommendation: Use existing layout for Phase 15 shell. Defer layout changes to Phase 17 if needed -- Next.js route groups allow per-section layouts.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVW-05 | Revision page renders at `/revision/[projectId]` with shell layout | unit | `npx vitest run src/app/revision/__tests__/page.test.tsx -t "renders shell"` | No -- Wave 0 |
| REVW-06 | Existing analysis workflow unchanged (main page.tsx unbroken) | unit | `npx vitest run src/app/__tests__/page.test.tsx` | Yes |
| BRAND-01 | Layout metadata title is "Film Intern", sidebar brand text is "Film Intern" | unit | `npx vitest run src/components/__tests__/branding.test.ts -t "Film Intern"` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/app/revision/__tests__/page.test.tsx` -- covers REVW-05 (revision page renders shell)
- [ ] `src/components/__tests__/branding.test.ts` -- covers BRAND-01 (app name is "Film Intern" in metadata and sidebar)
- [ ] Existing `src/app/__tests__/page.test.tsx` already covers REVW-06 (main page renders correctly)

## Sources

### Primary (HIGH confidence)

- Project source code -- direct grep and file reading of all relevant components
- `src/app/layout.tsx` -- root layout structure, metadata, navigation components
- `src/app/page.tsx` -- main analysis workflow, completed analysis UI
- `src/components/app-topnav.tsx` -- top navigation bar (already says "FilmIntern")
- `src/components/app-sidebar.tsx` -- sidebar with "Nano Banana" brand text
- `src/components/projects-sidebar.tsx` -- project list sidebar with context integration
- `src/contexts/workspace-context.tsx` -- workspace state model
- `package.json` -- dependency versions, project name already "filmintern"

### Secondary (MEDIUM confidence)

- Next.js App Router documentation -- filesystem routing conventions (well-known, stable pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing tools
- Architecture: HIGH -- follows exact patterns already in use (filesystem routing, client components, API fetch)
- Pitfalls: HIGH -- codebase fully audited, all branding locations verified via grep

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable -- no external dependencies or fast-moving APIs)
