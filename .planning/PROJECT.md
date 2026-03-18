# FilmIntern

## What This Is

A personal filmmaking workflow web app that lets you select a project type (documentary, narrative film, short-form/branded, TV/episodic, or corporate interview), upload a transcript or script/screenplay, and receive a structured AI analysis report tailored to that project type. Built to replace a scattered multi-tool workflow and serve as a second set of eyes on your own work.

## Core Value

Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## Current Milestone: v1.1 UI and Formatting

**Goal:** Redesign the full app UI with dark/light theme toggle and replace flat report output with card-based analysis workspaces unique to each project type, plus a Library for saved analyses.

**Target features:**
- Light/dark theme toggle with orange/amber brand accents throughout
- Card-based analysis workspace for all 5 project types (unique evaluation dimensions per type)
- Narrative "Story Lab Workspace" with 8 evaluation dimension cards
- Library page for browsing and managing saved analyses

## Requirements

### Validated

- ✓ User can select a project type before uploading material — v1.0
- ✓ User can upload a transcript or script depending on project type — v1.0
- ✓ App runs AI analysis tailored to the selected project type — v1.0
- ✓ User receives a structured analysis report as output — v1.0
- ✓ Documentary/corporate interview projects get interview mining — v1.0
- ✓ Narrative film/TV projects get story structure analysis — v1.0
- ✓ Narrative film projects get script coverage — v1.0
- ✓ Short-form/branded projects get appropriate tailored analysis — v1.0
- ✓ User can generate reformatted documents (treatments, outlines) — v1.0
- ✓ User can generate production planning outputs (shot lists, schedules) — v1.0

### Active

- [ ] User can toggle between light and dark theme
- [ ] App uses consistent brand color system (orange/amber accents)
- [ ] Narrative analysis displays as Story Lab Workspace with 8 evaluation dimension cards
- [ ] Documentary analysis displays with interview-specific evaluation cards
- [ ] Corporate interview analysis displays with messaging-specific evaluation cards
- [ ] TV/Episodic analysis displays with episode/series evaluation cards
- [ ] Short-form/branded analysis displays with pacing/messaging evaluation cards
- [ ] User can view a list of saved analyses in the Library
- [ ] User can open a saved analysis from the Library
- [ ] User can delete a saved analysis from the Library
- [ ] Analyses are automatically saved after completion

### Out of Scope

- Multi-user collaboration — personal tool first
- Mobile app — web-first
- Real-time co-editing — not needed for this workflow

## Context

- Built for a filmmaker's personal workflow — not a SaaS product (no multi-tenancy, accounts for others, etc. in v1)
- Primary pain: scattered tools (Word, Notes, email) with no connecting workflow, plus manual transcript reading is slow
- The "another set of eyes" framing matters — outputs should feel like structured professional feedback, not raw AI output
- Project types drive everything: which file type is accepted, which analysis runs, which outputs are generated

## Constraints

- **Personal use**: Single-user tool — no auth complexity needed in v1
- **File types**: Must handle transcript text files and screenplay/script formats (PDF, Final Draft, plain text)
- **AI integration**: Analysis quality depends on prompt design per project type — this is core IP of the tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Project type drives analysis | Different project types need fundamentally different analysis — one-size-fits-all produces mediocre output | — Pending |
| Personal tool (no multi-user) | Reduces scope significantly for v1 — can add later if needed | — Pending |

---
*Last updated: 2026-03-17 after milestone v1.1 start*
