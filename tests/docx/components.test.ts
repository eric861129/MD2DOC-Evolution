import mermaid from 'mermaid';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateDocx } from '../../services/docxGenerator';
import { BlockType, type ParsedBlock } from '../../services/types';
import { listDocxEntries, readDocxXml } from '../helpers/readDocx';

const LARGE_PNG_DATA_URL = [
  'data:image/png;base64,',
  'iVBORw0KGgoAAAANSUhEUgAAAlgAAAEsCAYAAAAfPc2WAAAC0ElEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwbP5CAAFzCKwhAAAAAElFTkSuQmCC',
].join('');

const ONE_PIXEL_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const JPEG_WITH_DIMENSIONS_DATA_URL = [
  'data:image/jpeg;base64,',
  '/9j/wAARCAABAAEDASIAAhEBAxEB/9k=',
].join('');

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

const styledBodyParagraphs = (
  document: Document,
  styleId: string,
): Element[] => bodyParagraphs(document)
  .filter((paragraph) => {
    const style = directChild(paragraphProperties(paragraph), 'pStyle');
    return style && wordAttribute(style, 'val') === styleId;
  });

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
    expect(wordAttribute(border!, 'space')).toBe('6');
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
      .find((paragraph) => paragraphText(paragraph) === `${label} `);
    expect(labelParagraph, `${label} label`).toBeDefined();

    const calloutParagraphs = styledBodyParagraphs(document, 'Callout');
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

  it('Callout 每個連續來源實體行各自成段且保留巢狀行內格式', async () => {
    const blob = await generateDocx([{
      type: BlockType.CALLOUT_IMPORTANT,
      content: [
        '第一行有 **粗體**。',
        '第二行有 [**官方** `文件`](https://example.com/docs)。',
      ].join('\n'),
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const relationships = parseXml(await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    ));
    const calloutParagraphs = styledBodyParagraphs(document, 'Callout');
    expect(calloutParagraphs.map(paragraphText)).toEqual([
      'IMPORTANT ',
      '第一行有 粗體。',
      '第二行有 官方 文件。',
    ]);
    expect(calloutParagraphs.flatMap((paragraph) =>
      elementsByName(paragraph, 'br')
    )).toHaveLength(0);

    const boldRun = elementsByName(calloutParagraphs[1], 'r')
      .find((run) => paragraphText(run) === '粗體');
    expect(directChild(directChild(boldRun!, 'rPr')!, 'b')).toBeDefined();

    const hyperlink = elementsByName(calloutParagraphs[2], 'hyperlink')[0];
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

  it('Callout 保留來源空白實體行為空的 styled/shaded paragraph', async () => {
    const blob = await generateDocx([{
      type: BlockType.CALLOUT_IMPORTANT,
      content: '第一行\n\n第三行',
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const calloutParagraphs = styledBodyParagraphs(document, 'Callout');
    expect(calloutParagraphs.map(paragraphText)).toEqual([
      'IMPORTANT ',
      '第一行',
      '',
      '第三行',
    ]);

    for (const paragraph of calloutParagraphs) {
      expect(wordAttribute(getParagraphProperty(paragraph, 'shd'), 'fill'))
        .toBe('EEF4FB');
      const indent = getParagraphProperty(paragraph, 'ind');
      expect(wordAttribute(indent, 'left')).toBe('230');
      expect(wordAttribute(indent, 'right')).toBe('230');
    }
  });

  it('空內容 Callout 只輸出權威 label 且不製造假內容段落', async () => {
    const blob = await generateDocx([{
      type: BlockType.CALLOUT_IMPORTANT,
      content: '',
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    expect(styledBodyParagraphs(document, 'Callout').map(paragraphText))
      .toEqual(['IMPORTANT ']);
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
        paragraph: findParagraph(document, 'Left：左側內容'),
        fill: 'F2F2F2',
        indent: { left: null, right: '1440' },
        border: 'dotted',
        keepNext: false,
      },
      {
        paragraph: findParagraph(document, 'Right：右側內容'),
        fill: 'FFFFFF',
        indent: { left: '1440', right: null },
        border: 'dashed',
        keepNext: true,
      },
      {
        paragraph: findParagraph(document, 'Center：置中內容'),
        fill: 'F8FAFC',
        indent: { left: '720', right: '720' },
        border: 'double',
        keepNext: false,
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
      expect(wordAttribute(spacing, 'line')).toBe('300');
      expect(directChild(paragraphProperties(testCase.paragraph), 'keepLines'))
        .toBeDefined();
      expect(Boolean(directChild(
        paragraphProperties(testCase.paragraph),
        'keepNext',
      ))).toBe(testCase.keepNext);
      expect(elementsByName(testCase.paragraph, 'br')).toHaveLength(0);
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

  it('Packer 依實際格式封裝圖片並寫入完整替代資訊與 Content Types', async () => {
    const imageRegistry = {
      png: LARGE_PNG_DATA_URL,
      jpeg: JPEG_WITH_DIMENSIONS_DATA_URL,
      gif: ONE_PIXEL_GIF_DATA_URL,
    };
    const blob = await generateDocx([
      {
        type: BlockType.IMAGE,
        content: 'png',
        metadata: { alt: '架構圖', title: '系統架構' },
      },
      {
        type: BlockType.IMAGE,
        content: 'jpeg',
        metadata: { alt: '操作畫面', title: '操作畫面範例' },
      },
      {
        type: BlockType.IMAGE,
        content: 'gif',
        metadata: { alt: '流程動畫', title: '流程動畫範例' },
      },
    ], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
      imageRegistry,
    });

    const entries = await listDocxEntries(blob);
    const mediaEntries = entries.filter((entry) =>
      /^word\/media\/[^/]+$/.test(entry)
    );
    expect(mediaEntries).toHaveLength(3);
    expect(mediaEntries.every((entry) =>
      /\.(?:png|jpe?g|gif)$/i.test(entry)
    )).toBe(true);
    expect(entries.some((entry) => entry.endsWith('.undefined'))).toBe(false);

    const contentTypes = parseXml(await readDocxXml(blob, '[Content_Types].xml'));
    const defaults = Array.from(contentTypes.getElementsByTagName('Default'));
    for (const mediaEntry of mediaEntries) {
      const extension = mediaEntry.split('.').pop()!.toLowerCase();
      const declaration = defaults.find((candidate) =>
        candidate.getAttribute('Extension')?.toLowerCase() === extension
      );
      expect(declaration, extension).toBeDefined();
      expect(declaration?.getAttribute('ContentType')).toBe(
        extension === 'png'
          ? 'image/png'
          : extension === 'gif'
            ? 'image/gif'
            : 'image/jpeg',
      );
    }

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const imageProperties = Array.from(
      document.getElementsByTagName('wp:docPr'),
    );
    expect(imageProperties).toHaveLength(3);
    expect(imageProperties.map((element) => ({
      description: element.getAttribute('descr'),
      title: element.getAttribute('title'),
    }))).toEqual([
      { description: '架構圖', title: '系統架構' },
      { description: '操作畫面', title: '操作畫面範例' },
      { description: '流程動畫', title: '流程動畫範例' },
    ]);

    const firstExtent = document.getElementsByTagName('wp:extent')[0];
    expect(firstExtent.getAttribute('cx')).toBe('4680000');
    expect(firstExtent.getAttribute('cy')).toBe('2340000');
    expect(styledBodyParagraphs(document, 'BookCaption').map(paragraphText))
      .toEqual([
        '圖 1 架構圖',
        '圖 2 操作畫面',
        '圖 3 流程動畫',
      ]);
  });

  it('獨立 QR 產生 2.6 公分置中圖片與 9pt 紅色可點 label', async () => {
    const url = 'https://github.com/example/repo';
    const blob = await generateDocx([{
      type: BlockType.QR,
      content: 'GitHub 原始碼',
      metadata: { url, label: 'GitHub 原始碼' },
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
    });

    const entries = await listDocxEntries(blob);
    expect(entries.filter((entry) =>
      /^word\/media\/[^/]+\.png$/i.test(entry)
    )).toHaveLength(1);

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const paragraphs = bodyParagraphs(document);
    expect(paragraphs).toHaveLength(2);
    expect(wordAttribute(getParagraphProperty(paragraphs[0], 'jc'), 'val'))
      .toBe('center');
    const extent = document.getElementsByTagName('wp:extent')[0];
    expect(extent.getAttribute('cx')).toBe('936000');
    expect(extent.getAttribute('cy')).toBe('936000');

    const qrProperties = document.getElementsByTagName('wp:docPr')[0];
    expect(qrProperties.getAttribute('descr')).toBe('GitHub 原始碼 QR Code');
    expect(qrProperties.getAttribute('title')).toBe('GitHub 原始碼');

    const labelParagraph = paragraphs[1];
    expect(wordAttribute(getParagraphProperty(labelParagraph, 'jc'), 'val'))
      .toBe('center');
    const hyperlink = elementsByName(labelParagraph, 'hyperlink')[0];
    expect(hyperlink).toBeDefined();
    const labelRun = elementsByName(hyperlink, 'r')[0];
    expect(wordAttribute(directChild(directChild(labelRun, 'rPr')!, 'sz')!, 'val'))
      .toBe('18');
    expect(wordAttribute(directChild(directChild(labelRun, 'rPr')!, 'color')!, 'val'))
      .toBe('9B1C1C');

    const relationships = parseXml(await readDocxXml(
      blob,
      'word/_rels/document.xml.rels',
    ));
    const relationshipId = hyperlink.getAttribute('r:id');
    const relationship = Array.from(
      relationships.getElementsByTagName('Relationship'),
    ).find((candidate) => candidate.getAttribute('Id') === relationshipId);
    expect(relationship?.getAttribute('Target')).toBe(url);
  });

  it('QR 產生失敗時保留可點 label、回報 warning 且不封裝假媒體', async () => {
    const warnings: unknown[] = [];
    const url = `https://example.com/${'a'.repeat(5000)}`;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(
      () => undefined,
    );
    let blob: Blob;
    try {
      blob = await generateDocx([{
        type: BlockType.QR,
        content: '過長網址',
        metadata: { url, label: '過長網址' },
      }], {
        exportSettings: publisherExportSettings,
        showLineNumbers: false,
        onWarning: (warning) => warnings.push(warning),
      });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }

    expect(warnings).toEqual([
      expect.objectContaining({
        code: 'QR_GENERATION_FAILED',
        message: expect.any(String),
        url,
      }),
    ]);
    expect((await listDocxEntries(blob)).filter((entry) =>
      entry.startsWith('word/media/')
    )).toHaveLength(0);

    const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
    const labelParagraph = findParagraph(document, '過長網址');
    expect(elementsByName(labelParagraph, 'hyperlink')).toHaveLength(1);
  });

  it('Mermaid 成功時沿用圖片寬度、格式與 alt/title 封裝規則', async () => {
    const renderSpy = vi.spyOn(mermaid, 'render').mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"></svg>',
      diagramType: 'flowchart',
    });
    const originalImage = globalThis.Image;
    class LoadedImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.(new Event('load')));
      }
    }
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: LoadedImage,
    });

    const createElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement')
      .mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const element = createElement(tagName, options);
        if (tagName.toLowerCase() === 'canvas') {
          Object.defineProperty(element, 'getContext', {
            configurable: true,
            value: () => ({
              fillStyle: '',
              fillRect: () => undefined,
              drawImage: () => undefined,
            }),
          });
          Object.defineProperty(element, 'toBlob', {
            configurable: true,
            value: (callback: BlobCallback) => {
              const base64 = LARGE_PNG_DATA_URL.split(',')[1];
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
              }
              const arrayBuffer = bytes.buffer.slice(
                bytes.byteOffset,
                bytes.byteOffset + bytes.byteLength,
              ) as ArrayBuffer;
              callback(new Blob([arrayBuffer], { type: 'image/png' }));
            },
          });
        }
        return element;
      }) as typeof document.createElement);

    try {
      const blob = await generateDocx([{
        type: BlockType.MERMAID,
        content: 'graph TD; A-->B;',
        metadata: {
          alt: '部署流程圖',
          title: '部署流程',
        },
      }], {
        exportSettings: publisherExportSettings,
        showLineNumbers: false,
      });

      const mediaEntries = (await listDocxEntries(blob)).filter((entry) =>
        /^word\/media\/[^/]+$/.test(entry)
      );
      expect(mediaEntries).toHaveLength(1);
      expect(mediaEntries[0]).toMatch(/\.png$/);

      const document = parseXml(await readDocxXml(blob, 'word/document.xml'));
      const imageProperties = document.getElementsByTagName('wp:docPr')[0];
      expect(imageProperties.getAttribute('descr')).toBe('部署流程圖');
      expect(imageProperties.getAttribute('title')).toBe('部署流程');
      const extent = document.getElementsByTagName('wp:extent')[0];
      expect(extent.getAttribute('cx')).toBe('4680000');
      expect(extent.getAttribute('cy')).toBe('2340000');
    } finally {
      createElementSpy.mockRestore();
      renderSpy.mockRestore();
      Object.defineProperty(globalThis, 'Image', {
        configurable: true,
        value: originalImage,
      });
    }
  });

  it('Mermaid 失敗時回報 warning 且不封裝假媒體', async () => {
    const warnings: unknown[] = [];
    const blob = await generateDocx([{
      type: BlockType.MERMAID,
      content: 'not a mermaid diagram',
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
      onWarning: (warning) => warnings.push(warning),
    });

    expect(warnings).toEqual([
      expect.objectContaining({
        code: 'MERMAID_GENERATION_FAILED',
        message: expect.any(String),
      }),
    ]);
    expect((await listDocxEntries(blob)).filter((entry) =>
      /^word\/media\/[^/]+$/.test(entry)
    )).toHaveLength(0);
    expect(await readDocxXml(blob, 'word/document.xml'))
      .toContain('[Mermaid Chart Error]');
  });

  it('MIME 與 magic bytes 衝突時拒絕匯出', async () => {
    const gifPayload = ONE_PIXEL_GIF_DATA_URL.split(',')[1];
    await expect(generateDocx([{
      type: BlockType.IMAGE,
      content: 'conflict',
      metadata: { alt: '衝突圖片', title: '衝突圖片' },
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
      imageRegistry: {
        conflict: `data:image/png;base64,${gifPayload}`,
      },
    })).rejects.toThrow(/MIME.*magic bytes.*不一致/);

    const pngPayload = LARGE_PNG_DATA_URL.split(',')[1];
    await expect(generateDocx([{
      type: BlockType.IMAGE,
      content: 'unsupported-mime',
      metadata: { alt: '錯誤 MIME', title: '錯誤 MIME' },
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
      imageRegistry: {
        'unsupported-mime': `data:image/webp;base64,${pngPayload}`,
      },
    })).rejects.toThrow(/不支援的圖片 MIME/);
  });

  it('未知媒體格式在 Packer 前明確拒絕且不會產生 undefined 副檔名', async () => {
    await expect(generateDocx([{
      type: BlockType.IMAGE,
      content: 'unknown',
      metadata: { alt: '未知圖片', title: '未知圖片' },
    }], {
      exportSettings: publisherExportSettings,
      showLineNumbers: false,
      imageRegistry: {
        unknown: 'data:image/webp;base64,UklGRgAAAAA=',
      },
    })).rejects.toThrow(/不支援的圖片 (?:格式|MIME)/);
  });
});
