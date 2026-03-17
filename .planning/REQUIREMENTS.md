# Requirements: FilmIntern

**Defined:** 2026-03-16
**Core Value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## v1 Requirements

### Core Workflow

- [x] **CORE-01**: User can select a project type from the available options before uploading material
- [x] **CORE-02**: User can upload a file via drag & drop or file picker
- [x] **CORE-03**: App displays a parsed content preview before analysis runs so user can verify parsing quality
- [x] **CORE-04**: User can trigger an analysis run after upload
- [x] **CORE-05**: User can view structured analysis results on screen

### File Parsing

- [x] **PARSE-01**: App parses plain text (.txt) files
- [x] **PARSE-02**: App parses PDF files with structure-preserving extraction (handles screenplay formatting)
- [x] **PARSE-03**: App parses Final Draft (.fdx) files preserving scene headings, character names, and dialogue structure
- [x] **PARSE-04**: App parses Word/DOCX files

### Analysis — Documentary & Corporate Interview

- [x] **ANLYS-01**: Documentary projects receive interview mining analysis: best quotes, recurring themes, and key moments surfaced from transcript
- [x] **ANLYS-02**: Corporate interview projects receive key messaging analysis: usable soundbites, quote extraction, and messaging themes

### Analysis — Narrative Film & TV/Episodic

- [x] **ANLYS-03**: Narrative film projects receive story structure analysis: act breaks, turning points, pacing evaluation, and arc assessment
- [x] **ANLYS-04**: Narrative film projects receive script coverage: character analysis, conflict assessment, dialogue quality, and marketability notes
- [x] **ANLYS-05**: TV/episodic projects receive episode arc and series structure analysis

### Analysis — Short-form & Branded

- [x] **ANLYS-06**: Short-form/branded projects receive tailored analysis: pacing, messaging effectiveness, and CTA clarity

### Outputs

- [x] **OUTP-01**: User receives a structured analysis report formatted appropriately for the project type
- [x] **OUTP-02**: User can download the analysis report as a formatted document (PDF or DOCX)
- [x] **OUTP-03**: App can generate a treatment or narrative outline from uploaded material

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
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| PARSE-01 | Phase 1 | Complete |
| PARSE-02 | Phase 2 | Complete |
| PARSE-03 | Phase 2 | Complete |
| PARSE-04 | Phase 2 | Complete |
| ANLYS-01 | Phase 1 | Complete |
| ANLYS-02 | Phase 3 | Complete |
| ANLYS-03 | Phase 3 | Complete |
| ANLYS-04 | Phase 3 | Complete |
| ANLYS-05 | Phase 3 | Complete |
| ANLYS-06 | Phase 3 | Complete |
| OUTP-01 | Phase 1 | Complete |
| OUTP-02 | Phase 4 | Complete |
| OUTP-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
