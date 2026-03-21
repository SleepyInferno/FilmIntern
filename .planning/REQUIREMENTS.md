# Requirements: FilmIntern

**Defined:** 2026-03-21
**Core Value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## v3.0 Requirements

Requirements for the Script Improvement milestone. Each maps to roadmap phases.

### Suggestion Generation

- [ ] **SUGG-01**: User can trigger AI suggestion generation from a completed analysis
- [ ] **SUGG-02**: Suggestions target specific weaknesses flagged in the analysis (not generic rewrites)
- [ ] **SUGG-03**: Suggestions stream progressively as they're generated
- [ ] **SUGG-04**: User can set how many suggestions to generate (default ~10)
- [ ] **SUGG-05**: Suggestion generation works for all 4 project types (narrative, TV, documentary, corporate)
- [ ] **SUGG-06**: Generated suggestions are saved to the database linked to the analysis

### Review UI

- [ ] **REVW-01**: User can view each suggestion with the original block and proposed rewrite side-by-side
- [ ] **REVW-02**: User can accept or reject each suggestion individually
- [ ] **REVW-03**: Script preview updates live as user accepts/rejects suggestions
- [ ] **REVW-04**: User can request a new AI rewrite for any individual suggestion
- [ ] **REVW-05**: Suggestion review lives on a dedicated "Adjustments / Revision" page, separate from the existing analysis workspace
- [ ] **REVW-06**: Existing analysis workflow is unchanged — the new page is additive only

### Script Export

- [ ] **EXPRT-01**: User can export the revised script (accepted suggestions applied) as PDF
- [ ] **EXPRT-02**: User can export the revised script as DOCX
- [ ] **EXPRT-03**: User can export the revised script as FDX (Final Draft)
- [ ] **EXPRT-04**: User can export the revised script as plain text (.txt)

### Branding

- [ ] **BRAND-01**: App name is updated from "Nano Banana" to "Film Intern" across all pages, titles, and metadata

## Future Requirements

*(None identified — scope is well-bounded for v3.0)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Inline editing of the script directly | Analysis tool, not a script editor — suggestions are AI-generated only |
| Collaboration / sharing revised scripts | Personal tool, single user |
| Version history of revisions | Out of scope for v3.0 — can revisit if needed |
| AI suggestions without a prior analysis | Suggestions are grounded in analysis findings; standalone rewrites would be generic |

## Traceability

*(Populated during roadmap creation)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| SUGG-01 | — | Pending |
| SUGG-02 | — | Pending |
| SUGG-03 | — | Pending |
| SUGG-04 | — | Pending |
| SUGG-05 | — | Pending |
| SUGG-06 | — | Pending |
| REVW-01 | — | Pending |
| REVW-02 | — | Pending |
| REVW-03 | — | Pending |
| REVW-04 | — | Pending |
| REVW-05 | — | Pending |
| REVW-06 | — | Pending |
| EXPRT-01 | — | Pending |
| EXPRT-02 | — | Pending |
| EXPRT-03 | — | Pending |
| EXPRT-04 | — | Pending |
| BRAND-01 | — | Pending |

**Coverage:**
- v3.0 requirements: 17 total (15 feature + 2 clarified from scoping)
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after initial definition*
