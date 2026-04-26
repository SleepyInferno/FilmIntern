import { describe, it, expect } from 'vitest';
import { parseFdx } from '../fdx-parser';

const VALID_FDX = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="6">
  <Content>
    <Paragraph Type="Scene Heading">
      <Text>EXT. LIBRARY - DAY</Text>
    </Paragraph>
    <Paragraph Type="Action">
      <Text>A woman walks through the door.</Text>
    </Paragraph>
    <Paragraph Type="Character">
      <Text>JANE</Text>
    </Paragraph>
    <Paragraph Type="Dialogue">
      <Text>Hello, is anyone here?</Text>
    </Paragraph>
  </Content>
</FinalDraft>`;

const MULTI_TEXT_FDX = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="6">
  <Content>
    <Paragraph Type="Dialogue">
      <Text>Hello, </Text>
      <Text>is anyone here?</Text>
    </Paragraph>
  </Content>
</FinalDraft>`;

const SINGLE_PARAGRAPH_FDX = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="6">
  <Content>
    <Paragraph Type="Action">
      <Text>A single action line.</Text>
    </Paragraph>
  </Content>
</FinalDraft>`;

describe('parseFdx', () => {
  it('extracts text from valid FDX XML', async () => {
    const buffer = Buffer.from(VALID_FDX, 'utf-8');
    const result = await parseFdx(buffer, 'script.fdx');

    expect(result.text).toContain('EXT. LIBRARY - DAY');
    expect(result.text).toContain('JANE');
    expect(result.text).toContain('Hello, is anyone here?');
    expect(result.metadata.filename).toBe('script.fdx');
    expect(result.metadata.wordCount).toBeGreaterThan(0);
    expect(result.metadata.lineCount).toBe(4);
  });

  it('handles multiple Text children in a single Paragraph', async () => {
    const buffer = Buffer.from(MULTI_TEXT_FDX, 'utf-8');
    const result = await parseFdx(buffer, 'multi.fdx');

    // fast-xml-parser trims text nodes, so trailing space in "Hello, " is trimmed before concatenation
    expect(result.text).toContain('Hello,');
    expect(result.text).toContain('is anyone here?');
  });

  it('sets format to "fdx"', async () => {
    const buffer = Buffer.from(VALID_FDX, 'utf-8');
    const result = await parseFdx(buffer, 'script.fdx');

    expect(result.metadata.format).toBe('fdx');
  });

  it('throws on invalid FDX (no Content/Paragraph)', async () => {
    const invalidXml = '<FinalDraft><Other/></FinalDraft>';
    const buffer = Buffer.from(invalidXml, 'utf-8');

    await expect(parseFdx(buffer, 'bad.fdx')).rejects.toThrow('Invalid FDX file');
  });

  it('handles single Paragraph (non-array)', async () => {
    const buffer = Buffer.from(SINGLE_PARAGRAPH_FDX, 'utf-8');
    const result = await parseFdx(buffer, 'single.fdx');

    expect(result.text).toContain('A single action line.');
    expect(result.metadata.lineCount).toBe(1);
  });

  it('rejects FDX files with excessive element counts (parse-bomb defense)', async () => {
    // Forge an FDX with > 200k opening tags. Use a tight repeated pattern so
    // we don't accidentally OOM the test runner before the cap fires.
    const head = '<?xml version="1.0"?><FinalDraft><Content>';
    const tail = '</Content></FinalDraft>';
    const filler = '<P/>'.repeat(200_001); // 200,001 elements
    const buffer = Buffer.from(head + filler + tail, 'utf-8');

    await expect(parseFdx(buffer, 'huge.fdx')).rejects.toThrow(/too many XML elements/i);
  });

  it('does not expand XML entities (billion-laughs defense)', async () => {
    // With processEntities:false, &lol; should be preserved verbatim
    // rather than expanded. We assert no expansion occurred by checking
    // the resulting text doesn't contain the expanded form.
    const ENTITY_FDX = `<?xml version="1.0"?>
<!DOCTYPE FinalDraft [
  <!ENTITY lol "lololololololololololololol">
]>
<FinalDraft><Content>
  <Paragraph Type="Action"><Text>&lol;</Text></Paragraph>
</Content></FinalDraft>`;
    const buffer = Buffer.from(ENTITY_FDX, 'utf-8');
    const result = await parseFdx(buffer, 'entities.fdx');
    // Entity not expanded → no run of 'lol' characters in the output
    expect(result.text).not.toMatch(/lololololol/);
  });
});
