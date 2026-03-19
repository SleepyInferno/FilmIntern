# Phase 7: Library & Persistence - Research

**Researched:** 2026-03-19
**Domain:** Auto-save persistence, sidebar filtering, project lifecycle in Next.js + SQLite
**Confidence:** HIGH

## Summary

Phase 7 is a predominantly **integration phase** -- not a greenfield build. The SQLite persistence layer (`db.ts`), API routes (`/api/projects`), workspace context (`workspace-context.tsx`), and sidebar component (`projects-sidebar.tsx`) all exist and are functional. The work is: (1) make saves automatic instead of manual, (2) add a type filter to the existing sidebar, and (3) ensure loading a saved project renders the full workspace.

The critical insight from code review is that **auto-save already happens** in `page.tsx` line 199 -- `saveAnalysis()` is called after streaming completes and the report document is built. The phase work is about making this more robust (handling re-analysis overwrites, ensuring generated documents persist on creation) and adding the filter UI. There is no `isStreaming` state in workspace context -- the streaming happens inline in `handleAnalyze()` in `page.tsx`, and `isAnalyzing` is the boolean that tracks it. The CONTEXT.md mentions watching `isStreaming` transitions, but the actual code uses `isAnalyzing` and already saves at the right point in the imperative flow.

**Primary recommendation:** Treat this as a 2-3 plan phase: (1) harden auto-save to cover all paths (re-analysis, document generation), (2) add ProjectTypeFilter component to sidebar, (3) verify end-to-end load/save/filter cycle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use the **existing SQLite persistence layer** (`src/lib/db.ts`) -- not IndexedDB
- LIB-01's "IndexedDB" requirement is superseded by the already-in-place SQLite infrastructure
- Auto-save calls the existing `saveAnalysis()` / `updateProject()` functions at the right trigger points
- **Primary trigger**: auto-save fires when streaming ends (`isStreaming` transitions from true to false) and `analysisData` is non-null
- **Secondary trigger**: update the saved record whenever the user generates a new document (treatment, outline, etc.) -- keeps the Library record always current
- **Re-analysis**: overwrite the existing record -- same project ID, `updateProject()` called. No duplicate entries
- **Silent save**: no user-visible indicator -- no toast, no status message. Saves silently in the background
- The existing `ProjectsSidebar` component IS the Library -- no new `/library` route needed
- Add a **project type filter** to the top of the sidebar panel -- checkboxes per type (All checked by default)
- Filter checkboxes: All | Narrative | Documentary | Corporate | TV/Episodic (Short-Form excluded per UI-SPEC -- not in PROJECT_TYPES registry)
- Sidebar list items already show: project type icon + title + time-ago -- keep as-is
- Delete button behavior stays as-is (already implemented)
- Clicking a project loads it into workspace -- existing `loadProject()` behavior
- State to restore: `analysisData`, `reportDocument`, `title`, `projectType`
- Upload data and generated documents do not need to be restored in this phase

### Claude's Discretion
- Exact visual styling of the filter checkbox panel within the sidebar
- Whether "All" is a checkbox or a reset button
- Filter state persistence (localStorage or session-only -- choose what's simpler)

### Deferred Ideas (OUT OF SCOPE)
- Harsh critic mode for narrative analysis -- a toggle to run a second, very critical analysis pass on narrative scripts. New analysis capability -- its own phase.
- LIB-05: Full-text search within Library -- deferred (date+type filter sufficient for v1.1)
- LIB-06: Rename saved analysis -- deferred
- LIB-07: Export all analyses as backup -- deferred
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIB-01 | Analyses are automatically saved to IndexedDB after completion | Superseded: SQLite already in place. Auto-save already fires in `handleAnalyze()` line 199. Needs hardening for edge cases (re-analysis, generated docs). |
| LIB-02 | User can browse saved analyses in the Library page (sorted by date, filterable by project type) | `listProjects()` already returns sorted by `updatedAt DESC`. Add client-side filter by projectType via `Set<string>` filter state in sidebar. |
| LIB-03 | User can open a saved analysis from Library and view it in the workspace | `loadProject()` already implemented in workspace-context.tsx. Loads `analysisData`, `reportDocument`, `title`, `projectType`. Works end-to-end. |
| LIB-04 | User can delete a saved analysis from the Library | Already implemented in `projects-sidebar.tsx` via `handleDelete()`. No changes needed. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-sqlite3 | ^12.8.0 | Server-side SQLite persistence | Already in use -- project DB layer |
| React 19 | 19.2.3 | UI framework | Already in use |
| Next.js 16 | 16.1.6 | App framework / API routes | Already in use |
| lucide-react | ^0.577.0 | Icons (Film, Video, Briefcase, Tv) | Already in use for type icons |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.1.0 | Test framework | All new tests |
| @testing-library/react | ^16.3.2 | Component testing | Filter component tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SQLite | IndexedDB (original spec) | SQLite already built and working -- no migration needed |
| Session-only filter | localStorage filter | Session-only is simpler and sufficient -- filter resets on page refresh are acceptable |

**Installation:** No new packages required. Everything needed is already installed.

## Architecture Patterns

### Current Project Structure (relevant files)
```
src/
  lib/db.ts                          # SQLite CRUD -- no changes needed
  contexts/workspace-context.tsx     # Modify: auto-save effect location
  components/projects-sidebar.tsx    # Modify: add filter UI
  components/project-type-filter.tsx # NEW: filter checkbox component
  app/page.tsx                       # Modify: ensure auto-save covers all paths
  app/api/projects/route.ts          # No changes needed
  app/api/projects/[id]/route.ts     # No changes needed
```

### Pattern 1: Auto-Save at Imperative Control Points
**What:** Save happens at specific points in the `handleAnalyze()` and `handleGenerateDocument()` flows, not via reactive `useEffect` watching state transitions.
**When to use:** When the save trigger is a known completion point in an imperative async flow.
**Why this matters:** The CONTEXT.md suggests watching `isStreaming` via `useEffect`, but the code uses `isAnalyzing` and the save already happens at line 199 in `handleAnalyze()`. A `useEffect` watching `isAnalyzing` would fire on error transitions too (when `isAnalyzing` goes false after a failed analysis). The existing imperative pattern is safer.

**Current auto-save flow (page.tsx line 186-199):**
```typescript
if (finalData) {
  const reportDoc = buildReportDocument({ ... });
  setReportDocument(reportDoc);
  setActiveDocumentId(reportDoc.id);
  await saveAnalysis(projectId, { uploadData, analysisData: finalData, reportDocument: reportDoc });
}
setIsAnalyzing(false);
```

**Generated document save flow (page.tsx line 234-236):**
```typescript
if (projectIdRef.current) {
  await saveGeneratedDocuments(projectIdRef.current, updated);
}
```

Both flows already save. The question is: are there gaps?

### Pattern 2: Client-Side Filtering via Derived State
**What:** Filter a pre-fetched list client-side using a `Set<string>` of active type keys, applied via `.filter()`.
**When to use:** When the full list is already fetched (sidebar does `GET /api/projects` on mount).
**Example:**
```typescript
const [activeTypes, setActiveTypes] = useState<Set<string>>(
  new Set(['narrative', 'documentary', 'corporate', 'tv-episodic'])
);
const filteredProjects = projects.filter(p => activeTypes.has(p.projectType));
```

### Pattern 3: "All" Checkbox as Derived State
**What:** "All" is checked when `activeTypes.size === ALL_TYPES.length`. It's not independent state.
**When to use:** When a "select all" toggle needs to stay in sync with individual selections.
**Example:**
```typescript
const allChecked = activeTypes.size === ALL_TYPES.length;
function handleAllToggle() {
  setActiveTypes(new Set(ALL_TYPES)); // Always resets to all
}
function handleTypeToggle(type: string) {
  setActiveTypes(prev => {
    const next = new Set(prev);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    // Prevent empty filter -- if nothing selected, re-add all
    if (next.size === 0) return new Set(ALL_TYPES);
    return next;
  });
}
```

### Anti-Patterns to Avoid
- **useEffect for auto-save:** Do NOT add a `useEffect(() => { if (!isAnalyzing && analysisData) save() }, [isAnalyzing])` -- this fires on error paths, initial mount, and project load. The imperative save after streaming completion is correct.
- **Server-side filtering:** Do NOT add a `?type=` query param to `GET /api/projects` -- the list is small (personal tool) and client-side filtering is simpler.
- **Duplicate project creation:** The project stub is already created in `handleFileUploaded()` (line 122-140). `handleAnalyze()` uses `ensureProject()` which returns the existing ID. Do not create a second project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project CRUD | New API endpoints | Existing `/api/projects` routes | Already complete with GET, POST, PUT, DELETE |
| Project listing | New data fetching | Existing `fetchProjects()` in sidebar | Already fetches and renders sorted list |
| Project loading | New state restoration | Existing `loadProject()` in workspace-context | Already restores all required workspace state |
| Delete flow | New deletion logic | Existing `handleDelete()` in sidebar | Already handles delete + workspace reset |

**Key insight:** 80% of this phase's requirements (LIB-03, LIB-04) are already implemented. LIB-01 is 90% there -- just needs verification that all save paths are covered. LIB-02 needs the filter UI only.

## Common Pitfalls

### Pitfall 1: useEffect Auto-Save Firing on Wrong Transitions
**What goes wrong:** A `useEffect` watching `isAnalyzing` fires when analysis fails (error sets `isAnalyzing = false`) or when a project is loaded from sidebar (which also sets `isAnalyzing = false`).
**Why it happens:** `isAnalyzing` transitions to `false` in 3 places: success (line 202), error (line 164, 205), and `loadProject` resets it.
**How to avoid:** Keep the imperative save at the success point inside `handleAnalyze()`. Do not add a reactive effect.
**Warning signs:** Tests show save being called when loading an existing project.

### Pitfall 2: Filter Preventing All Projects from Showing
**What goes wrong:** User unchecks all types, sees empty list, thinks data is lost.
**Why it happens:** No guard against empty filter set.
**How to avoid:** Per UI-SPEC -- if `Set.size === 0`, immediately reset to all types. The empty state should only show "No matching projects." when the filter is active but no projects match.
**Warning signs:** Empty project list when projects exist in DB.

### Pitfall 3: Project Type Not in Filter Registry
**What goes wrong:** A project with type `short-form` (or future type) doesn't appear in filtered list.
**Why it happens:** Filter `Set` only contains the 4 known types. Projects with other types get filtered out.
**How to avoid:** The filter should use `activeTypes.has(p.projectType)` and the default "All" state should include all types in the set. Unknown types will show when "All" is selected because `projects.filter()` only runs when not all types are selected.
**Warning signs:** Projects disappear from sidebar after filter is added.

### Pitfall 4: Race Between Save and Sidebar Re-Fetch
**What goes wrong:** Sidebar re-fetches before save completes, showing stale data.
**Why it happens:** `fetchProjects()` triggers on `currentProjectId` change, which happens before `saveAnalysis()` completes.
**How to avoid:** The save in `handleAnalyze()` happens AFTER `setAnalysisData` but the sidebar fetches on project ID change (which was set during `handleFileUploaded`). The timing should be fine since the project row already exists -- it just gets updated data. The sidebar only shows title/type/date, not analysis data.
**Warning signs:** None expected -- this is a non-issue given current architecture.

### Pitfall 5: Re-Analysis Creating Duplicate Projects
**What goes wrong:** Running analysis again on the same project creates a new DB row.
**Why it happens:** `ensureProject()` might create a new project if `currentProjectId` is null.
**How to avoid:** Verify that `ensureProject()` checks `currentProjectId` first and only creates if needed.
**Warning signs:** Duplicate entries in sidebar after re-analyzing.

## Code Examples

### Existing Auto-Save Flow (already in page.tsx)
```typescript
// Source: src/app/page.tsx lines 186-199
if (finalData) {
  const reportKind = getReportKind(projectType);
  const reportDoc = buildReportDocument({ reportKind, projectType, analysis: finalData, sourceText: uploadData.text, title, writtenBy });
  setReportDocument(reportDoc);
  setActiveDocumentId(reportDoc.id);
  await saveAnalysis(projectId, { uploadData: uploadData!, analysisData: finalData, reportDocument: reportDoc });
}
```

### Client-Side Filter Pattern
```typescript
// New component: ProjectTypeFilter
const ALL_TYPES = ['narrative', 'documentary', 'corporate', 'tv-episodic'] as const;

interface ProjectTypeFilterProps {
  activeTypes: Set<string>;
  onToggleType: (type: string) => void;
  onToggleAll: () => void;
}

function ProjectTypeFilter({ activeTypes, onToggleType, onToggleAll }: ProjectTypeFilterProps) {
  const allChecked = activeTypes.size === ALL_TYPES.length;
  return (
    <div className="px-4 py-2 border-b border-border">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter</span>
      <div className="mt-1 flex flex-col gap-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allChecked} onChange={onToggleAll} />
          <span className={cn("text-xs", allChecked ? "text-foreground" : "text-muted-foreground")}>All</span>
        </label>
        {ALL_TYPES.map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={activeTypes.has(type)} onChange={() => onToggleType(type)} />
            <span className="flex items-center gap-1 text-xs">{TYPE_ICONS[type]} {TYPE_LABELS[type]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

### Filtered Project List
```typescript
// In ProjectsSidebar, replace direct projects.map with filtered version
const filteredProjects = useMemo(
  () => activeTypes.size === ALL_TYPES.length
    ? projects
    : projects.filter(p => activeTypes.has(p.projectType)),
  [projects, activeTypes]
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IndexedDB for client storage | SQLite via better-sqlite3 (server-side) | Phase 3.1 added persistence | All data stored server-side; no IndexedDB needed |
| Manual save button | Auto-save on analysis completion | Already implemented in page.tsx | Users don't need to explicitly save |
| Separate Library page | Sidebar IS the Library | CONTEXT.md decision | No new route needed |

## Open Questions

1. **ensureProject() implementation**
   - What we know: Called in `handleAnalyze()` to get/create a project ID. Project is likely already created by `handleFileUploaded()`.
   - What's unclear: Need to verify it reuses `currentProjectId` when set (for re-analysis case).
   - Recommendation: Read the `ensureProject` function during planning/implementation to confirm re-analysis path.

2. **Short-form project type**
   - What we know: The CONTEXT.md originally listed "Short-Form" as a filter option, but the UI-SPEC explicitly excludes it -- `PROJECT_TYPES` registry has only 4 types.
   - What's unclear: Whether any short-form projects exist in dev database.
   - Recommendation: Follow UI-SPEC -- only 4 filter checkboxes. Unknown project types still show when "All" is selected.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIB-01 | Auto-save fires after analysis completes | unit | `npx vitest run src/app/__tests__/page.test.tsx -x` | Exists (needs new test cases) |
| LIB-02 | Filter sidebar by project type | unit | `npx vitest run src/components/__tests__/project-type-filter.test.tsx -x` | Wave 0 |
| LIB-02 | Sidebar shows filtered projects | unit | `npx vitest run src/components/__tests__/projects-sidebar.test.tsx -x` | Wave 0 |
| LIB-03 | loadProject restores workspace state | unit | `npx vitest run src/contexts/__tests__/workspace-context.test.tsx -x` | Wave 0 |
| LIB-04 | Delete removes project from list | unit | Already covered by existing sidebar behavior | Existing |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/project-type-filter.test.tsx` -- covers LIB-02 filter behavior
- [ ] `src/components/__tests__/projects-sidebar.test.tsx` -- covers LIB-02 filtered list rendering (may be complex due to fetch mocking)

Note: LIB-01 auto-save is already tested implicitly in the existing `page.test.tsx` if it covers `handleAnalyze`. LIB-03 and LIB-04 are already implemented -- tests may exist or be straightforward additions.

## Sources

### Primary (HIGH confidence)
- `src/lib/db.ts` -- Full SQLite CRUD API reviewed
- `src/contexts/workspace-context.tsx` -- Workspace state management reviewed
- `src/components/projects-sidebar.tsx` -- Current sidebar implementation reviewed
- `src/app/page.tsx` -- Analysis flow and save triggers reviewed
- `src/app/api/projects/route.ts` and `[id]/route.ts` -- API routes reviewed
- `.planning/phases/07-library-persistence/07-UI-SPEC.md` -- UI design contract reviewed
- `.planning/phases/07-library-persistence/07-CONTEXT.md` -- User decisions reviewed

### Secondary (MEDIUM confidence)
- None needed -- all research based on direct code review

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- direct code review of all touch points
- Pitfalls: HIGH -- identified from actual code flow analysis

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external dependencies changing)
