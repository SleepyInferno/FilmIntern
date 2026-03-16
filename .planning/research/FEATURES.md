# Feature Landscape

**Domain:** Filmmaking AI Workflow / Script & Transcript Analysis Tool
**Researched:** 2026-03-16
**Confidence:** MEDIUM (based on training data knowledge of competitor tools; web search unavailable for verification of latest features)

## Competitive Context

The filmmaking tool space is fragmented. No single tool does what FilmIntern proposes. Filmmakers currently cobble together:

- **Script coverage:** ScriptReader Pro, Coverfly's ScriptHop, StudioBinder's script breakdown (manual), AI-assisted coverage from newer entrants like ScriptBook
- **Transcript mining:** Descript, Otter.ai, Trint, Simon Says (transcription-first, not analysis-first)
- **Production planning:** StudioBinder, Celtx, Yamdu (scheduling, shot lists, call sheets)
- **AI writing assistance:** Sudowrite, NolanAI, Dramatica (story structure)
- **Script formatting:** Highland 2, WriterSolo, Final Draft (formatting-first, some analysis)

FilmIntern's differentiator is the convergence: upload material, select project type, get structured analysis back. Nobody does the "project-type-aware AI analysis" pipeline as a single tool.

---

## Table Stakes

Features users expect. Missing any of these and the tool feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **File upload (PDF, plain text, FDX)** | Every script/transcript tool handles these formats. Users will try to drag-and-drop their Final Draft exports immediately. | Medium | FDX (Final Draft XML) parsing is non-trivial but well-documented. PDF text extraction is the real headache -- screenplay PDFs vary wildly in formatting. |
| **Project type selection** | Core promise of the app. Without this, analysis is generic and unhelpful. | Low | UI-only; drives downstream routing. |
| **Structured analysis report output** | Users expect organized, readable output -- not a wall of AI text. The "professional coverage" format is the standard filmmakers know. | Medium | Sections, headings, clear formatting. Must feel like a document you'd get from a script reader, not a chatbot response. |
| **Story structure analysis (narrative)** | StudioBinder, Save the Cat, and every screenwriting book teaches act structure. Filmmakers will immediately check if the tool identifies act breaks, midpoint, climax. | Medium | Map to common frameworks: 3-act structure, Save the Cat beats, Hero's Journey. Don't invent a new framework -- use what filmmakers already know. |
| **Character analysis (narrative)** | Script coverage always includes character assessment. Arc, motivation, distinctiveness of voice. | Medium | Per-character breakdown. Identify protagonist, antagonist, supporting roles. Flag underdeveloped characters. |
| **Quote/moment extraction (documentary)** | Documentary editors spend hours logging transcripts for best quotes. This is the #1 pain point the tool addresses for doc projects. | Medium | Must surface specific timecoded or paragraph-referenced quotes, not just summarize themes. |
| **Theme identification** | Both narrative and documentary analysis includes thematic assessment. Every script coverage template has a "themes" section. | Low | Cross-cutting concern for all project types. |
| **Export/download report** | Users need to save the output, share it (even with themselves across devices), or paste it into other documents. PDF or markdown export minimum. | Low | PDF export is the standard. Markdown is a nice bonus for filmmaker-developers. |
| **Copy-paste friendly output** | Even before formal export, users will Command+A the report and paste it somewhere. Output must look good when pasted into Google Docs/Word. | Low | Clean HTML rendering that copies well. Not a hard technical problem but easy to overlook. |

## Differentiators

Features that set FilmIntern apart. Not expected (because no competitor does this), but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Project-type-aware analysis routing** | The core differentiator. Upload the same transcript as "documentary" vs "corporate interview" and get fundamentally different analysis. No other tool pivots analysis by project type. | Medium | This is prompt engineering + routing logic. The complexity is in designing great prompts per type, not in the code routing. |
| **Script coverage report (full format)** | Generate a complete script coverage in professional format: logline, synopsis, analysis sections (premise, structure, character, dialogue), marketability assessment, grade/rating. StudioBinder has templates but doesn't auto-generate. ScriptReader Pro does this but as a paid-per-script service. | High | This is the "killer feature" for narrative projects. Must hit the format working readers/producers expect. |
| **Interview mining with categorization** | Go beyond extracting quotes -- categorize them by topic, emotion, narrative usefulness. "Here are your 10 strongest moments, grouped by theme." | Medium | Documentary editors will love this. Descript doesn't do analysis, just transcription. |
| **Treatment/outline generation from raw material** | Turn a transcript into a documentary treatment draft. Turn a rough script into a structured outline. Transform raw material into industry-standard documents. | High | This is document generation, not just analysis. Requires understanding of treatment format, outline conventions per project type. |
| **Production planning outputs (shot lists, schedules)** | From a finalized script, generate a preliminary shot list or shooting schedule. StudioBinder requires manual entry; this auto-generates a starting point. | High | Scene detection, location extraction, cast requirements per scene. Complex but extremely valuable -- saves hours of breakdown work. |
| **Dialogue quality assessment** | Analyze dialogue for naturalness, character voice distinctiveness, on-the-nose writing. Most AI tools skip this. | Medium | Screenwriters care deeply about this. "Does each character sound different?" is a question they ask constantly. |
| **Pacing visualization** | Show scene length distribution, dialogue-to-action ratio, tension arc across the script. Visual representation of story rhythm. | Medium | StudioBinder shows page counts per scene but doesn't analyze pacing or tension. A simple chart showing scene intensity over time would be powerful. |
| **Short-form/branded content analysis** | Tailored analysis for commercials, branded content, social media scripts: message clarity, call-to-action effectiveness, brand voice consistency, runtime estimation. | Medium | Underserved niche. Most tools focus on features/TV. Corporate/branded content is a huge market with no AI analysis tools. |

## Anti-Features

Features to explicitly NOT build in v1. These are traps that would expand scope without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Built-in transcription** | Descript, Otter.ai, Whisper are already excellent at transcription. Building or integrating ASR is a massive scope increase for marginal value. Users already have transcripts. | Accept transcript text files and SRT/VTT. Let users transcribe elsewhere. |
| **Real-time collaboration** | PROJECT.md explicitly scopes this out. Multi-user adds auth, permissions, conflict resolution, WebSocket infrastructure. | Single-user tool. Export and share manually. |
| **Script writing/editing** | Highland 2, Final Draft, WriterSolo own this space. Building an editor is a years-long project. | Read-only analysis. Users write in their preferred tool, upload here for analysis. |
| **AI rewrite suggestions** | "Fix my dialogue" is Sudowrite territory and opens a philosophical can of worms about AI-generated creative content. Filmmakers are sensitive about this. | Identify issues ("dialogue feels expository in scene 14") but do NOT generate replacement text. Analysis, not generation -- except for structured documents like treatments. |
| **Video/audio file handling** | Processing video/audio requires entirely different infrastructure (storage, encoding, streaming). Way out of scope. | Text-only input. Transcripts, scripts, screenplays as text. |
| **Multi-user accounts and auth** | Personal tool. Adding auth infrastructure is premature complexity. | No login required. Single-user local or simple deployment. |
| **Marketplace or template store** | Building community features is a distraction from core analysis quality. | Ship with good defaults per project type. Iterate based on personal use. |
| **Version control / revision tracking** | Interesting but scope-creeping. Tracking script revisions over time requires a data model that adds real complexity. | Each upload is standalone. User manages their own versioning externally. |
| **Mobile-responsive design** | PROJECT.md says web-first. Filmmakers work at desks. Responsive design adds testing burden without clear value for v1. | Desktop-width web app. If it happens to look okay on tablet, great. Don't optimize for it. |

## Feature Dependencies

```
Project Type Selection
  |
  +--> File Upload (type determines accepted formats)
  |      |
  |      +--> File Parsing (PDF, FDX, plain text, SRT)
  |             |
  |             +--> AI Analysis Engine (core)
  |                    |
  |                    +--> Story Structure Analysis (narrative types)
  |                    +--> Character Analysis (narrative types)
  |                    +--> Script Coverage Report (narrative types)
  |                    +--> Dialogue Assessment (narrative types)
  |                    +--> Quote/Moment Extraction (documentary/interview types)
  |                    +--> Interview Mining with Categorization (documentary/interview)
  |                    +--> Theme Identification (all types)
  |                    +--> Short-form/Branded Analysis (branded type)
  |                    |
  |                    +--> Structured Report Output
  |                           |
  |                           +--> Export/Download (PDF, markdown)
  |                           +--> Copy-paste friendly rendering
  |
  +--> Treatment/Outline Generation (depends on parsed material + project type)
  +--> Production Planning Outputs (depends on parsed script + scene detection)
```

**Key dependency insight:** Everything flows from File Parsing. If parsing is unreliable (especially PDF screenplay extraction), every downstream feature suffers. This must be rock-solid before building analysis features.

**Second critical path:** The AI Analysis Engine quality depends entirely on prompt design per project type. The prompts ARE the product. Code is just plumbing to deliver well-crafted prompts to the LLM and format the results.

## MVP Recommendation

### Phase 1: Core Analysis Loop
Prioritize these to prove the concept works:

1. **Project type selection** (Low complexity, enables everything)
2. **File upload + parsing** (Medium complexity, critical foundation -- plain text and PDF first, FDX later)
3. **AI analysis engine with project-type routing** (Medium complexity, this is the core product)
4. **Theme identification** (Low complexity, works for all project types)
5. **Story structure analysis** (Medium complexity, for narrative project types)
6. **Quote/moment extraction** (Medium complexity, for documentary/interview types)
7. **Structured report output** (Medium complexity, makes output professional)

### Phase 2: Deep Analysis
8. **Character analysis** (Medium)
9. **Full script coverage report format** (High)
10. **Interview mining with categorization** (Medium)
11. **Dialogue assessment** (Medium)
12. **Short-form/branded analysis** (Medium)
13. **Export/download** (Low)

### Phase 3: Document Generation
14. **Treatment/outline generation** (High)
15. **Production planning outputs** (High)
16. **Pacing visualization** (Medium)

**Defer indefinitely:** Built-in transcription, script editing, AI rewrites, collaboration, video handling.

### Rationale

Phase 1 proves the core value proposition: "upload, select type, get analysis." If this doesn't feel magical, nothing else matters. Phase 2 deepens the analysis to professional quality. Phase 3 extends from analysis into document generation, which is a different (harder) problem.

The key risk is Phase 1 feeling underwhelming. The difference between "this is just ChatGPT with extra steps" and "this is genuinely useful" comes down to:
- Prompt quality per project type (the core IP)
- Report structure that matches industry expectations
- Specific, actionable insights rather than generic AI summaries

## Sources

- Training data knowledge of: ScriptReader Pro, StudioBinder, Celtx, Descript, Otter.ai, Highland 2, Final Draft, Sudowrite, NolanAI, Coverfly/ScriptHop, Simon Says, Trint, Yamdu
- PROJECT.md requirements and constraints
- Domain knowledge of script coverage format, documentary editing workflow, production planning conventions
- **Note:** Web search was unavailable during this research session. Feature lists for specific competitors may have changed since training data cutoff. Recommend verifying ScriptReader Pro and NolanAI current feature sets in phase-specific research.
