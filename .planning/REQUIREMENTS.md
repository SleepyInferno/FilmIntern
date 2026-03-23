# Requirements: FilmIntern

**Defined:** 2026-03-21
**Core Value:** Upload your material, pick your project type, get a structured analysis back — one tool that replaces hours of manual review across scattered apps.

## v3.0 Requirements

Requirements for the Script Improvement milestone. Each maps to roadmap phases.

### Suggestion Generation

- [x] **SUGG-01**: User can trigger AI suggestion generation from a completed analysis
- [x] **SUGG-02**: Suggestions target specific weaknesses flagged in the analysis (not generic rewrites)
- [x] **SUGG-03**: Suggestions stream progressively as they're generated
- [x] **SUGG-04**: User can set how many suggestions to generate (default ~10)
- [x] **SUGG-05**: Suggestion generation works for all 4 project types (narrative, TV, documentary, corporate)
- [x] **SUGG-06**: Generated suggestions are saved to the database linked to the analysis

### Review UI

- [x] **REVW-01**: User can view each suggestion with the original block and proposed rewrite side-by-side
- [x] **REVW-02**: User can accept or reject each suggestion individually
- [x] **REVW-03**: Script preview updates live as user accepts/rejects suggestions
- [x] **REVW-04**: User can request a new AI rewrite for any individual suggestion
- [x] **REVW-05**: Suggestion review lives on a dedicated "Adjustments / Revision" page, separate from the existing analysis workspace
- [x] **REVW-06**: Existing analysis workflow is unchanged — the new page is additive only

### Script Export

- [ ] **EXPRT-01**: User can export the revised script as PDF
- [ ] **EXPRT-02**: User can export the revised script as DOCX
- [ ] **EXPRT-03**: User can export the revised script as FDX (Final Draft)
- [ ] **EXPRT-04**: User can export the revised script as plain text (.txt)

### Branding

- [x] **BRAND-01**: App name is updated from "Nano Banana" to "Film Intern" across all pages, titles, and metadata

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

| Requirement | Phase | Status |
|-------------|-------|--------|
| REVW-05 | Phase 15 | Complete |
| REVW-06 | Phase 15 | Complete |
| BRAND-01 | Phase 15 | Complete |
| SUGG-01 | Phase 16 | Complete |
| SUGG-02 | Phase 16 | Complete |
| SUGG-03 | Phase 16 | Complete |
| SUGG-04 | Phase 16 | Complete |
| SUGG-05 | Phase 16 | Complete |
| SUGG-06 | Phase 16 | Complete |
| REVW-01 | Phase 17 | Complete |
| REVW-02 | Phase 17 | Complete |
| REVW-03 | Phase 17 | Complete |
| REVW-04 | Phase 17 | Complete |
| EXPRT-01 | Phase 18 | Pending |
| EXPRT-02 | Phase 18 | Pending |
| EXPRT-03 | Phase 18 | Pending |
| EXPRT-04 | Phase 18 | Pending |

**Coverage:**
- v3.0 requirements: 17 total
- Mapped to phases: 17/17
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap revision*
