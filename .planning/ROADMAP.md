# Roadmap: FilmIntern

## Milestones

- [x] **v1.0 MVP** - Phases 1-9, 3.1 (shipped 2026-03-19)
- [x] **v2.0 Docker Containerization** - Phases 10-14 (shipped 2026-03-20)
- [ ] **v3.0 Script Improvement** - Phases 15-18 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-9, 3.1) - SHIPPED 2026-03-19</summary>

- [x] Phase 1: Vertical Slice (3/3 plans) - completed 2026-03-17
- [x] Phase 2: File Format Support (2/2 plans) - completed 2026-03-17
- [x] Phase 3: Analysis Expansion (3/3 plans) - completed 2026-03-17
- [x] Phase 3.1: Multi-Provider AI Support (3/3 plans) - completed 2026-03-17 (INSERTED)
- [x] Phase 4: Export and Document Generation (6/6 plans) - completed 2026-03-17
- [x] Phase 5: UI Theme & Brand System (2/2 plans) - completed 2026-03-18
- [x] Phase 6: Card-Based Analysis Workspaces (5/5 plans) - completed 2026-03-19
- [x] Phase 7: Library & Persistence (2/2 plans) - completed 2026-03-19
- [x] Phase 8: Provider Error Handling (1/1 plan) - completed 2026-03-19
- [x] Phase 9: Harsh Critic Analysis Mode (2/2 plans) - completed 2026-03-19

Archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v2.0 Docker Containerization (Phases 10-14) - SHIPPED 2026-03-20</summary>

- [x] Phase 10: Docker Build (2/2 plans) - completed 2026-03-19
- [x] Phase 11: Local Dev Environment (2/2 plans) - completed 2026-03-19
- [x] Phase 12: Production Deployment (1/1 plan) - completed 2026-03-19
- [x] Phase 13: CI/CD Pipeline (2/2 plans) - completed 2026-03-20
- [x] Phase 14: Documentation Cleanup (1/1 plan) - completed 2026-03-19

Archive: `.planning/milestones/v2.0-ROADMAP.md`

</details>

### v3.0 Script Improvement (In Progress)

**Milestone Goal:** After analysis runs, generate AI rewrite suggestions targeting flagged weaknesses -- reviewed accept/reject per suggestion -- then export the revised script in any format.

- [x] **Phase 15: Adjustments / Revision Page + Branding** - Page shell, navigation from analysis workspace, app rename to "Film Intern" (completed 2026-03-21)
- [ ] **Phase 16: Data Foundation + Suggestion Generation** - Schema, DB migration, FDX preservation, suggestion API, results displayed on revision page
- [ ] **Phase 17: Review UI** - Accept/reject per suggestion, live script preview, single-suggestion regeneration
- [ ] **Phase 18: Merge + Script Export** - Apply accepted suggestions, export revised script as PDF, DOCX, FDX, plain text

## Phase Details

### Phase 15: Adjustments / Revision Page + Branding
**Goal**: The dedicated page where all v3.0 feature work will live exists and is reachable, and the app identity is updated
**Depends on**: Phase 14 (v2.0 complete)
**Requirements**: REVW-05, REVW-06, BRAND-01
**Success Criteria** (what must be TRUE):
  1. User can navigate from a completed analysis workspace to a dedicated "Adjustments / Revision" page (separate route, not a tab in the existing workspace)
  2. The revision page loads with a shell layout ready for content (placeholder states are fine -- downstream phases fill it in)
  3. Existing analysis workflow (upload, analyze, view workspace, export report) is completely unchanged -- the new page is additive only
  4. App name reads "Film Intern" everywhere (page titles, headers, navigation, metadata) -- "Nano Banana" is gone
**Plans:** 2/2 plans complete
Plans:
- [ ] 15-01-PLAN.md -- Rename branding from "Nano Banana" to "Film Intern" across all UI
- [ ] 15-02-PLAN.md -- Create revision page shell and workspace navigation link

### Phase 16: Data Foundation + Suggestion Generation
**Goal**: User can generate analysis-targeted AI rewrite suggestions from any completed analysis, with results displayed on the revision page and persisted to the database
**Depends on**: Phase 15
**Requirements**: SUGG-01, SUGG-02, SUGG-03, SUGG-04, SUGG-05, SUGG-06
**Success Criteria** (what must be TRUE):
  1. User can click a button on the revision page to generate rewrite suggestions from a completed analysis, and suggestions stream in progressively
  2. Each generated suggestion references a specific weakness from the analysis (not generic screenwriting advice) and quotes the exact original text span it targets
  3. User can set how many suggestions to generate (with a sensible default around 10)
  4. Suggestions persist in the database -- user can close the browser, reopen the project, and see their suggestions intact on the revision page
  5. Suggestion generation works for all 4 project types (narrative, TV/episodic, documentary, corporate)
**Plans:** 1/2 plans executed
Plans:
- [ ] 16-01-PLAN.md -- Data foundation: DB migrations, types, CRUD, FDX capture, suggestion schema, per-type prompts, weakness extraction
- [ ] 16-02-PLAN.md -- API route with NDJSON streaming, UI components, revision page integration

### Phase 17: Review UI
**Goal**: User can review each suggestion in a tracked-changes interface, accepting or rejecting individually, with a live-updating script preview
**Depends on**: Phase 16
**Requirements**: REVW-01, REVW-02, REVW-03, REVW-04
**Success Criteria** (what must be TRUE):
  1. Each suggestion displays the original text and proposed rewrite side-by-side with word-level diff highlighting
  2. User can accept or reject each suggestion individually, and a script preview updates live to reflect current accept/reject decisions
  3. User can request a new AI rewrite for any individual suggestion they are unsatisfied with
  4. Accept/reject state persists across page refreshes -- user can leave and resume their review session
**Plans**: TBD

### Phase 18: Merge + Script Export
**Goal**: User can finalize accepted suggestions and export the revised script in PDF, DOCX, FDX, or plain text
**Depends on**: Phase 17
**Requirements**: EXPRT-01, EXPRT-02, EXPRT-03, EXPRT-04
**Success Criteria** (what must be TRUE):
  1. User can apply accepted suggestions to produce a revised script and export it as plain text
  2. User can export the revised script as a formatted PDF preserving screenplay structure
  3. User can export the revised script as a DOCX document
  4. User can export the revised script as an FDX file that opens correctly in Final Draft (round-trip fidelity using the preserved FDX tree from Phase 16)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vertical Slice | v1.0 | 3/3 | Complete | 2026-03-17 |
| 2. File Format Support | v1.0 | 2/2 | Complete | 2026-03-17 |
| 3. Analysis Expansion | v1.0 | 3/3 | Complete | 2026-03-17 |
| 3.1. Multi-Provider AI | v1.0 | 3/3 | Complete | 2026-03-17 |
| 4. Export & Doc Gen | v1.0 | 6/6 | Complete | 2026-03-17 |
| 5. UI Theme & Brand | v1.0 | 2/2 | Complete | 2026-03-18 |
| 6. Card-Based Workspaces | v1.0 | 5/5 | Complete | 2026-03-19 |
| 7. Library & Persistence | v1.0 | 2/2 | Complete | 2026-03-19 |
| 8. Provider Error Handling | v1.0 | 1/1 | Complete | 2026-03-19 |
| 9. Harsh Critic Mode | v1.0 | 2/2 | Complete | 2026-03-19 |
| 10. Docker Build | v2.0 | 2/2 | Complete | 2026-03-19 |
| 11. Local Dev Environment | v2.0 | 2/2 | Complete | 2026-03-19 |
| 12. Production Deployment | v2.0 | 1/1 | Complete | 2026-03-19 |
| 13. CI/CD Pipeline | v2.0 | 2/2 | Complete | 2026-03-20 |
| 14. Documentation Cleanup | v2.0 | 1/1 | Complete | 2026-03-19 |
| 15. Adjustments / Revision Page + Branding | v3.0 | 2/2 | Complete | 2026-03-21 |
| 16. Data Foundation + Suggestion Generation | 1/2 | In Progress|  | - |
| 17. Review UI | v3.0 | 0/? | Not started | - |
| 18. Merge + Script Export | v3.0 | 0/? | Not started | - |
