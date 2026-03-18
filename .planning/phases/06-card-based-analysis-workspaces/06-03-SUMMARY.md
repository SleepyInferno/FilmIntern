---
phase: 06-card-based-analysis-workspaces
plan: "03"
subsystem: workspace-components
tags: [workspaces, narrative, documentary, evaluation-cards, tdd]
dependency_graph:
  requires: [06-01]
  provides: [NarrativeWorkspace, DocumentaryWorkspace]
  affects: [document-workspace, workspace-registry]
tech_stack:
  added: []
  patterns: [evaluation-card-composition, streaming-section-detection, optional-field-fallback]
key_files:
  created:
    - src/components/workspaces/narrative-workspace.tsx
    - src/components/workspaces/documentary-workspace.tsx
  modified:
    - src/components/workspaces/__tests__/narrative-workspace.test.tsx
    - src/components/workspaces/__tests__/documentary-workspace.test.tsx
decisions:
  - "Subject Profiles and Story Arc cards use ready=true when data is present (even partially) so fallback text renders inside EvaluationCard children instead of triggering the skeleton state"
  - "getMomentColor returns hex values matching globals.css token colors for key moment type dots"
  - "formatBeatName moved from narrative-report.tsx into narrative-workspace.tsx as a local helper"
metrics:
  duration: "4 min"
  completed: "2026-03-18"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 06 Plan 03: Narrative and Documentary Workspaces Summary

NarrativeWorkspace (8-card Story Lab) and DocumentaryWorkspace (6-card) with interactive beats, character truncation, key-moment type colors, and streaming skeleton support.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build NarrativeWorkspace with 8 evaluation cards | 48e95ca | narrative-workspace.tsx, narrative-workspace.test.tsx |
| 2 | Build DocumentaryWorkspace with 6 evaluation cards | 7e4ef02 | documentary-workspace.tsx, documentary-workspace.test.tsx |

## What Was Built

### NarrativeWorkspace (`src/components/workspaces/narrative-workspace.tsx`)

8 EvaluationCards in a WorkspaceGrid:
1. **Logline & Premise** - logline quality badge, suggested logline quote, commercial viability badge
2. **Story Structure** (md:col-span-2) - clickable beat rows with ChevronRight/Down expand toggle, structural strengths/weaknesses grid
3. **Character Arcs** - top-3 truncation with ShowMoreToggle, per-character role badge + arc assessment + strengths/weaknesses
4. **Dialogue & Voice** - quality badge, strengths/weaknesses grid, notable lines as italic quotes
5. **Theme & Resonance** - central themes as outline badges, emotional resonance text, audience impact text
6. **Pacing & Tension** - pacing assessment text, tension arc text
7. **Genre & Comparables** - comp titles as outline badges, commercial viability badge, primary conflict + secondary list
8. **Development Recommendations** - numbered recommendation list, overall strengths/weaknesses grid with border-top

Key interactions: `expandedBeat: number | null` state drives beat row expand/collapse with ChevronRight rotating to ChevronDown. `showAllCharacters` drives ShowMoreToggle for character truncation.

### DocumentaryWorkspace (`src/components/workspaces/documentary-workspace.tsx`)

6 EvaluationCards:
1. **Key Quotes** - quote text in italic border-left block, speaker + usefulness badge per quote
2. **Recurring Themes** - theme name + frequency badge, description, evidence as italic quotes
3. **Key Moments** - colored type dot (hex via getMomentColor), moment text, significance, approximate location
4. **Subject Profiles** - name + quotability badge, role text, key contribution; fallback when undefined
5. **Story Arc** - assessment text, suggested structure, strengths/gaps grid; fallback when undefined
6. **Interview Gaps** - missing perspectives bulleted list, narrative threads bulleted list, suggested structure paragraph

Key detail: Subject Profiles and Story Arc optional fields show fallback text `"X not available for this analysis"` inside the card children (card marked ready when broader data is present) rather than triggering the skeleton loading state.

## Test Results

- `narrative-workspace.test.tsx`: 4/4 tests pass
- `documentary-workspace.test.tsx`: 4/4 tests pass
- Full workspace suite: 14 pass, 9 todo (pre-existing stubs in tv/corporate/short-form workspace tests)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed fallback text visibility for optional DocumentaryAnalysis fields**
- **Found during:** Task 2 verification
- **Issue:** EvaluationCard shows skeleton when `ready=false`, but the plan specified showing fallback text for `undefined` optional fields. With `ready={!!data?.subjectProfiles}`, an undefined field made the card show skeleton rather than the "not available" message.
- **Fix:** Changed readiness condition for Subject Profiles and Story Arc to `data !== null && (hasKeyField)` so the card renders children (which contain the conditional fallback text) when data is present at all.
- **Files modified:** src/components/workspaces/documentary-workspace.tsx
- **Commit:** 7e4ef02

## Self-Check: PASSED

- `src/components/workspaces/narrative-workspace.tsx` - EXISTS
- `src/components/workspaces/documentary-workspace.tsx` - EXISTS
- Commit 48e95ca - EXISTS (feat(06-03): build NarrativeWorkspace)
- Commit 7e4ef02 - EXISTS (feat(06-03): build DocumentaryWorkspace)
- All acceptance criteria met: 8 named cards in NarrativeWorkspace, 6 named cards in DocumentaryWorkspace, expandedBeat state, ShowMoreToggle, getMomentColor helper
