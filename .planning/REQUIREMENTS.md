# Requirements: FilmIntern

**Defined:** 2026-03-16
**Core Value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## v1 Requirements

### Core Workflow

- [ ] **CORE-01**: User can select a project type from the available options before uploading material
- [ ] **CORE-02**: User can upload a file via drag & drop or file picker
- [ ] **CORE-03**: App displays a parsed content preview before analysis runs so user can verify parsing quality
- [ ] **CORE-04**: User can trigger an analysis run after upload
- [ ] **CORE-05**: User can view structured analysis results on screen

### File Parsing

- [ ] **PARSE-01**: App parses plain text (.txt) files
- [ ] **PARSE-02**: App parses PDF files with structure-preserving extraction (handles screenplay formatting)
- [ ] **PARSE-03**: App parses Final Draft (.fdx) files preserving scene headings, character names, and dialogue structure
- [ ] **PARSE-04**: App parses Word/DOCX files

### Analysis — Documentary & Corporate Interview

- [ ] **ANLYS-01**: Documentary projects receive interview mining analysis: best quotes, recurring themes, and key moments surfaced from transcript
- [ ] **ANLYS-02**: Corporate interview projects receive key messaging analysis: usable soundbites, quote extraction, and messaging themes

### Analysis — Narrative Film & TV/Episodic

- [ ] **ANLYS-03**: Narrative film projects receive story structure analysis: act breaks, turning points, pacing evaluation, and arc assessment
- [ ] **ANLYS-04**: Narrative film projects receive script coverage: character analysis, conflict assessment, dialogue quality, and marketability notes
- [ ] **ANLYS-05**: TV/episodic projects receive episode arc and series structure analysis

### Analysis — Short-form & Branded

- [ ] **ANLYS-06**: Short-form/branded projects receive tailored analysis: pacing, messaging effectiveness, and CTA clarity

### Outputs

- [ ] **OUTP-01**: User receives a structured analysis report formatted appropriately for the project type
- [ ] **OUTP-02**: User can download the analysis report as a formatted document (PDF or DOCX)
- [ ] **OUTP-03**: App can generate a treatment or narrative outline from uploaded material

## v2 Requirements

### Production Planning

- **PROD-01**: App generates shot list from a script or screenplay
- **PROD-02**: App generates a production schedule from a script

### History & Persistence

- **HIST-01**: User can view past analysis runs
- **HIST-02**: User can re-run analysis on a previously uploaded file
- **HIST-03**: App tracks estimated token cost per analysis run

### UX Enhancements

- **UX-01**: Analysis streams in real-time as it's generated
- **UX-02**: App displays pacing visualization / scene-length chart for narrative projects
- **UX-03**: User can annotate or add notes to analysis results

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / collaboration | Personal tool — not needed in v1 |
| Built-in transcription | Transcripts come pre-made; Descript/Otter handles this |
| AI rewriting / script editing | Analysis tool, not an editor — scope trap |
| OAuth / user accounts | Single user — no auth needed |
| Mobile app | Web-first |
| Real-time co-editing | Not relevant to personal workflow tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | — | Pending |
| CORE-02 | — | Pending |
| CORE-03 | — | Pending |
| CORE-04 | — | Pending |
| CORE-05 | — | Pending |
| PARSE-01 | — | Pending |
| PARSE-02 | — | Pending |
| PARSE-03 | — | Pending |
| PARSE-04 | — | Pending |
| ANLYS-01 | — | Pending |
| ANLYS-02 | — | Pending |
| ANLYS-03 | — | Pending |
| ANLYS-04 | — | Pending |
| ANLYS-05 | — | Pending |
| ANLYS-06 | — | Pending |
| OUTP-01 | — | Pending |
| OUTP-02 | — | Pending |
| OUTP-03 | — | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
