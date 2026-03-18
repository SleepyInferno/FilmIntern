---
phase: 06-card-based-analysis-workspaces
plan: 05
status: complete
completed: 2026-03-18
---

# 06-05 Summary: Workspace Wiring + Project Persistence UX

## What Was Built

- All 4 workspace types (narrative, documentary, corporate, tv-episodic) wired into `page.tsx` streaming phase and `DocumentWorkspace` Report tab via `WorkspaceForType` helper
- SQLite project persistence via `better-sqlite3` (`src/lib/db.ts`)
- Project API routes: `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/[id]`
- Projects sidebar: always visible, stable re-fetch, "+" disabled while creating, spinner indicator
- New project creation flow: file drop creates DB stub immediately with `uploadData` persisted — clicking project in sidebar restores full state (name, type, file preview)
- Dropzone hidden after initial upload — no re-upload on same project
- Nested button fix: sidebar project rows changed to `div[role=button]`
- Short-form/branded project type removed entirely

## Decisions

- `isNewProjectMode` in context — sidebar needs shared state to disable "+" and show spinner
- Project stub created + `uploadData` saved on file drop — ensures sidebar restore works before analysis runs
- Dropzone hidden post-upload — prevents accidental replacement of uploaded file
- better-sqlite3 over Prisma — simpler for local single-user tool
- Sidebar in root layout — always visible across all pages

## Verification

- Human verified: project creation flow, sidebar stability, project restore on click
- TypeScript: clean (`npx tsc --noEmit` exits 0)
- Tests: 9 pre-existing failures, 188 passing (no regressions)
