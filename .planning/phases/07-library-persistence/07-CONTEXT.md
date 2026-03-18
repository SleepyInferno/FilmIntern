# Phase 7: Library & Persistence - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-save analyses to SQLite immediately after streaming completes, and add a project type filter to the existing Projects sidebar so users can browse, filter, open, and delete saved analyses. No new Library page — the sidebar IS the Library. Opening a saved analysis loads it into the main workspace.

</domain>

<decisions>
## Implementation Decisions

### Storage Backend
- Use the **existing SQLite persistence layer** (`src/lib/db.ts`) — not IndexedDB
- LIB-01's "IndexedDB" requirement is superseded by the already-in-place SQLite infrastructure
- Auto-save calls the existing `saveAnalysis()` / `updateProject()` functions at the right trigger points

### Auto-Save Trigger
- **Primary trigger**: auto-save fires when streaming ends (`isStreaming` transitions from true to false) and `analysisData` is non-null
- **Secondary trigger**: update the saved record whenever the user generates a new document (treatment, outline, etc.) — keeps the Library record always current
- **Re-analysis**: overwrite the existing record — same project ID, `updateProject()` called. No duplicate entries.
- **Silent save**: no user-visible indicator — no toast, no status message. Saves silently in the background.

### Library UI (Projects Sidebar Enhancement)
- The existing `ProjectsSidebar` component IS the Library — no new `/library` route needed
- Add a **project type filter** to the top of the sidebar panel — a narrow left panel with checkboxes per type (All checked by default)
- Filter checkboxes: All | Narrative | Documentary | Corporate | TV/Episodic | Short-Form
- Sidebar list items already show: project type icon + title + time-ago — keep this layout as-is
- Delete button behavior stays as-is (already implemented)

### Opening from Library
- Clicking a project in the sidebar loads it into the main workspace — existing `loadProject()` behavior
- State to restore: `analysisData`, `reportDocument`, `title`, `projectType` — the core workspace state
- Upload data and generated documents do not need to be restored in this phase
- Workspace renders the full card-based workspace once `analysisData` is loaded

### Claude's Discretion
- Exact visual styling of the filter checkbox panel within the sidebar
- Whether "All" is a checkbox or a reset button
- Filter state persistence (localStorage or session-only — choose what's simpler)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §LIB-01 through LIB-04 — Library requirements (note: IndexedDB spec superseded by existing SQLite layer)
- `.planning/PROJECT.md` — Milestone v1.1 goals and product principles

### Existing persistence layer
- `src/lib/db.ts` — SQLite CRUD API: `listProjects`, `createProject`, `getProject`, `updateProject`, `deleteProject`
- `src/app/api/projects/` — Existing API routes for project CRUD (agents should confirm route structure)
- `src/contexts/workspace-context.tsx` — WorkspaceContext: `saveAnalysis`, `loadProject`, `isAnalyzing`, `isStreaming`, `analysisData` — where auto-save logic gets added

### Existing Library component
- `src/components/projects-sidebar.tsx` — Current sidebar: lists projects from `/api/projects`, handles open/delete. Phase 7 adds type filter here.
- `src/components/app-sidebar.tsx` — Nav sidebar with icon links — no changes needed

### Phase 6 decisions (carry forward)
- `.planning/phases/06-card-based-analysis-workspaces/06-CONTEXT.md` — Workspace card components, streaming props pattern, badge conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db.ts`: Full CRUD already implemented — `listProjects` (sorted by updatedAt DESC), `updateProject` (partial fields), `deleteProject`. Auto-save is just calling these at the right moment.
- `src/components/projects-sidebar.tsx`: Already handles project listing, open, delete, and time-ago display. Needs filter UI added at top.
- `src/contexts/workspace-context.tsx`: Has `saveAnalysis` function (currently manual) — auto-save makes this fire automatically on stream end.
- `src/components/ui/card.tsx`: Available for Library card grid if needed (not used — sidebar list stays as-is).

### Established Patterns
- Streaming detection: `isStreaming: boolean` prop already flows through the workspace. Auto-save watches this via `useEffect`.
- Project persistence: projects table already stores `analysisData`, `reportDocument`, `title`, `projectType`, `fileName`, `createdAt`, `updatedAt`.
- Sidebar fetch pattern: `ProjectsSidebar` already calls `fetchProjects()` via `useCallback` and re-fetches when `currentProjectId` changes.

### Integration Points
- `workspace-context.tsx`: Add `useEffect` watching `isStreaming` — when it transitions to `false` and `analysisData` is non-null, call `saveAnalysis()` automatically.
- `workspace-context.tsx`: `saveGeneratedDocuments` (or the update path) — already called when generating docs; ensure it calls `updateProject` to keep Library record current.
- `projects-sidebar.tsx`: Add filter state + checkbox UI above the existing project list.

</code_context>

<specifics>
## Specific Ideas

- Filter panel in sidebar: checkboxes stacked vertically, one per project type. "All" at top resets selection. Compact — matches the sidebar's narrow width.
- Auto-save is invisible to the user — no feedback, no toast. It just happens.

</specifics>

<deferred>
## Deferred Ideas

- **Harsh critic mode for narrative analysis** — A toggle to run a second, very critical analysis pass on narrative scripts (alternative to standard analysis). New analysis capability — its own phase.
- LIB-05: Full-text search within Library — deferred (date+type filter sufficient for v1.1)
- LIB-06: Rename saved analysis — deferred
- LIB-07: Export all analyses as backup — deferred

</deferred>

---

*Phase: 07-library-persistence*
*Context gathered: 2026-03-18*
