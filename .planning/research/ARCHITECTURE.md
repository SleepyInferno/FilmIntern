# Architecture Patterns

**Domain:** AI-powered filmmaking document analysis web app
**Researched:** 2026-03-16
**Confidence:** MEDIUM (based on established patterns; no external search verification available)

## Recommended Architecture

A three-tier pipeline architecture: **Upload & Parse --> Analyze (LLM) --> Generate Output**. Each tier is a clear boundary with defined inputs and outputs. The app is a single-user personal tool, so the architecture is deliberately simple -- no job queues, no worker pools, no multi-tenancy.

```
[Browser UI]
    |
    v
[Next.js App Router / API Routes]
    |
    +-- /api/upload      --> File Parser Layer --> extracted text
    +-- /api/analyze      --> Prompt Assembly --> LLM API --> structured JSON
    +-- /api/generate     --> Output Renderer --> PDF/document
    |
[File System (temp storage)]
[LLM Provider API (Claude/OpenAI)]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **UI Shell** | Project type selection, file upload, progress display, report viewing | API Routes |
| **File Upload Handler** | Receives files, validates type/size, stores temporarily | File Parser |
| **File Parser** | Extracts plain text from PDF, FDX, plain text files | Returns text to API layer |
| **Project Type Registry** | Maps project types to accepted file types, analysis prompts, and output templates | Prompt Assembler, UI (for validation) |
| **Prompt Assembler** | Combines extracted text + project type config into LLM prompts | LLM Client |
| **LLM Client** | Sends prompts to API, handles streaming/errors/retries, parses structured response | Returns structured JSON |
| **Report Renderer** | Takes structured JSON analysis and renders as viewable report in UI | UI Shell |
| **Document Generator** | Takes structured data and generates downloadable PDFs/documents | Returns file download |

### Data Flow

```
1. User selects project type (e.g., "Documentary")
2. UI shows accepted file types for that project type (e.g., transcript TXT/PDF)
3. User uploads file
4. File Upload Handler validates and stores temp file
5. File Parser extracts plain text:
   - PDF  --> pdf-parse / pdf.js extracts text
   - FDX  --> XML parser extracts dialogue/action/scene headings
   - TXT  --> pass through (already text)
6. Prompt Assembler loads project-type-specific prompt template
7. Prompt Assembler injects extracted text into template
8. LLM Client sends prompt(s) to Claude API
9. LLM returns structured analysis (JSON or structured text)
10. Report Renderer displays analysis in UI
11. (Optional) Document Generator creates downloadable PDF
```

## Component Deep Dives

### File Parser Layer

This is the most important architectural boundary. Every downstream component works with **plain text** -- the parser normalizes all input formats into a common representation.

**Recommended approach:** A parser registry pattern where each file type has a dedicated parser module.

```typescript
// parser-registry.ts
interface ParseResult {
  text: string;           // Full extracted text
  metadata: {
    format: 'pdf' | 'fdx' | 'txt';
    pageCount?: number;
    sceneCount?: number;   // For screenplays
    wordCount: number;
    characterNames?: string[];  // Extracted from FDX
  };
  sections?: Section[];    // Optional structured breakdown
}

interface FileParser {
  accepts: string[];       // MIME types
  parse(buffer: Buffer, filename: string): Promise<ParseResult>;
}

// Each parser is a separate module:
// parsers/pdf-parser.ts
// parsers/fdx-parser.ts
// parsers/txt-parser.ts
```

**FDX (Final Draft) handling:** FDX files are XML. The key is preserving structural information -- scene headings, character names, dialogue vs. action -- because this structure is valuable for screenplay analysis. Parse the XML, then output formatted text that preserves these distinctions (e.g., prefix scene headings with `## SCENE:`, dialogue with character names).

**PDF handling:** Use `pdf-parse` (wrapper around pdf.js) for text extraction. PDFs are the hardest format because text extraction quality varies wildly. Screenplay PDFs are generally well-formatted text-based PDFs (not scanned), so basic text extraction works. For edge cases, consider falling back to sending the PDF directly to a multimodal LLM for extraction.

**Key decision: Parse on server, not client.** File parsing should happen in API routes, not in the browser. This keeps file processing consistent and avoids browser compatibility issues with PDF/XML parsing.

### Project Type Registry

This is the core "brain" of the app -- it defines what happens for each project type. Use a configuration-driven approach, not hardcoded if/else chains.

```typescript
// project-types.ts
interface ProjectTypeConfig {
  id: string;
  label: string;
  description: string;
  acceptedFileTypes: string[];       // MIME types
  fileTypeLabel: string;             // "transcript" or "screenplay"
  analysisPrompts: AnalysisPrompt[]; // Ordered list of analyses to run
  outputTemplates: OutputTemplate[]; // Available output formats
}

interface AnalysisPrompt {
  id: string;
  label: string;                     // "Story Structure Analysis"
  systemPrompt: string;              // The system prompt
  userPromptTemplate: string;        // Template with {{text}} placeholder
  outputSchema: ZodSchema;           // Expected JSON structure
  maxTokens: number;
}

const PROJECT_TYPES: Record<string, ProjectTypeConfig> = {
  documentary: {
    id: 'documentary',
    label: 'Documentary',
    acceptedFileTypes: ['text/plain', 'application/pdf'],
    fileTypeLabel: 'transcript',
    analysisPrompts: [
      interviewMiningPrompt,
      thematicAnalysisPrompt,
      narrativeArcPrompt,
    ],
    outputTemplates: [treatmentTemplate, paperEditTemplate],
  },
  narrative: {
    id: 'narrative',
    label: 'Narrative Film',
    acceptedFileTypes: ['text/plain', 'application/pdf', 'application/fdx'],
    fileTypeLabel: 'screenplay',
    analysisPrompts: [
      storyCoveragePrompt,
      structureAnalysisPrompt,
      characterAnalysisPrompt,
      dialogueAnalysisPrompt,
    ],
    outputTemplates: [coverageReportTemplate, shotListTemplate],
  },
  // ... etc
};
```

**Why a registry, not conditionals:** Adding a new project type should mean adding a config object and prompt templates, not touching analysis logic. This also makes it trivial to iterate on prompts per project type independently.

### Prompt Architecture

Use a multi-pass analysis approach rather than one massive prompt. Each analysis prompt focuses on one aspect and returns structured JSON.

**Why multi-pass:**
- Smaller, focused prompts produce higher quality output than one giant prompt
- Different analyses can use different models/temperatures if needed
- Easier to iterate on individual analyses without affecting others
- If one analysis fails, others still succeed

**Prompt structure per analysis:**

```
System: You are a professional [script reader / documentary editor / etc.].
        Analyze the following [transcript / screenplay] and return your
        analysis as JSON matching this schema: {...}

User:   ## Project Context
        Project type: {{projectType}}
        File format: {{fileFormat}}

        ## Material
        {{extractedText}}

        ## Analysis Instructions
        {{specificInstructions}}
```

**Structured output:** Use Zod schemas to define expected output shapes. Validate LLM responses against these schemas. If validation fails, retry with a correction prompt. This is critical -- without structured output validation, the report renderer can break on unexpected LLM output shapes.

### LLM Client Layer

A thin wrapper around the LLM API that handles:

1. **Token management:** Count input tokens, split long documents if needed
2. **Retry logic:** Exponential backoff on rate limits / transient errors
3. **Streaming:** Stream responses for better UX on long analyses
4. **Cost tracking:** Log token usage per analysis (personal tool, but you still want to know costs)

**Key architectural choice: Anthropic Claude API directly, not through a framework like LangChain.** For this use case, the overhead and abstraction of LangChain adds complexity without benefit. The Anthropic SDK is straightforward. A thin wrapper with retry logic is all that is needed.

```typescript
// llm-client.ts
interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature?: number;
  outputSchema?: ZodSchema;
}

interface LLMResponse {
  content: string;
  parsed?: unknown;        // Parsed JSON if outputSchema provided
  usage: { inputTokens: number; outputTokens: number };
}
```

**Long document handling:** Screenplays can be 120+ pages (30,000+ words, ~40K tokens). This fits within Claude's context window comfortably. Transcripts can be much longer (multi-hour interviews). For very long documents:
- First check token count against model limit
- If over limit, chunk by scenes/segments and analyze per-chunk, then synthesize
- Prefer sending the full document when possible -- chunking loses cross-document patterns

### Report Renderer (UI)

The analysis results are structured JSON. The report renderer transforms this into a readable, professional-feeling report in the browser.

**Approach:** React components that map analysis types to visual sections. Each analysis type has a dedicated renderer component.

```
AnalysisReport
  +-- ReportHeader (project info, file info, date)
  +-- AnalysisSection (one per analysis)
  |     +-- StoryStructureView
  |     +-- CharacterAnalysisView
  |     +-- InterviewMiningView
  |     +-- etc.
  +-- ReportActions (download PDF, regenerate, etc.)
```

**Key UX pattern:** Show analysis sections as they complete (streaming/progressive loading), not waiting for all analyses to finish. A documentary transcript might run 3 analyses -- show each as it completes.

### Document Generator

For generating downloadable outputs (PDF reports, treatments, shot lists).

**Recommended approach:** Server-side PDF generation using a library like `@react-pdf/renderer` or `puppeteer` (render HTML to PDF). For a personal tool, `@react-pdf/renderer` is simpler and has no browser dependency.

The generator takes structured analysis JSON + an output template and produces a downloadable file. This is a separate concern from the report renderer -- the in-browser view and the PDF download can have different layouts.

## Patterns to Follow

### Pattern 1: Configuration-Driven Pipeline
**What:** All behavior differences between project types are driven by configuration objects, not conditional logic in components.
**When:** Always. This is the core architectural pattern for this app.
**Why:** The main value of the tool is in the prompt engineering per project type. Making prompts and analysis configs easy to iterate on independently is critical.

### Pattern 2: Parse Once, Analyze Many
**What:** File parsing happens once and produces a normalized text representation. All analyses work from this same text.
**When:** On every upload.
**Why:** Avoids re-parsing, ensures consistency across analyses, and creates a clean boundary between file handling and analysis logic.

### Pattern 3: Structured Output with Validation
**What:** Every LLM analysis has a defined output schema (Zod). Responses are validated before rendering.
**When:** Every LLM call.
**Why:** LLMs sometimes return malformed JSON, missing fields, or unexpected structures. Validation catches this before it reaches the UI.

### Pattern 4: Progressive Analysis Display
**What:** Run multiple analyses concurrently (or sequentially) and display each result as it arrives.
**When:** When a project type triggers multiple analyses.
**Why:** Total analysis time for a screenplay might be 30-60 seconds across multiple prompts. Showing results progressively makes the wait feel shorter.

## Anti-Patterns to Avoid

### Anti-Pattern 1: One Giant Prompt
**What:** Stuffing all analysis instructions into a single massive prompt.
**Why bad:** Degrades output quality on every dimension. The LLM loses focus when asked to do 8 things at once. Also makes iteration impossible -- changing one analysis type risks affecting all others.
**Instead:** Multi-pass analysis with focused prompts.

### Anti-Pattern 2: Client-Side File Parsing
**What:** Parsing PDFs or FDX files in the browser.
**Why bad:** Browser PDF parsing is unreliable. FDX/XML parsing in the browser adds bundle size. Error handling is harder.
**Instead:** Upload the raw file, parse server-side in API routes.

### Anti-Pattern 3: Storing Files Permanently
**What:** Keeping uploaded files in persistent storage.
**Why bad:** For a personal tool, there is no need for a file database. It adds storage management complexity. The user has the original files.
**Instead:** Temp file storage during processing. Store only the extracted text and analysis results if you want history. Consider using the file system temp directory or an in-memory buffer.

### Anti-Pattern 4: LangChain / Heavy AI Framework
**What:** Using LangChain, LlamaIndex, or similar abstraction frameworks.
**Why bad:** Massive dependency overhead. Abstractions leak. For direct LLM API calls with structured output, the Anthropic SDK is sufficient. These frameworks add value for RAG, agents, complex chains -- none of which this app needs.
**Instead:** Direct Anthropic SDK + thin wrapper for retry/streaming.

### Anti-Pattern 5: Over-Engineering State Management
**What:** Using Redux, Zustand, or complex state management for the analysis pipeline.
**Why bad:** The data flow is linear (upload -> parse -> analyze -> display). There is no complex shared state.
**Instead:** React Server Components for data fetching, local component state for UI interactions, or simple React context if needed.

## Data Persistence Strategy

For a personal tool, keep persistence minimal:

| Data | Storage | Rationale |
|------|---------|-----------|
| Uploaded files | Temp only (delete after parsing) | User has originals |
| Extracted text | Optional: SQLite or JSON file | Enables re-analysis without re-upload |
| Analysis results | SQLite or JSON file | Enables viewing past analyses |
| Project type configs | Code (TypeScript objects) | Changes with code deploys |
| Prompt templates | Code (TypeScript template literals) | Core IP, version controlled |

**If you want history:** Use SQLite (via better-sqlite3 or Drizzle + SQLite) for storing past analyses. It is a single file, zero infrastructure, perfect for a personal tool.

**If you do not want history:** Store nothing. The app is purely functional: upload -> analyze -> view -> done.

**Recommendation:** Start with no persistence. Add SQLite later if the "view past analyses" feature becomes valuable.

## Suggested Build Order

Build order follows the data flow pipeline, with each layer testable independently:

```
Phase 1: Core Pipeline (Vertical Slice)
  1. Project Type Registry (config objects)
  2. File Upload Handler (single file type: plain text)
  3. Text Parser (plain text pass-through)
  4. Prompt Assembler (one project type: documentary)
  5. LLM Client (basic Claude API call, no streaming)
  6. Basic Report View (render JSON as formatted text)
  --> Deliverable: Upload a TXT transcript, get documentary analysis

Phase 2: File Format Support
  7. PDF Parser
  8. FDX Parser
  9. File type validation per project type
  --> Deliverable: All file formats working

Phase 3: All Project Types
  10. Narrative film prompts + analysis
  11. TV/episodic prompts + analysis
  12. Short-form/branded prompts + analysis
  13. Corporate interview prompts + analysis
  --> Deliverable: All project types producing analysis

Phase 4: Output Generation
  14. PDF report generation
  15. Document generation (treatments, outlines, shot lists)
  16. Download functionality
  --> Deliverable: Downloadable outputs

Phase 5: Polish
  17. Streaming/progressive display
  18. Error handling and retry UX
  19. Analysis history (if desired)
  20. Prompt iteration and quality tuning
  --> Deliverable: Production-quality personal tool
```

**Build order rationale:**
- Phase 1 proves the entire pipeline works end-to-end with the simplest possible inputs
- Phase 2 adds file format complexity (isolated from analysis logic)
- Phase 3 is prompt engineering work (isolated from infrastructure)
- Phase 4 is output formatting (requires analysis to be working first)
- Phase 5 is polish that requires everything else to be stable

## Handling Different File Types

| Format | Parser Library | Structural Info Available | Notes |
|--------|---------------|--------------------------|-------|
| Plain text (.txt) | None (pass-through) | None | Simplest path. Good for transcripts. |
| PDF (.pdf) | `pdf-parse` (wraps pdf.js) | Page breaks | Works well for text-based screenplay PDFs. Scanned PDFs will fail -- out of scope for v1. |
| Final Draft (.fdx) | Custom XML parser (xml2js or fast-xml-parser) | Scene headings, character names, dialogue vs. action, transitions | Richest format. Preserving structure in the extracted text improves analysis quality significantly. |

**FDX parsing detail:** FDX is XML with elements like `<Paragraph Type="Scene Heading">`, `<Paragraph Type="Character">`, `<Paragraph Type="Dialogue">`. Parse these into a structured intermediate format, then serialize to text that preserves formatting:

```
## SCENE: INT. OFFICE - DAY

SARAH
(excited)
Did you see the report?

Action: Sarah crosses to the window and looks out.
```

This structured text format gives the LLM much better context than raw extracted text.

## Prompt Organization Strategy

```
/prompts
  /documentary
    interview-mining.ts       # Best quotes, key moments, themes
    thematic-analysis.ts      # Recurring themes, narrative threads
    narrative-arc.ts          # Story arc in the raw material
  /narrative
    story-coverage.ts         # Traditional script coverage
    structure-analysis.ts     # Act breaks, turning points, pacing
    character-analysis.ts     # Character arcs, relationships
    dialogue-analysis.ts      # Dialogue quality, voice distinctiveness
  /tv-episodic
    episode-structure.ts      # Cold open, act breaks, cliffhangers
    series-arc.ts             # Season-level story tracking
  /short-form
    message-clarity.ts        # Is the core message landing?
    pacing-analysis.ts        # Timing for short format
  /corporate-interview
    quote-extraction.ts       # Best soundbites
    topic-coverage.ts         # Did they cover all needed topics?
  /shared
    system-prompts.ts         # Shared system prompt fragments
    output-schemas.ts         # Zod schemas for all output types
```

Each prompt file exports a function that takes extracted text + metadata and returns a complete LLM request. This makes prompts testable and iterable independently.

## Scalability Considerations

| Concern | At 1 user (v1) | If scaled later |
|---------|----------------|-----------------|
| File storage | Temp files, delete after processing | Object storage (S3) |
| Analysis queue | Direct API calls, wait for response | Job queue (BullMQ) |
| LLM costs | Pay-per-use, monitor manually | Rate limiting, usage caps |
| History | Optional SQLite | PostgreSQL |
| Auth | None needed | NextAuth.js |

**Key insight:** This is a personal tool. Do not build for scale. Build for simplicity and iteration speed on prompts. If it becomes a product later, the component boundaries support scaling each piece independently.

## Sources

- Architecture patterns based on established document processing pipeline designs (MEDIUM confidence -- well-known patterns, but not verified against specific current library versions)
- FDX format structure based on Final Draft XML specification (HIGH confidence -- stable format)
- PDF parsing approach based on pdf-parse/pdf.js ecosystem (MEDIUM confidence -- library is mature and widely used, but version specifics not verified)
- LLM integration patterns based on Anthropic Claude API design (MEDIUM confidence -- API is stable, but should verify current SDK features at implementation time)
