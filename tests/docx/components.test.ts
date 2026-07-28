import { beforeAll, describe, expect, it } from 'vitest';
import { generateDocx } from '../../services/docxGenerator';
import { parseMarkdown } from '../../services/markdownParser';
import { BlockType, type ParsedBlock } from '../../services/types';
import { readDocxXml } from '../helpers/readDocx';

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

const directChild = (parent: Document | Element, name: string): Element | undefined =>
  Array.from(parent.children).find((element) => element.localName === name);

const wordAttribute = (element: Element, name: string): string | null =>
  element.getAttribute(`w:${name}`) ?? element.getAttribute(name);

const paragraphText = (paragraph: Element): string =>
  elementsByName(paragraph, 't').map((node) => node.textContent ?? '').join('');

const bodyParagraphs = (document: Document): Element[] => {
  const body = elementsByName(document, 'body')[0];
  return Array.from(body.children)
    .filter((element) => element.localName === 'p') as Element[];
};

const findParagraph = (document: Document, text: string): Element => {
  const paragraph = elementsByName(document, 'p')
    .find((candidate) => paragraphText(candidate) === text);
  if (!paragraph) {
    throw new Error(`找不到段落：${text}`);
  }
  return paragraph;
};

const paragraphProperties = (paragraph: Element): Element => {
  const properties = directChild(paragraph, 'pPr');
  if (!properties) {
    throw new Error(`段落缺少 pPr：${paragraphText(paragraph)}`);
  }
  return properties;
};

const getParagraphProperty = (paragraph: Element, name: string): Element => {
  const property = directChild(paragraphProperties(paragraph), name);
  if (!property) {
    throw new Error(`段落缺少 ${name}：${paragraphText(paragraph)}`);
  }
  return property;
};

const expectBorder = (
  paragraph: Element,
  expectedStyle: string,
): void => {
  const borders = getParagraphProperty(paragraph, 'pBdr');
  for (const side of ['top', 'bottom', 'left', 'right']) {
    const border = directChild(borders, side);
    expect(border, `${side} border`).toBeDefined();
    expect(wordAttribute(border!, 'val')).toBe(expectedStyle);
    expect(wordAttribute(border!, 'sz')).toBe('8');
    expect(wordAttribute(border!, 'color')).toBe('A6A6A6');
  }
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

describe('DOCX 出版元件', () => {
  it('publisher 程式碼以每行一個 CodeBlock 段落輸出且忽略標頭與行號設定', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.CODE_BLOCK,
        content: 'alpha();\n\nbeta();',
        metadata: {
          language: 'typescript',
          showLineNumbers: true,
        },
      },
    ], {
      exportSettings: publisherExportSettings,
      showLineNumbers: true,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    expect(elementsByName(document, 'tbl')).toHaveLength(0);

    const codeParagraphs = bodyParagraphs(document)
      .filter((paragraph) => wordAttribute(
        directChild(paragraphProperties(paragraph), 'pStyle')!,
        'val',
      ) === 'CodeBlock');
    expect(codeParagraphs.map(paragraphText)).toEqual([
      'alpha();',
      ' ',
      'beta();',
    ]);

    for (const paragraph of codeParagraphs) {
      expect(wordAttribute(getParagraphProperty(paragraph, 'shd'), 'fill'))
        .toBe('F4F6F9');
      const indent = getParagraphProperty(paragraph, 'ind');
      expect(wordAttribute(indent, 'left')).toBe('230');
      expect(wordAttribute(indent, 'right')).toBe('230');
    }

    const documentText = bodyParagraphs(document).map(paragraphText).join('\n');
    expect(documentText).not.toContain('TYPESCRIPT');
    expect(documentText).not.toMatch(/^1\s/m);
  });

  it('technical-legacy 保留 table renderer、語言標頭與行號', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.CODE_BLOCK,
        content: 'legacy();',
        metadata: {
          language: 'typescript',
          showLineNumbers: true,
        },
      },
    ], {
      exportSettings: legacyExportSettings,
      showLineNumbers: true,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    expect(elementsByName(document, 'tbl')).toHaveLength(1);
    expect(document.documentElement.textContent).toContain('TYPESCRIPT');
    expect(document.documentElement.textContent).toContain('1');
    expect(document.documentElement.textContent).toContain('legacy();');
  });

  it.each([
    [BlockType.CALLOUT_TIP, 'TIP', 'EEF7F0'],
    [BlockType.CALLOUT_NOTE, 'NOTE', 'F4F6F9'],
    [BlockType.CALLOUT_WARNING, 'WARNING', 'FFF4CC'],
    [BlockType.CALLOUT_IMPORTANT, 'IMPORTANT', 'EEF4FB'],
    [BlockType.CALLOUT_CAUTION, 'CAUTION', 'FDECEC'],
  ])('%s 使用 profile 語意色且不建立四邊粗框', async (type, label, fill) => {
    const blob = await generateDocx([
      { type, content: '內容' },
    ], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const labelParagraph = elementsByName(document, 'p')
      .find((paragraph) => paragraphText(paragraph).includes(label));
    expect(labelParagraph, `${label} label`).toBeDefined();

    const calloutParagraphs = bodyParagraphs(document)
      .filter((paragraph) => {
        const style = directChild(paragraphProperties(paragraph), 'pStyle');
        return style && wordAttribute(style, 'val') === 'Callout';
      });
    expect(calloutParagraphs.length).toBeGreaterThan(0);
    for (const paragraph of calloutParagraphs) {
      expect(wordAttribute(getParagraphProperty(paragraph, 'shd'), 'fill'))
        .toBe(fill);
      const indent = getParagraphProperty(paragraph, 'ind');
      expect(wordAttribute(indent, 'left')).toBe('230');
      expect(wordAttribute(indent, 'right')).toBe('230');
      expect(directChild(paragraphProperties(paragraph), 'pBdr'))
        .toBeUndefined();
    }
  });

  it('Callout 多段內容保留粗體與巢狀超連結', async () => {
    const { blocks } = parseMarkdown([
      '> [!IMPORTANT]',
      '> 第一段有 **粗體**。',
      '>',
      '> 第二段有 [**官方** `文件`](https://example.com/docs)。',
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
    const contentParagraphs = bodyParagraphs(document)
      .filter((paragraph) => paragraphText(paragraph).includes('第一段')
        || paragraphText(paragraph).includes('第二段'));
    expect(contentParagraphs).toHaveLength(2);

    const boldRun = elementsByName(contentParagraphs[0], 'r')
      .find((run) => paragraphText(run) === '粗體');
    expect(directChild(directChild(boldRun!, 'rPr')!, 'b')).toBeDefined();

    const hyperlink = elementsByName(contentParagraphs[1], 'hyperlink')[0];
    expect(hyperlink).toBeDefined();
    const relationshipId = hyperlink.getAttribute('r:id');
    const relationship = Array.from(
      relationships.getElementsByTagName('Relationship'),
    ).find((candidate) => candidate.getAttribute('Id') === relationshipId);
    expect(relationship?.getAttribute('Target'))
      .toBe('https://example.com/docs');
    expect(elementsByName(hyperlink, 'r').some((run) =>
      directChild(directChild(run, 'rPr')!, 'b') !== undefined
    )).toBe(true);
  });

  it('left、right、center 對話使用精確背景、縮排、框線與段落間距', async () => {
    const blocks: ParsedBlock[] = [
      {
        type: BlockType.CHAT_CUSTOM,
        role: 'Left',
        alignment: 'left',
        content: '左側內容',
      },
      {
        type: BlockType.CHAT_CUSTOM,
        role: 'Right',
        alignment: 'right',
        content: '右側內容',
      },
      {
        type: BlockType.CHAT_CUSTOM,
        role: 'Center',
        alignment: 'center',
        content: '置中內容',
      },
    ];
    const blob = await generateDocx(blocks, {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const cases = [
      {
        paragraph: findParagraph(document, 'Left:左側內容'),
        fill: 'F2F2F2',
        indent: { left: null, right: '1440' },
        border: 'dotted',
      },
      {
        paragraph: findParagraph(document, 'Right:右側內容'),
        fill: 'FFFFFF',
        indent: { left: '1440', right: null },
        border: 'dashed',
      },
      {
        paragraph: findParagraph(document, 'Center:置中內容'),
        fill: 'F8FAFC',
        indent: { left: '720', right: '720' },
        border: 'double',
      },
    ];

    for (const testCase of cases) {
      expect(wordAttribute(getParagraphProperty(testCase.paragraph, 'shd'), 'fill'))
        .toBe(testCase.fill);
      const indent = getParagraphProperty(testCase.paragraph, 'ind');
      expect(wordAttribute(indent, 'left')).toBe(testCase.indent.left);
      expect(wordAttribute(indent, 'right')).toBe(testCase.indent.right);
      const spacing = getParagraphProperty(testCase.paragraph, 'spacing');
      expect(wordAttribute(spacing, 'before')).toBe('400');
      expect(wordAttribute(spacing, 'after')).toBe('400');
      expectBorder(testCase.paragraph, testCase.border);
    }
  });

  it('registry 不在 code、mermaid、chat、callout、table 後插入假空白段落', async () => {
    const originalWarn = console.warn;
    console.warn = () => undefined;
    try {
      const blob = await generateDocx([
        { type: BlockType.CODE_BLOCK, content: 'code();' },
        { type: BlockType.MERMAID, content: 'not a mermaid diagram' },
        {
          type: BlockType.CHAT_CUSTOM,
          role: 'User',
          alignment: 'left',
          content: '對話',
        },
        { type: BlockType.CALLOUT_NOTE, content: '提醒' },
        {
          type: BlockType.TABLE,
          content: '',
          tableRows: [['欄位'], ['內容']],
        },
      ], {
        exportSettings: publisherExportSettings,
        showLineNumbers: false,
      });

      const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
      expect(bodyParagraphs(document).filter((paragraph) =>
        paragraphText(paragraph).trim() === ''
      )).toHaveLength(0);
    } finally {
      console.warn = originalWarn;
    }
  });
});
