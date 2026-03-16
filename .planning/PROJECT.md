# FilmIntern

## What This Is

A personal filmmaking workflow web app that lets you select a project type (documentary, narrative film, short-form/branded, TV/episodic, or corporate interview), upload a transcript or script/screenplay, and receive a structured AI analysis report tailored to that project type. Built to replace a scattered multi-tool workflow and serve as a second set of eyes on your own work.

## Core Value

Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can select a project type before uploading material
- [ ] User can upload a transcript or script depending on project type
- [ ] App runs AI analysis tailored to the selected project type
- [ ] User receives a structured analysis report as output
- [ ] Documentary/corporate interview projects get interview mining (best quotes, themes, moments)
- [ ] Narrative film/TV projects get story structure analysis (act breaks, pacing, turning points)
- [ ] Narrative film projects get script coverage (character, conflict, dialogue, marketability)
- [ ] Short-form/branded projects get appropriate tailored analysis
- [ ] User can generate reformatted documents (treatments, outlines) from raw material
- [ ] User can generate production planning outputs (shot lists, schedules) from scripts

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
*Last updated: 2026-03-16 after initialization*
