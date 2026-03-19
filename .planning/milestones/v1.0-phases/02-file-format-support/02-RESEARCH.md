# Phase 2: File Format Support - Research

**Researched:** 2026-03-16
**Domain:** File parsing (PDF, FDX, DOCX) with screenplay structure preservation
**Confidence:** MEDIUM (PDF screenplay parsing is inherently heuristic; FDX and DOCX are straightforward)

## Summary

Phase 2 adds three file format parsers to the existing parser registry: PDF (.pdf), Final Draft (.fdx), and Word (.docx). The existing codebase has a clean parser architecture -- `parseFile()` in `registry.ts` dispatches by extension, each parser returns a `ParseResult` with `text` and `metadata`. New parsers slot into this pattern directly.

The **highest risk** is PDF screenplay parsing. PDFs are visual documents -- they store positioned text fragments, not semantic structure. Screenplay formatting (scene headings, character names, dialogue) must be inferred from text patterns after extraction. The FDX format is XML with explicit paragraph types (Scene Heading, Character, Dialogue, Action) -- trivial to parse. DOCX via mammoth is a solved problem for text extraction.

**Primary recommendation:** Use `pdf-parse` for PDF text extraction + custom regex-based screenplay structure detection, `fast-xml-parser` for FDX parsing, and `mammoth` for DOCX. The PDF parser needs the most investment -- build a screenplay structure detector that identifies elements by regex patterns (ALL CAPS for scene headings starting with INT./EXT., indentation-based character/dialogue detection from extracted text).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARSE-02 | App parses PDF files with structure-preserving extraction (handles screenplay formatting) | pdf-parse for text extraction + custom screenplay structure detection via regex patterns for scene headings, characters, dialogue |
| PARSE-03 | App parses Final Draft (.fdx) files preserving scene headings, character names, and dialogue structure | fast-xml-parser to parse FDX XML; paragraph Type attributes directly encode screenplay elements |
| PARSE-04 | App parses Word/DOCX files | mammoth.extractRawText() for clean text extraction from .docx buffers |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-parse | 2.4.5 | PDF text extraction | 2M+ weekly downloads, TypeScript-native in v2, simple buffer API, works server-side in Node.js |
| fast-xml-parser | 5.5.6 | Parse FDX XML files | Fastest pure JS XML parser, no native dependencies, excellent TypeScript support |
| mammoth | 1.12.0 | DOCX to text/HTML | De facto standard for .docx in Node.js, semantic extraction, works with buffers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All three core libs cover the requirements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-parse | pdfjs-dist (5.5.207) | More control over text positioning but much larger API surface and complexity; only needed if pdf-parse text extraction proves insufficient for screenplay detection |
| pdf-parse | unpdf (1.4.0) | Edge-runtime compatible but less mature; not needed since we run server-side in Node.js API routes |
| fast-xml-parser | xml2js (0.6.2) | Older, callback-based API; fast-xml-parser is faster and has better TypeScript support |
| mammoth | officeparser (6.0.4) | Handles more Office formats but mammoth is more focused and reliable for .docx |

**Installation:**
```bash
npm install pdf-parse fast-xml-parser mammoth
```

**Type declarations:** pdf-parse v2 ships TypeScript types. fast-xml-parser ships types. mammoth ships types.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/parsers/
  registry.ts          # Updated: add .pdf, .fdx, .docx cases
  txt-parser.ts        # Existing (unchanged)
  pdf-parser.ts        # NEW: PDF extraction + screenplay detection
  fdx-parser.ts        # NEW: Final Draft XML parsing
  docx-parser.ts       # NEW: Word document parsing
  screenplay-utils.ts  # NEW: Shared screenplay structure detection (used by pdf-parser, potentially fdx-parser)
  __tests__/
    txt-parser.test.ts     # Existing
    pdf-parser.test.ts     # NEW
    fdx-parser.test.ts     # NEW
    docx-parser.test.ts    # NEW
    screenplay-utils.test.ts # NEW
```

### Pattern 1: Parser Registry Extension
**What:** Each new parser follows the existing `ParseResult` interface pattern. The registry dispatches by file extension.
**When to use:** Every new format.
**Example:**
```typescript
// registry.ts - extended
import { parseTxt, type ParseResult } from './txt-parser';
import { parsePdf } from './pdf-parser';
import { parseFdx } from './fdx-parser';
import { parseDocx } from './docx-parser';

export type { ParseResult } from './txt-parser';

export async function parseFile(content: Buffer | string, filename: string): Promise<ParseResult> {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  switch (ext) {
    case '.txt': {
      const text = typeof content === 'string' ? content : content.toString('utf-8');
      const result = parseTxt(text);
      result.metadata.filename = filename;
      return result;
    }
    case '.pdf':
      return parsePdf(content as Buffer, filename);
    case '.fdx':
      return parseFdx(content as Buffer, filename);
    case '.docx':
      return parseDocx(content as Buffer, filename);
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}
```

**CRITICAL:** The current `parseFile` is synchronous and takes `string`. It MUST become `async` and accept `Buffer | string` since binary formats (PDF, DOCX) need buffers. The upload route also needs updating -- currently uses `file.text()` which returns string; must use `file.arrayBuffer()` for binary formats.

### Pattern 2: Screenplay Structure Detection (for PDF)
**What:** After extracting raw text from PDF, apply regex-based heuristics to identify screenplay elements.
**When to use:** PDF files that may be screenplays.

**Screenplay formatting rules (industry standard):**
- **Scene Headings:** ALL CAPS, start with `INT.`, `EXT.`, `INT./EXT.`, or `I/E.`, followed by location and time of day
- **Character Names:** ALL CAPS, centered (appear on their own line before dialogue), no period at end
- **Dialogue:** Follows a character name, indented differently from action
- **Parentheticals:** In parentheses, between character name and dialogue `(beat)`, `(O.S.)`, `(V.O.)`
- **Transitions:** ALL CAPS ending with `TO:` (e.g., `CUT TO:`, `FADE TO:`)
- **Action:** Regular mixed-case prose paragraphs

```typescript
// screenplay-utils.ts
export interface ScreenplayElement {
  type: 'scene-heading' | 'character' | 'dialogue' | 'parenthetical' | 'action' | 'transition';
  text: string;
}

const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+.+/i;
const TRANSITION_RE = /^[A-Z\s]+TO:$/;
const CHARACTER_RE = /^[A-Z][A-Z\s.\-']+(\s*\(.*\))?$/;  // ALL CAPS, optional parenthetical like (V.O.)
const PARENTHETICAL_RE = /^\(.*\)$/;

export function detectScreenplayElements(text: string): ScreenplayElement[] {
  // Split into lines, analyze each line's pattern
  // Use context (previous line type) to disambiguate
  // e.g., text after a CHARACTER line is DIALOGUE
}
```

### Pattern 3: FDX XML Parsing
**What:** FDX files are XML with explicit `<Paragraph Type="...">` elements. Parse XML, iterate paragraphs, extract text.
**When to use:** .fdx files.

**FDX XML Structure (verified from sample files):**
```xml
<FinalDraft DocumentType="Script" Template="No" Version="6">
  <Content>
    <Paragraph Type="Scene Heading">
      <SceneProperties>...</SceneProperties>
      <Text>EXT. LIBRARY - DAY</Text>
    </Paragraph>
    <Paragraph Type="Action">
      <Text>A woman walks through the door.</Text>
    </Paragraph>
    <Paragraph Type="Character">
      <Text>JANE</Text>
    </Paragraph>
    <Paragraph Type="Parenthetical">
      <Text>(nervously)</Text>
    </Paragraph>
    <Paragraph Type="Dialogue">
      <Text>Hello, is anyone here?</Text>
    </Paragraph>
    <Paragraph Type="Transition">
      <Text>CUT TO:</Text>
    </Paragraph>
    <Paragraph Type="General">
      <Text>...</Text>
    </Paragraph>
  </Content>
</FinalDraft>
```

**Known Paragraph Types:** Scene Heading, Action, Character, Dialogue, Parenthetical, Transition, General

### Pattern 4: Upload Route Binary Handling
**What:** The upload API route must handle binary files (PDF, DOCX) differently from text files.
**When to use:** Always -- the route needs updating.

```typescript
// Current: const content = await file.text();
// New: use arrayBuffer for binary formats
const buffer = Buffer.from(await file.arrayBuffer());
const result = await parseFile(buffer, file.name);
```

### Anti-Patterns to Avoid
- **Trying to reconstruct PDF layout from coordinates:** Don't attempt pixel-perfect layout reconstruction. Extract text, then use regex patterns. The text order from pdf-parse is already reading-order.
- **Treating all PDFs as screenplays:** Not every PDF is a screenplay. The structure detector should gracefully degrade -- if no screenplay patterns found, return plain text.
- **Parsing FDX with regex:** FDX is proper XML. Use an XML parser, not string manipulation.
- **Synchronous file reading for large files:** All new parsers must be async since pdf-parse and mammoth are inherently async.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom PDF binary parser | pdf-parse | PDF format is enormously complex (fonts, encoding, streams, compression) |
| DOCX decompression/parsing | Custom ZIP + XML parser | mammoth | DOCX is a ZIP of XML files with complex relationships |
| XML parsing | Regex-based XML extraction | fast-xml-parser | XML edge cases (CDATA, entities, namespaces) break regex |
| Screenplay structure from PDF | - | Custom regex (this IS the work) | No library does this well; the heuristics are screenplay-domain-specific and must be tuned |

**Key insight:** PDF text extraction and DOCX parsing are solved problems -- use libraries. But screenplay structure detection from extracted PDF text IS the domain-specific work this phase must deliver. There is no reliable off-the-shelf solution for this.

## Common Pitfalls

### Pitfall 1: PDF Text Extraction Ordering
**What goes wrong:** PDF text extraction returns text fragments in the wrong order (columns mixed, headers interleaved with body).
**Why it happens:** PDFs store text as positioned fragments, not in reading order. Different PDF generators produce different internal orderings.
**How to avoid:** pdf-parse v2 handles reading order reasonably well for single-column documents. Screenplays are single-column, so this should work. Test with real screenplay PDFs early.
**Warning signs:** Character names appearing mid-dialogue, scene headings merged with action lines.

### Pitfall 2: parseFile Signature Change Breaking Existing Code
**What goes wrong:** Changing `parseFile` from sync `(string, string) => ParseResult` to async `(Buffer|string, string) => Promise<ParseResult>` breaks the upload route and any tests.
**Why it happens:** The existing txt parser is synchronous; new parsers are async.
**How to avoid:** Make the change atomically -- update registry, upload route, and tests together in the same plan.
**Warning signs:** TypeScript errors about Promise vs non-Promise returns.

### Pitfall 3: FDX Text Elements with Multiple Children
**What goes wrong:** Some FDX paragraphs have multiple `<Text>` children (for formatting runs like bold/italic within a line). Naively taking the first `<Text>` loses content.
**Why it happens:** FDX uses separate `<Text>` elements for differently-formatted runs within the same paragraph.
**How to avoid:** Concatenate ALL `<Text>` children within each `<Paragraph>`, not just the first.
**Warning signs:** Truncated dialogue or action lines.

### Pitfall 4: DOCX Files with No Text Content
**What goes wrong:** mammoth returns empty string for image-only or form-based Word docs.
**Why it happens:** mammoth extracts semantic text, not OCR.
**How to avoid:** Check for empty result and return a meaningful error message.
**Warning signs:** Empty preview after upload.

### Pitfall 5: File Extension vs MIME Type Mismatch
**What goes wrong:** User uploads a .pdf that is actually a .txt renamed, or vice versa.
**Why it happens:** File extension is unreliable.
**How to avoid:** For PDF, check magic bytes (`%PDF-`). For DOCX, check ZIP signature (`PK`). For FDX, check XML header. Fall back to error message if content doesn't match extension.
**Warning signs:** Cryptic parser errors instead of "invalid file" messages.

### Pitfall 6: Memory with Large PDFs
**What goes wrong:** Large screenplay PDFs (100+ pages) cause memory spikes when loaded entirely into a Buffer.
**Why it happens:** pdf-parse loads the entire PDF into memory.
**How to avoid:** The existing 10MB upload limit mitigates this. A typical 120-page screenplay PDF is 200-500KB. Monitor but unlikely to be an issue.
**Warning signs:** Server OOM errors on upload.

## Code Examples

### PDF Parser
```typescript
// src/lib/parsers/pdf-parser.ts
import { PDFParse } from 'pdf-parse';
import { detectScreenplayStructure } from './screenplay-utils';
import type { ParseResult } from './txt-parser';

export async function parsePdf(buffer: Buffer, filename: string): Promise<ParseResult> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text || '';
  const lines = text.split('\n');

  // Attempt screenplay structure detection
  const structure = detectScreenplayStructure(text);

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: lines.length,
      format: structure.isScreenplay ? 'pdf-screenplay' : 'pdf',
      filename,
    },
  };
}
```

### FDX Parser
```typescript
// src/lib/parsers/fdx-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type { ParseResult } from './txt-parser';

export async function parseFdx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const xmlContent = buffer.toString('utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const doc = parser.parse(xmlContent);

  const content = doc?.FinalDraft?.Content;
  if (!content?.Paragraph) {
    throw new Error('Invalid FDX file: no content paragraphs found');
  }

  const paragraphs = Array.isArray(content.Paragraph)
    ? content.Paragraph
    : [content.Paragraph];

  const lines: string[] = [];
  for (const para of paragraphs) {
    const type = para['@_Type'] || 'General';
    // Handle multiple <Text> children (formatting runs)
    let text = '';
    if (para.Text) {
      const texts = Array.isArray(para.Text) ? para.Text : [para.Text];
      text = texts.map((t: any) => (typeof t === 'string' ? t : t['#text'] || '')).join('');
    }
    if (text.trim()) {
      lines.push(text.trim());
    }
  }

  const fullText = lines.join('\n');

  return {
    text: fullText,
    metadata: {
      wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: lines.length,
      format: 'fdx',
      filename,
    },
  };
}
```

### DOCX Parser
```typescript
// src/lib/parsers/docx-parser.ts
import mammoth from 'mammoth';
import type { ParseResult } from './txt-parser';

export async function parseDocx(buffer: Buffer, filename: string): Promise<ParseResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  if (!text.trim()) {
    throw new Error('Document appears to be empty or contains no extractable text');
  }

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      lineCount: text.split('\n').length,
      format: 'docx',
      filename,
    },
  };
}
```

### Upload Route Update
```typescript
// Key change in src/app/api/upload/route.ts
const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.fdx', '.docx'];
const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

if (!ALLOWED_EXTENSIONS.includes(ext)) {
  return NextResponse.json(
    { error: `Unsupported file format: ${ext}. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}` },
    { status: 400 }
  );
}

// Binary formats need Buffer, text formats need string
if (ext === '.txt') {
  const content = await file.text();
  const result = await parseFile(content, file.name);
  // ...
} else {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseFile(buffer, file.name);
  // ...
}
```

### Project Type Config Update
```typescript
// src/lib/types/project-types.ts - all project types need updated extensions
// Documentary can now accept .txt, .pdf, .docx
// Narrative/TV/etc can accept .pdf, .fdx, .docx
acceptedExtensions: ['.txt', '.pdf', '.fdx', '.docx'],
acceptedMimeTypes: ['text/plain', 'application/pdf', 'application/xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse v1 (callback-based) | pdf-parse v2 (class-based, TypeScript) | 2025 | New API: `new PDFParse({data})` then `getText()` |
| xml2js (callback-based) | fast-xml-parser v5 (sync, fast) | 2024 | 10x faster, better TypeScript types, no callbacks |

**Deprecated/outdated:**
- pdf-parse v1 API (`require('pdf-parse')(buffer)`) -- v2 uses class-based `PDFParse` constructor
- xml2js -- still works but fast-xml-parser is the modern choice

## Open Questions

1. **PDF screenplay detection accuracy**
   - What we know: Regex patterns for INT./EXT. scene headings are reliable. Character name detection (ALL CAPS lines) has false positives (transitions are also ALL CAPS).
   - What's unclear: How well does pdf-parse v2 preserve line breaks and spacing from screenplay PDFs? This determines whether our regex approach works.
   - Recommendation: Test with 2-3 real screenplay PDFs in the first task. If text extraction quality is poor, fall back to pdfjs-dist for position-aware extraction.

2. **Should screenplay structure be in ParseResult metadata?**
   - What we know: Current `ParseResult` has `text` and `metadata` with basic counts. Screenplay structure (scenes, characters) is richer.
   - What's unclear: Whether downstream analysis (Phase 3) needs structured screenplay data or just clean text with format hints.
   - Recommendation: For now, preserve screenplay structure detection as metadata enrichment (e.g., `format: 'pdf-screenplay'` flag). Don't add structured scene/character arrays to ParseResult yet -- the Claude analysis will handle interpretation. Revisit in Phase 3.

3. **FDX version compatibility**
   - What we know: FDX format documented for Final Draft v8+. The XML structure uses `<Paragraph Type="...">`.
   - What's unclear: Whether older FDX versions or non-Final Draft FDX generators produce different structures.
   - Recommendation: Parse the standard structure. Add error handling for unexpected XML shapes. Log warnings for unknown paragraph types rather than crashing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/lib/parsers/__tests__/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARSE-02 | PDF text extraction returns content | unit | `npx vitest run src/lib/parsers/__tests__/pdf-parser.test.ts -x` | No -- Wave 0 |
| PARSE-02 | Screenplay structure detected from PDF text | unit | `npx vitest run src/lib/parsers/__tests__/screenplay-utils.test.ts -x` | No -- Wave 0 |
| PARSE-03 | FDX XML parsed to text with structure preserved | unit | `npx vitest run src/lib/parsers/__tests__/fdx-parser.test.ts -x` | No -- Wave 0 |
| PARSE-04 | DOCX buffer parsed to text | unit | `npx vitest run src/lib/parsers/__tests__/docx-parser.test.ts -x` | No -- Wave 0 |
| ALL | Upload route accepts new formats, rejects unsupported | unit | `npx vitest run src/app/api/upload/__tests__/route.test.ts -x` | Yes -- needs update |
| ALL | Registry dispatches to correct parser by extension | unit | `npx vitest run src/lib/parsers/__tests__/ -x` | Partial -- needs new cases |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/parsers/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/parsers/__tests__/pdf-parser.test.ts` -- covers PARSE-02 (PDF extraction)
- [ ] `src/lib/parsers/__tests__/screenplay-utils.test.ts` -- covers PARSE-02 (structure detection)
- [ ] `src/lib/parsers/__tests__/fdx-parser.test.ts` -- covers PARSE-03
- [ ] `src/lib/parsers/__tests__/docx-parser.test.ts` -- covers PARSE-04
- [ ] Test fixtures: small sample PDF, FDX, and DOCX files for unit tests

## Sources

### Primary (HIGH confidence)
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse) - v2.4.5, TypeScript class-based API
- [pdf-parse GitHub](https://github.com/mehmet-kozan/pdf-parse) - API documentation, buffer usage
- [fast-xml-parser npm](https://www.npmjs.com/package/fast-xml-parser) - v5.5.6
- [mammoth npm](https://www.npmjs.com/package/mammoth) - v1.12.0, extractRawText API
- [mammoth GitHub](https://github.com/mwilliamson/mammoth.js/) - buffer input support
- [FDX sample file](https://github.com/rsdoiel/fdx/blob/main/testdata/sample-01.fdx) - verified XML structure with Paragraph Type attributes

### Secondary (MEDIUM confidence)
- [PkgPulse comparison](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026) - pdf-parse vs unpdf vs pdfjs-dist comparison
- [screenplay-tools](https://github.com/wildwinter/screenplay-tools) - FDX parsing reference (JS library)
- [Final Draft format reference](https://blog.castandcrew.com/final-draft-interview) - FDX as open XML format
- [Screenplay format guide (StudioBinder)](https://www.studiobinder.com/blog/screenplay-margins/) - industry-standard margins and formatting rules
- [Final Draft formatting](https://www.finaldraft.com/learn/how-to-format-a-screenplay/) - scene heading, character, dialogue formatting rules

### Tertiary (LOW confidence)
- Screenplay PDF structure detection regex patterns -- based on documented formatting standards but untested against real PDFs; needs validation with actual screenplay files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified on npm with current versions, well-established
- Architecture: HIGH - extends existing clean parser registry pattern, straightforward
- PDF screenplay detection: MEDIUM - formatting rules are well-documented but regex heuristics need real-world validation
- FDX parsing: HIGH - XML format is explicit and well-documented with sample files
- DOCX parsing: HIGH - mammoth is battle-tested for this exact use case
- Pitfalls: MEDIUM - based on documented PDF extraction challenges and FDX edge cases

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable libraries, 30-day validity)
