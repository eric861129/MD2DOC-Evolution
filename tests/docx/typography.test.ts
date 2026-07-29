import { beforeAll, describe, expect, it } from 'vitest';
import { generateDocx } from '../../services/docxGenerator';
import { parseMarkdown } from '../../services/markdownParser';
import { BlockType, type ParsedBlock } from '../../services/types';
import { listDocxEntries, readDocxXml } from '../helpers/readDocx';

const typographyFixture = [
  '# 第一章',
  '## 1.1 小節',
  '### 1.1.1 細節',
  '這是**粗體**、`inlineCode()` 與[官方文件](https://example.com)。',
  '',
  '1. 第一項',
  '2. 第二項',
  '',
  '- 項目甲',
  '- 項目乙',
].join('\n');

const publisherExportSettings = {
  profileId: 'publisher-exact' as const,
  pageSizeId: 'tech' as const,
  marginPresetId: 'publisher-exact' as const,
};

const legacyExportSettings = {
  profileId: 'technical-legacy' as const,
  pageSizeId: 'tech' as const,
  marginPresetId: 'publisher-exact' as const,
};

const parseXml = (xml: string): Document =>
  new DOMParser().parseFromString(xml, 'application/xml');

const elementsByName = (parent: Document | Element, name: string): Element[] =>
  Array.from(parent.getElementsByTagName(`w:${name}`));

const directChild = (parent: Element, name: string): Element | undefined =>
  Array.from(parent.children).find((element) => element.localName === name);

const wordAttribute = (element: Element, name: string): string | null =>
  element.getAttribute(`w:${name}`) ?? element.getAttribute(name);

const paragraphText = (paragraph: Element): string =>
  elementsByName(paragraph, 't').map((node) => node.textContent ?? '').join('');

const findParagraph = (document: Document, text: string): Element => {
  const paragraph = elementsByName(document, 'p')
    .find((candidate) => paragraphText(candidate) === text);
  if (!paragraph) {
    throw new Error(`找不到段落：${text}`);
  }
  return paragraph;
};

const findParagraphContaining = (document: Document, text: string): Element => {
  const paragraph = elementsByName(document, 'p')
    .find((candidate) => paragraphText(candidate).includes(text));
  if (!paragraph) {
    throw new Error(`找不到包含文字的段落：${text}`);
  }
  return paragraph;
};

const findRun = (paragraph: Element, text: string): Element => {
  const run = elementsByName(paragraph, 'r')
    .find((candidate) => elementsByName(candidate, 't')
      .some((node) => node.textContent === text));
  if (!run) {
    throw new Error(`找不到文字 Run：${text}`);
  }
  return run;
};

const paragraphStyleId = (paragraph: Element): string | null => {
  const paragraphProperties = directChild(paragraph, 'pPr');
  const style = paragraphProperties
    ? directChild(paragraphProperties, 'pStyle')
    : undefined;
  return style ? wordAttribute(style, 'val') : null;
};

const getStyle = (styles: Document, styleId: string): Element => {
  const style = elementsByName(styles, 'style')
    .find((candidate) => wordAttribute(candidate, 'styleId') === styleId);
  if (!style) {
    throw new Error(`找不到命名樣式：${styleId}`);
  }
  return style;
};

const getExternalRelationship = (
  relationships: Document,
  hyperlink: Element,
): Element => {
  const relationshipId = hyperlink.getAttribute('r:id');
  const relationship = Array.from(
    relationships.getElementsByTagName('Relationship'),
  ).find((candidate) => candidate.getAttribute('Id') === relationshipId);
  if (!relationship) {
    throw new Error(`找不到外部連結 Relationship：${relationshipId}`);
  }
  return relationship;
};

beforeAll(() => {
  if (typeof Blob.prototype.arrayBuffer === 'function') {
    return;
  }

  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
  });
});

describe('DOCX 出版社排版', () => {
  it('technical-legacy 完整保留舊版 heading、callout、dialogue 與行內格式 OOXML', async () => {
    const blocks: ParsedBlock[] = [
      { type: BlockType.HEADING_1, content: 'Legacy heading' },
      {
        type: BlockType.PARAGRAPH,
        content: '*Legacy italic* 與 `legacyCode`',
      },
      {
        type: BlockType.CALLOUT_WARNING,
        content: 'Legacy callout',
      },
      {
        type: BlockType.CHAT_CUSTOM,
        role: 'User',
        content: 'Legacy chat',
        alignment: 'left',
      },
    ];
    const blob = await generateDocx(blocks, {
      exportSettings: legacyExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const styles = parseXml(await readDocxXml(blob, 'word/styles.xml'));

    for (const [styleId, expected] of [
      ['Heading1', { color: '2E74B5', size: '32' }],
      ['Heading2', { color: '2E74B5', size: '26' }],
      ['Heading3', { color: '1F4D78', size: '24' }],
    ] as const) {
      const style = getStyle(styles, styleId);
      const runProperties = directChild(style, 'rPr')!;
      const paragraphProperties = directChild(style, 'pPr');
      expect({
        color: wordAttribute(directChild(runProperties, 'color')!, 'val'),
        size: wordAttribute(directChild(runProperties, 'sz')!, 'val'),
        bold: directChild(runProperties, 'b'),
        keepNext: paragraphProperties
          ? directChild(paragraphProperties, 'keepNext')
          : undefined,
        keepLines: paragraphProperties
          ? directChild(paragraphProperties, 'keepLines')
          : undefined,
      }).toEqual({
        ...expected,
        bold: undefined,
        keepNext: undefined,
        keepLines: undefined,
      });
    }
    expect(() => getStyle(styles, 'TableBody')).toThrow(
      '找不到命名樣式：TableBody',
    );

    const heading = findParagraph(document, 'Legacy heading');
    const headingProperties = directChild(heading, 'pPr')!;
    const headingSpacing = directChild(headingProperties, 'spacing')!;
    const headingBorders = directChild(headingProperties, 'pBdr');
    expect(headingBorders).toBeDefined();
    if (!headingBorders) {
      return;
    }
    const headingBottomBorder = directChild(
      headingBorders,
      'bottom',
    )!;
    expect(paragraphStyleId(heading)).toBe('Heading1');
    expect({
      before: wordAttribute(headingSpacing, 'before'),
      after: wordAttribute(headingSpacing, 'after'),
      border: wordAttribute(headingBottomBorder, 'val'),
      color: wordAttribute(headingBottomBorder, 'color'),
      size: wordAttribute(headingBottomBorder, 'sz'),
      space: wordAttribute(headingBottomBorder, 'space'),
    }).toEqual({
      before: '480',
      after: '240',
      border: 'single',
      color: '000000',
      size: '18',
      space: '8',
    });

    const callout = findParagraphContaining(document, 'Legacy callout');
    expect(paragraphText(callout)).toBe('[ WARNING ]Legacy callout');
    const calloutProperties = directChild(callout, 'pPr')!;
    const calloutBorders = directChild(calloutProperties, 'pBdr')!;
    expect(elementsByName(callout, 'br')).toHaveLength(1);
    expect(wordAttribute(directChild(calloutProperties, 'shd')!, 'fill'))
      .toBe('F1F5F9');
    expect({
      top: ['val', 'space', 'sz', 'color'].map((attribute) =>
        wordAttribute(directChild(calloutBorders, 'top')!, attribute)),
      left: ['val', 'space', 'sz', 'color'].map((attribute) =>
        wordAttribute(directChild(calloutBorders, 'left')!, attribute)),
    }).toEqual({
      top: ['single', '5', '48', '000000'],
      left: ['single', '15', '48', '000000'],
    });
    const calloutSpacing = directChild(calloutProperties, 'spacing')!;
    const calloutIndent = directChild(calloutProperties, 'ind')!;
    expect({
      before: wordAttribute(calloutSpacing, 'before'),
      after: wordAttribute(calloutSpacing, 'after'),
      line: wordAttribute(calloutSpacing, 'line'),
      left: wordAttribute(calloutIndent, 'left'),
      right: wordAttribute(calloutIndent, 'right'),
    }).toEqual({
      before: '600',
      after: '600',
      line: '360',
      left: '400',
      right: '400',
    });

    const chat = findParagraph(document, 'User:Legacy chat');
    const chatProperties = directChild(chat, 'pPr')!;
    const chatBorders = directChild(chatProperties, 'pBdr')!;
    const chatTopBorder = directChild(chatBorders, 'top')!;
    const chatSpacing = directChild(chatProperties, 'spacing')!;
    expect(elementsByName(chat, 'br')).toHaveLength(1);
    expect({
      border: wordAttribute(chatTopBorder, 'val'),
      color: wordAttribute(chatTopBorder, 'color'),
      space: wordAttribute(chatTopBorder, 'space'),
      size: wordAttribute(chatTopBorder, 'sz'),
      before: wordAttribute(chatSpacing, 'before'),
      after: wordAttribute(chatSpacing, 'after'),
      line: wordAttribute(chatSpacing, 'line'),
      rightIndent: wordAttribute(directChild(chatProperties, 'ind')!, 'right'),
      shading: wordAttribute(directChild(chatProperties, 'shd')!, 'fill'),
    }).toEqual({
      border: 'dotted',
      color: '404040',
      space: '10',
      size: null,
      before: '400',
      after: '400',
      line: '276',
      rightIndent: '1440',
      shading: 'F2F2F2',
    });
    expect(directChild(chatProperties, 'keepLines')).toBeUndefined();
    expect(directChild(chatProperties, 'keepNext')).toBeUndefined();

    const body = findParagraph(document, 'Legacy italic 與 legacyCode');
    const italicProperties = directChild(findRun(body, 'Legacy italic'), 'rPr')!;
    const italicFonts = directChild(italicProperties, 'rFonts')!;
    expect(directChild(italicProperties, 'i')).toBeDefined();
    expect(wordAttribute(directChild(italicProperties, 'color')!, 'val'))
      .toBe('1E3A8A');
    expect({
      ascii: wordAttribute(italicFonts, 'ascii'),
      hAnsi: wordAttribute(italicFonts, 'hAnsi'),
      eastAsia: wordAttribute(italicFonts, 'eastAsia'),
      cs: wordAttribute(italicFonts, 'cs'),
    }).toEqual({
      ascii: 'Consolas',
      hAnsi: 'Consolas',
      eastAsia: 'Microsoft JhengHei',
      cs: 'Consolas',
    });

    const codeProperties = directChild(findRun(body, 'legacyCode'), 'rPr')!;
    const codeFonts = directChild(codeProperties, 'rFonts')!;
    expect({
      ascii: wordAttribute(codeFonts, 'ascii'),
      hAnsi: wordAttribute(codeFonts, 'hAnsi'),
      eastAsia: wordAttribute(codeFonts, 'eastAsia'),
      cs: wordAttribute(codeFonts, 'cs'),
      size: directChild(codeProperties, 'sz'),
      color: directChild(codeProperties, 'color'),
      shading: wordAttribute(directChild(codeProperties, 'shd')!, 'fill'),
    }).toEqual({
      ascii: 'Consolas',
      hAnsi: 'Consolas',
      eastAsia: 'Microsoft JhengHei',
      cs: 'Consolas',
      size: undefined,
      color: undefined,
      shading: 'F1F5F9',
    });
  });

  it('一般文字繼承命名樣式，僅行內程式碼直接指定出版社程式碼格式', async () => {
    const { blocks } = parseMarkdown(typographyFixture);
    const blob = await generateDocx(blocks, {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const styles = parseXml(await readDocxXml(blob, 'word/styles.xml'));
    const relationshipsXml = await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    );
    const entries = await listDocxEntries(blob);

    for (const [text, styleId] of [
      ['第一章', 'Heading1'],
      ['1.1小節', 'Heading2'],
      ['1.1.1細節', 'Heading3'],
      ['這是粗體、inlineCode() 與官方文件。', 'Normal'],
    ] as const) {
      const paragraph = findParagraph(document, text);
      expect(paragraphStyleId(paragraph)).toBe(styleId);
      expect(directChild(directChild(paragraph, 'pPr')!, 'spacing')).toBeUndefined();
    }

    const heading1 = findParagraph(document, '第一章');
    expect(elementsByName(heading1, 'pBdr')).toHaveLength(0);

    const body = findParagraph(document, '這是粗體、inlineCode() 與官方文件。');
    const plainRunProperties = directChild(findRun(body, '這是'), 'rPr');
    expect(plainRunProperties && directChild(plainRunProperties, 'rFonts'))
      .toBeFalsy();

    const boldRunProperties = directChild(findRun(body, '粗體'), 'rPr');
    expect(boldRunProperties && directChild(boldRunProperties, 'b')).toBeTruthy();
    expect(boldRunProperties && directChild(boldRunProperties, 'rFonts'))
      .toBeFalsy();

    const codeRunProperties = directChild(findRun(body, 'inlineCode()'), 'rPr')!;
    const codeFonts = directChild(codeRunProperties, 'rFonts')!;
    expect(wordAttribute(codeFonts, 'ascii')).toBe('Consolas');
    expect(wordAttribute(codeFonts, 'hAnsi')).toBe('Consolas');
    expect(wordAttribute(codeFonts, 'eastAsia')).toBe('Noto Sans TC');
    expect(wordAttribute(directChild(codeRunProperties, 'sz')!, 'val')).toBe('19');
    expect(wordAttribute(directChild(codeRunProperties, 'color')!, 'val'))
      .toBe('9B1C1C');

    const hyperlink = elementsByName(body, 'hyperlink')
      .find((candidate) => paragraphText(candidate) === '官方文件');
    expect(hyperlink).toBeDefined();
    expect(relationshipsXml).toMatch(
      /<Relationship(?=[^>]*Target="https:\/\/example\.com")(?=[^>]*TargetMode="External")[^>]*\/>/,
    );
    expect(elementsByName(document, 'drawing')).toHaveLength(0);
    expect(entries.some((entry) => entry.startsWith('word/media/'))).toBe(false);

    for (const styleId of ['Heading1', 'Heading2', 'Heading3', 'Normal']) {
      expect(getStyle(styles, styleId)).toBeDefined();
    }
  });

  it('technical-legacy 的外部連結仍保留自動 QR 行為', async () => {
    const { blocks } = parseMarkdown(
      '舊版請參考[官方文件](https://example.com)。',
    );
    const blob = await generateDocx(blocks, {
      exportSettings: legacyExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const relationshipsXml = await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    );
    const entries = await listDocxEntries(blob);
    const paragraph = findParagraphContaining(document, '舊版請參考官方文件');

    expect(elementsByName(paragraph, 'hyperlink')).toHaveLength(1);
    expect(relationshipsXml).toContain('Target="https://example.com"');
    expect(elementsByName(paragraph, 'drawing')).toHaveLength(1);
    expect(entries.some((entry) => entry.startsWith('word/media/'))).toBe(true);
  });

  it('混合 Markdown 依 token tree 保留巢狀粗體、斜體、行內程式碼與外部連結', async () => {
    const { blocks } = parseMarkdown(
      '***both***、**bold `code`**、***both `codeBoth`***、[**bold** and `code`](https://example.com/nested) 與 _italic_。',
    );
    const blob = await generateDocx(blocks, {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const relationships = parseXml(await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    ));
    const paragraph = findParagraphContaining(document, 'both');

    expect(paragraphText(paragraph))
      .toBe('both、bold code、both codeBoth、bold and code 與 italic。');

    const bothProperties = directChild(findRun(paragraph, 'both'), 'rPr')!;
    expect(directChild(bothProperties, 'b')).toBeDefined();
    expect(directChild(bothProperties, 'i')).toBeDefined();

    const hyperlinkRuns = new Set(
      elementsByName(paragraph, 'hyperlink')
        .flatMap((hyperlink) => elementsByName(hyperlink, 'r')),
    );
    const strongCodeProperties = directChild(
      elementsByName(paragraph, 'r')
        .find((run) => {
          const text = elementsByName(run, 't')
            .map((node) => node.textContent)
            .join('');
          return text === 'code' && !hyperlinkRuns.has(run);
        })!,
      'rPr',
    )!;
    expect(directChild(strongCodeProperties, 'b')).toBeDefined();
    expect(wordAttribute(directChild(strongCodeProperties, 'sz')!, 'val'))
      .toBe('19');
    expect(wordAttribute(directChild(strongCodeProperties, 'color')!, 'val'))
      .toBe('9B1C1C');

    const boldItalicCodeProperties = directChild(
      findRun(paragraph, 'codeBoth'),
      'rPr',
    )!;
    expect(directChild(boldItalicCodeProperties, 'b')).toBeDefined();
    expect(directChild(boldItalicCodeProperties, 'i')).toBeDefined();
    expect(wordAttribute(
      directChild(boldItalicCodeProperties, 'sz')!,
      'val',
    )).toBe('19');
    expect(wordAttribute(
      directChild(boldItalicCodeProperties, 'color')!,
      'val',
    )).toBe('9B1C1C');

    const hyperlink = elementsByName(paragraph, 'hyperlink')
      .find((candidate) => paragraphText(candidate) === 'bold and code')!;
    expect(hyperlink).toBeDefined();
    const relationship = getExternalRelationship(relationships, hyperlink);
    expect(relationship.getAttribute('Target'))
      .toBe('https://example.com/nested');
    expect(relationship.getAttribute('TargetMode')).toBe('External');

    const linkedBoldProperties = directChild(findRun(hyperlink, 'bold'), 'rPr')!;
    expect(directChild(linkedBoldProperties, 'b')).toBeDefined();
    const linkedCodeProperties = directChild(findRun(hyperlink, 'code'), 'rPr')!;
    expect(wordAttribute(directChild(linkedCodeProperties, 'sz')!, 'val'))
      .toBe('19');
    expect(wordAttribute(directChild(linkedCodeProperties, 'color')!, 'val'))
      .toBe('9B1C1C');

    const italicProperties = directChild(findRun(paragraph, 'italic'), 'rPr')!;
    expect(directChild(italicProperties, 'i')).toBeDefined();
  });

  it('遞迴行內格式可由 heading、callout 與 table 共用', async () => {
    const { blocks } = parseMarkdown([
      '## ***混合標題***',
      '',
      '> [!NOTE]',
      '> **提示 `code`**',
      '',
      '| 欄位 | 說明 |',
      '| --- | --- |',
      '| **粗體** | [文件](https://example.com/table) |',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const relationships = parseXml(await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    ));

    const heading = findParagraph(document, '混合標題');
    expect(paragraphStyleId(heading)).toBe('Heading2');
    const headingProperties = directChild(findRun(heading, '混合標題'), 'rPr')!;
    expect(directChild(headingProperties, 'b')).toBeDefined();
    expect(directChild(headingProperties, 'i')).toBeDefined();

    const callout = findParagraphContaining(document, '提示 code');
    const calloutCodeProperties = directChild(findRun(callout, 'code'), 'rPr')!;
    expect(directChild(calloutCodeProperties, 'b')).toBeDefined();
    expect(wordAttribute(directChild(calloutCodeProperties, 'sz')!, 'val'))
      .toBe('19');

    const tableBoldProperties = directChild(
      findRun(findParagraph(document, '粗體'), '粗體'),
      'rPr',
    )!;
    expect(directChild(tableBoldProperties, 'b')).toBeDefined();

    const tableLinkParagraph = findParagraph(document, '文件');
    const tableHyperlink = elementsByName(tableLinkParagraph, 'hyperlink')[0];
    const tableRelationship = getExternalRelationship(
      relationships,
      tableHyperlink,
    );
    expect(tableRelationship.getAttribute('Target'))
      .toBe('https://example.com/table');
    expect(tableRelationship.getAttribute('TargetMode')).toBe('External');
  });

  it('level 0 到 2 清單繼承 Normal 樣式並引用合法 numbering', async () => {
    const listBlocks: ParsedBlock[] = [
      ...[0, 1, 2].map((nestingLevel) => ({
        type: BlockType.NUMBERED_LIST,
        content: `編號層級 ${nestingLevel}`,
        nestingLevel,
      })),
      ...[0, 1, 2].map((nestingLevel) => ({
        type: BlockType.BULLET_LIST,
        content: `項目層級 ${nestingLevel}`,
        nestingLevel,
      })),
    ];
    const blob = await generateDocx(listBlocks, {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });
    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const styles = parseXml(await readDocxXml(blob, 'word/styles.xml'));
    const numbering = parseXml(await readDocxXml(blob, 'word/numbering.xml'));
    const numberingInstances = new Map(
      elementsByName(numbering, 'num').map((element) => [
        wordAttribute(element, 'numId'),
        wordAttribute(directChild(element, 'abstractNumId')!, 'val'),
      ]),
    );
    const abstractNumberingLevels = new Map(
      elementsByName(numbering, 'abstractNum').map((element) => [
        wordAttribute(element, 'abstractNumId'),
        new Set(
          elementsByName(element, 'lvl')
            .map((level) => wordAttribute(level, 'ilvl')),
        ),
      ]),
    );

    for (const block of listBlocks) {
      const paragraph = findParagraph(document, block.content);
      const paragraphProperties = directChild(paragraph, 'pPr')!;
      const numberingProperties = directChild(paragraphProperties, 'numPr')!;
      const level = directChild(numberingProperties, 'ilvl')!;
      const numberingId = directChild(numberingProperties, 'numId')!;

      expect(paragraphStyleId(paragraph)).toBe('Normal');
      const listSpacing = directChild(paragraphProperties, 'spacing')!;
      expect(wordAttribute(listSpacing, 'after')).toBe('80');
      expect(wordAttribute(listSpacing, 'line')).toBe('300');
      expect(wordAttribute(level, 'val')).toBe(String(block.nestingLevel));
      const abstractNumberingId = numberingInstances.get(
        wordAttribute(numberingId, 'val'),
      );
      expect(abstractNumberingId).toBeDefined();
      expect(abstractNumberingLevels.get(abstractNumberingId!))
        .toContain(String(block.nestingLevel));
    }

    const normalStyle = getStyle(styles, 'Normal');
    const spacing = elementsByName(normalStyle, 'spacing')[0];
    expect(wordAttribute(spacing, 'before')).toBe('0');
    expect(wordAttribute(spacing, 'after')).toBe('120');
    expect(wordAttribute(spacing, 'line')).toBe('300');
  });
});
