# Domain Pitfalls

**Domain:** AI-powered filmmaking document analysis and creative workflow tool
**Researched:** 2026-03-16
**Overall confidence:** MEDIUM (based on training data and domain experience; web verification unavailable)

## Critical Pitfalls

Mistakes that cause rewrites, unusable output, or abandonment of the tool.

---

### Pitfall 1: Screenplay/Script PDF Parsing Produces Garbage Formatting

**What goes wrong:** Screenplay PDFs are notoriously hostile to text extraction. Standard PDF parsers (pdf-parse, pdfjs-dist) strip the spatial formatting that distinguishes character names, dialogue, action lines, parentheticals, and scene headings. You get a wall of text with no structural markers. The AI then cannot distinguish who is speaking, where scenes break, or what is action vs. dialogue.

**Why it happens:** Screenplays rely on *positional formatting* (character names centered, dialogue indented to a specific column, action flush-left). PDF text extraction flattens this into a linear text stream. Different screenwriting software (Final Draft, WriterSolo, Highland, Fade In, plain Word) produces PDFs with different internal structures. Some embed fonts that cause character mapping issues.

**Consequences:** AI analysis of a misparser screenplay is worthless. Story structure analysis breaks because scene headings are not identified. Character analysis fails because dialogue attribution is lost. The user (a filmmaker with professional standards) immediately sees the output is wrong and loses trust in the tool entirely.

**Prevention:**
1. Support Final Draft XML (.fdx) as a first-class format -- it has explicit structural tags (`<Paragraph Type="Scene Heading">`, `<Paragraph Type="Character">`, `<Paragraph Type="Dialogue">`). Parse the XML, not a PDF export.
2. For PDF screenplays, use a spatial-aware extraction approach: extract text with position coordinates, then use column-position heuristics to classify line types (scene heading = ALL CAPS flush left, character = ALL CAPS centered, dialogue = indented block, etc.).
3. Provide a "paste plain text" option as a fallback where the user can paste from their screenwriting app directly.
4. Show the user a preview of the parsed structure ("We detected 47 scenes, 12 characters...") so they can catch parsing failures before analysis runs.

**Detection:** Test with at least 5 different PDF sources (Final Draft export, Highland export, WriterSolo, generic Word-to-PDF, and a scanned/OCR script). If any produce garbled structure, the parser is not ready.

**Phase:** Must be addressed in Phase 1 (file upload/parsing). This is foundational -- everything downstream depends on clean parsing.

---

### Pitfall 2: Generic LLM Prompts Produce Generic "Book Report" Analysis

**What goes wrong:** The AI output reads like a high-school book report: "The story has interesting characters and the dialogue is natural." A filmmaker reading this thinks: "I already knew that. This is useless." The tool fails its core promise of being a useful "second set of eyes."

**Why it happens:** Developers build the happy path (upload -> send to LLM -> display response) and use a single generic prompt like "Analyze this screenplay." LLMs default to broad, safe, complimentary feedback when not given specific analytical frameworks. Filmmakers expect the specificity of professional script coverage: "The midpoint reversal on page 52 undercuts the B-story setup from page 23 because..." not "The story has good pacing."

**Consequences:** The tool's core value proposition is dead. The user goes back to reading scripts manually because the AI output adds nothing they did not already know. This is the single most likely reason the project fails to be useful.

**Prevention:**
1. Design prompts per project type that embed professional analytical frameworks:
   - Narrative: Use actual script coverage structure (logline, synopsis, character analysis, dialogue quality, structure/pacing, marketability, specific page-referenced notes).
   - Documentary: Use interview mining frameworks (pull exact quotes, identify recurring themes, flag emotional peaks, note contradictions between interviewees).
   - Corporate: Focus on messaging clarity, soundbite extraction, key talking points.
2. Require the LLM to cite specific passages. "On page 32, when SARAH says '...' this contradicts her earlier claim on page 8." Force grounding in the actual text.
3. Ask for both strengths and weaknesses with specifics. Professional coverage always includes constructive criticism.
4. Use structured output (JSON with defined sections) so the analysis is consistent and scannable, not a wall of prose.

**Detection:** Read 10 analysis outputs. If you cannot identify at least 3 specific, page-referenced insights per output that you did not already know from a skim, the prompts are too generic.

**Phase:** Core prompt engineering should be Phase 2 (AI analysis). But expect to iterate prompts through Phase 3 and beyond -- this is the "core IP" per PROJECT.md and it is never "done."

---

### Pitfall 3: Context Window Overflow Silently Truncates Long Documents

**What goes wrong:** A feature-length screenplay is 90-130 pages (~25,000-40,000 words, ~35,000-55,000 tokens). A 2-hour documentary transcript runs 15,000-20,000 words (~20,000-30,000 tokens). When you add the system prompt, analytical instructions, and output format requirements, you can exceed context windows. The LLM silently drops content from the middle or end, producing analysis that only covers Act 1 or the first interview.

**Why it happens:** Developers test with short documents (5-10 pages) during development and never test with real-length material. Token counting is not implemented. The API silently truncates or the model's attention degrades in the middle of long contexts ("lost in the middle" problem).

**Consequences:** Analysis only covers part of the document. The user notices the third act is never mentioned, or their best interview subject is ignored. For story structure analysis, this is fatal -- you cannot analyze pacing if you only see the first 40%.

**Prevention:**
1. Implement token counting before sending to the API. Use tiktoken or the model's tokenizer to measure the document + prompt size.
2. For documents that fit in context: send the whole thing but structure the prompt to explicitly reference beginning, middle, and end sections.
3. For documents that exceed context: implement a chunked analysis strategy:
   - First pass: chunk the document into logical sections (scenes, interviews, segments) and analyze each.
   - Second pass: send the chunk summaries together for a holistic analysis.
   - This two-pass approach is more expensive but produces dramatically better results than truncation.
4. Display a clear indicator to the user: "Your 120-page script will be analyzed in [full/chunked] mode."
5. Choose a model with a large context window (Claude 200K, GPT-4 128K) to minimize the need for chunking.

**Detection:** Upload a 120-page screenplay. Check if the analysis mentions events from page 90+. If not, context is being truncated.

**Phase:** Must be designed in Phase 1 (upload/parsing) and implemented in Phase 2 (AI analysis). The chunking strategy affects architecture.

---

### Pitfall 4: Hallucinated Quotes, Scenes, and Characters

**What goes wrong:** The LLM invents dialogue that does not appear in the script, references scene numbers that do not exist, or attributes lines to the wrong character. A filmmaker reading "The pivotal scene where JOHN confronts MARY in the warehouse..." when there is no warehouse scene immediately distrusts the entire analysis.

**Why it happens:** LLMs hallucinate, especially when asked to provide specific details from a long document. The "lost in the middle" attention problem makes this worse for mid-document content. When the model cannot find a specific detail, it confabulates rather than saying "I could not locate this."

**Consequences:** A single hallucinated quote or scene reference destroys the credibility of the entire report. Filmmakers know their material intimately -- they will catch fabricated details instantly. Unlike generic hallucination in chat, this is hallucination about *the user's own work*, which feels insulting.

**Prevention:**
1. Pre-extract structured data before the analysis prompt: scene list, character list, key dialogue lines. Pass this as grounding context.
2. Instruct the LLM explicitly: "Only reference scenes, characters, and dialogue that appear in the provided text. If you are unsure about a specific detail, describe the moment generally rather than fabricating a quote."
3. Use exact-quote extraction in a separate prompt pass, then feed verified quotes into the analysis pass.
4. For transcript analysis, extract timestamped quotes in parsing so the AI can reference them by position rather than trying to recall from context.
5. Consider a verification step: after generating analysis, have a second LLM call check cited quotes against the source text.

**Detection:** Take any analysis output and manually verify every quoted passage and scene reference against the source document. If even one is fabricated, the anti-hallucination strategy needs work.

**Phase:** Phase 2 (AI analysis) prompt design and Phase 3 (output formatting). The extraction-then-analysis pipeline should be architected in Phase 1.

---

### Pitfall 5: Treating All Project Types as Variations of the Same Prompt

**What goes wrong:** The developer creates one analysis prompt template and swaps out a few keywords for each project type. Documentary analysis ends up using narrative structure terms (act breaks, character arcs) that do not apply. Corporate interview analysis looks for "dramatic tension" instead of message clarity.

**Why it happens:** It seems efficient to have one template. "Just change the project type variable and the AI will figure it out." But the analytical frameworks for different project types are fundamentally different -- they are not variations, they are different disciplines.

**Consequences:** Documentary filmmakers get feedback that reads like someone trying to force their verite footage into a three-act structure. Corporate video producers get artsy feedback about "thematic resonance" when they need "does this spokesperson stay on message?" The tool feels like a generic AI chatbot, not a specialized filmmaking tool.

**Prevention:**
1. Design each project type's analysis pipeline independently. Start from "what would a professional in this niche actually analyze?" not "how can I modify the narrative analysis for this?"
   - Documentary: interview mining, thematic threading, verite moment identification, archival needs
   - Narrative: structure (Save the Cat, Hero's Journey, or sequence approach), character arcs, dialogue, pacing, setups/payoffs
   - Short-form/branded: messaging clarity, hook strength, call-to-action, pacing for attention span
   - Corporate interview: soundbite extraction, message discipline, talking point coverage
   - TV/episodic: episode structure, series arc progression, character consistency across episodes
2. Each project type should have its own system prompt, its own output schema, and its own evaluation criteria.
3. The project type selection in the UI is not a dropdown that tweaks a parameter -- it selects an entirely different analysis pathway.

**Detection:** Read the prompts for two very different project types (documentary vs. corporate). If more than 40% of the prompt text is identical, they are not specialized enough.

**Phase:** This is the core architecture decision in Phase 1 (project type routing) and the core implementation work in Phase 2 (analysis prompts). Get this wrong and the entire tool is compromised.

---

## Moderate Pitfalls

---

### Pitfall 6: Output Looks Like Raw AI Text, Not Professional Feedback

**What goes wrong:** The analysis output is displayed as a long block of AI-generated prose in a chat bubble or plain text area. It reads like a ChatGPT response, not like professional script coverage or a researcher's report. The filmmaker does not take it seriously.

**Prevention:**
1. Design the output as a structured report with clear sections, headings, and formatting.
2. Use professional terminology for each project type (e.g., "COVERAGE" for narrative, "INTERVIEW MINING REPORT" for documentary).
3. Include scannable elements: summary box at top, ratings or indicators, highlighted key quotes.
4. Make the output exportable as a PDF or document -- filmmakers share coverage with collaborators.
5. Never show "AI said:" framing. The tool's output should feel like the tool's output, not a chatbot conversation.

**Phase:** Phase 3 (output display/formatting). But the output schema should be designed in Phase 2 alongside the prompts.

---

### Pitfall 7: No Graceful Handling of Poorly Formatted Input

**What goes wrong:** Users upload transcripts with inconsistent speaker labels, missing timestamps, or auto-generated captions full of errors. Users paste screenplay text that lost its formatting. The AI analysis proceeds on garbage input and produces garbage output, but the user blames the tool, not their input.

**Prevention:**
1. After parsing, show a preview: "We detected [X] speakers, [Y] pages, estimated [Z] scenes." Let the user confirm or re-upload.
2. For transcripts: detect and flag when speaker labels are missing or inconsistent. Offer basic cleanup ("We found unlabeled dialogue -- would you like us to attempt speaker identification?").
3. For screenplays: detect when formatting is degraded (no scene headings found, no character names detected). Warn the user and suggest re-uploading in a different format.
4. Set a minimum quality threshold. If the parser cannot identify basic structural elements, refuse to analyze rather than producing bad output.

**Phase:** Phase 1 (parsing and validation), with quality-check UI in the upload flow.

---

### Pitfall 8: API Cost Explosion from Long Documents and Multi-Pass Analysis

**What goes wrong:** A 120-page screenplay with a two-pass chunked analysis strategy generates 200K+ tokens of API usage per analysis. During development and testing, the developer racks up significant API costs. In production, each analysis costs $1-5+ depending on the model.

**Prevention:**
1. Implement token counting and cost estimation before analysis runs. Log costs per analysis.
2. Use cheaper models for extraction/parsing passes and premium models only for the analytical pass.
3. Cache parsed document structure so re-analysis does not re-parse.
4. During development, use a representative 10-page excerpt for prompt iteration, not full documents.
5. Consider offering analysis depth tiers (quick scan vs. deep analysis) that map to different cost profiles.

**Phase:** Phase 2 (AI integration architecture). Must be designed before heavy prompt iteration begins or development costs will surprise you.

---

### Pitfall 9: Ignoring the "Lost in the Middle" Attention Problem

**What goes wrong:** Even when the full document fits in context, LLMs pay disproportionate attention to the beginning and end of the input, with reduced attention to the middle. For a screenplay, this means Act 2 (the longest and most complex act) gets the worst analysis. For a documentary transcript, the middle interviews are glossed over.

**Prevention:**
1. Structure prompts to explicitly ask about middle-document content: "Specifically address events and developments between pages 40-80."
2. For long documents, consider a section-by-section analysis even when the full document fits in context. Analyze Act 1, Act 2A, Act 2B, Act 3 separately, then synthesize.
3. In the output validation, specifically check: does the analysis reference content from all sections of the document proportionally?
4. Place the most important analytical instructions at the beginning AND end of the prompt (not just the beginning).

**Phase:** Phase 2 (prompt engineering). This is a refinement pitfall -- initial prompts will work on short test docs but fail on full-length ones.

---

### Pitfall 10: Building File Upload Before Defining Output Requirements

**What goes wrong:** The developer starts with the technically interesting part (file upload, parsing, format detection) and spends weeks perfecting it. Then they get to the AI analysis and realize the parsing output does not contain the structure the prompts need. The parser extracted raw text but the analysis needs scene-by-scene breakdowns. Major rework of the parser follows.

**Prevention:**
1. Design output-first: define exactly what the analysis report should look like for each project type.
2. Work backwards: what does the LLM need to produce that output? What structured data does it need as input?
3. Only then design the parser: what must it extract from the raw file to provide that structured data?
4. Build a vertical slice first: one project type, end-to-end (upload -> parse -> analyze -> display), before building out the other project types.

**Phase:** This is a Phase 1 design pitfall. Spend time on output design before writing parser code.

---

## Minor Pitfalls

---

### Pitfall 11: Screenplay Page Number Conventions

**What goes wrong:** Filmmaker says "page 52" and means the page number printed on the screenplay page, not the PDF page number (which may differ due to title pages, blank pages, etc.). The AI references page numbers that do not match the user's expectation.

**Prevention:** Parse screenplay page numbers from the document content (typically in upper right), not from the PDF page index. Use scene numbers as a more reliable reference point when available.

**Phase:** Phase 1 (parsing details).

---

### Pitfall 12: Transcript Timestamp Formats Are Inconsistent

**What goes wrong:** Transcripts come in dozens of formats: SRT, VTT, plain text with timestamps, plain text without timestamps, auto-generated captions, professional transcription services. Each has different conventions for timestamps, speaker labels, and paragraph breaks.

**Prevention:** Support 3-4 common formats explicitly (SRT, VTT, plain text with `[HH:MM:SS]` timestamps, unformatted text). Use format detection heuristics on upload. Do not try to support every format -- support the common ones well and let the user paste plain text as fallback.

**Phase:** Phase 1 (parsing).

---

### Pitfall 13: Underestimating Prompt Iteration Time

**What goes wrong:** Developer allocates 1-2 days for "write the analysis prompts" and discovers that getting consistently good output for even one project type takes 2-3 weeks of iteration, testing with different documents, and refinement.

**Prevention:** Budget prompt engineering as the largest single development effort. Plan for at least 20-30 iterations per project type. Keep a prompt changelog. Test each revision against the same set of benchmark documents and score the outputs.

**Phase:** Phase 2 (AI analysis) -- this IS the phase, not a subtask within it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| File upload & parsing | PDF screenplay formatting destroyed during extraction (Pitfall 1) | Support FDX natively; use spatial-aware PDF parsing; show parsed structure preview |
| File upload & parsing | Building parser before defining output needs (Pitfall 10) | Design analysis output schemas first, work backwards to parser requirements |
| File upload & parsing | Poor input produces bad output silently (Pitfall 7) | Validate parsed structure, show preview, set quality thresholds |
| AI analysis prompts | Generic prompts produce useless output (Pitfall 2) | Embed professional analytical frameworks per project type; require specific citations |
| AI analysis prompts | All project types share one template (Pitfall 5) | Design each project type's analysis pipeline independently |
| AI analysis prompts | Hallucinated quotes and scenes (Pitfall 4) | Pre-extract structured data; instruct against fabrication; verify citations |
| AI analysis prompts | Underestimating iteration time (Pitfall 13) | Budget 2-3 weeks per project type for prompt refinement |
| Long document handling | Context window overflow (Pitfall 3) | Token counting, chunked analysis strategy, large-context model |
| Long document handling | "Lost in the middle" attention decay (Pitfall 9) | Section-by-section analysis, explicit middle-content prompts |
| Output & display | Output looks like chatbot text (Pitfall 6) | Professional report formatting, structured sections, export capability |
| Cost management | API cost explosion during development (Pitfall 8) | Token counting, cost logging, tiered model usage |

## Sources

- Domain expertise in LLM application development, document parsing, and prompt engineering
- Known characteristics of LLM context window limitations and hallucination patterns (training data, MEDIUM confidence)
- Screenplay formatting conventions from industry-standard screenwriting software documentation (training data, MEDIUM confidence)
- Note: Web search was unavailable during this research session; findings are based on training data and should be validated against current LLM capabilities and library versions
