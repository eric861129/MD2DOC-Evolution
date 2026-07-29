import { beforeAll, describe, expect, it } from 'vitest';
import { generateDocx } from '../services/docxGenerator';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';
import { listDocxEntries, readDocxXml } from './helpers/readDocx';

const publisherBlocks = [
  { type: BlockType.HEADING_1, content: 'Title' },
  { type: BlockType.PARAGRAPH, content: 'Hello world' },
  { type: BlockType.BULLET_LIST, content: 'Item 1' },
];

const getSettingsChildNames = (settingsXml: string): string[] => {
  const settingsDocument = new DOMParser().parseFromString(
    settingsXml,
    'application/xml',
  );
  return Array.from(settingsDocument.documentElement.children)
    .map((element) => element.localName);
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

describe('docxGenerator', () => {
  it('輸出可解包且套用出版社頁面、命名樣式、欄位更新與中繼資料', async () => {
    const blob = await generateDocx(publisherBlocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      meta: {
        title: '技術書稿',
        author: '黃祈豫',
        header: true,
        footer: true,
      },
      imageRegistry: {},
    });

    expect(new Uint8Array(await blob.slice(0, 2).arrayBuffer()))
      .toEqual(new Uint8Array([0x50, 0x4b]));

    const entries = await listDocxEntries(blob);
    expect(entries).toEqual(expect.arrayContaining([
      'docProps/core.xml',
      'word/document.xml',
      'word/footer1.xml',
      'word/settings.xml',
      'word/styles.xml',
    ]));
    expect(entries).not.toContain('word/header1.xml');

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toContain('Hello world');
    expect(documentXml).toMatch(
      /<w:pgSz(?=[^>]*w:w="9978")(?=[^>]*w:h="13380")[^>]*\/>/,
    );
    expect(documentXml).toMatch(
      /<w:pgMar(?=[^>]*w:top="1191")(?=[^>]*w:right="1304")(?=[^>]*w:bottom="1191")(?=[^>]*w:left="1304")(?=[^>]*w:header="708")(?=[^>]*w:footer="708")(?=[^>]*w:gutter="0")[^>]*\/>/,
    );

    const stylesXml = await readDocxXml(blob, 'word/styles.xml');
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="CodeBlock"/);
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="Callout"/);
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="BookCaption"/);

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:updateFields(?:\s+w:val="true")?\s*\/>/);

    const coreXml = await readDocxXml(blob, 'docProps/core.xml');
    expect(coreXml).toContain('<dc:title>技術書稿</dc:title>');
    expect(coreXml).toContain('<dc:creator>黃祈豫</dc:creator>');

    const footerXml = await readDocxXml(blob, 'word/footer1.xml');
    expect(footerXml).not.toContain('技術書稿');
    expect(footerXml).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);
  });

  it('出版社輸出移除非列印分頁標記，但只保留真正清單的編號屬性', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.HEADING_1,
        content: '下一頁標題',
        metadata: { pageBreakBefore: true },
      },
      { type: BlockType.PARAGRAPH, content: '一般段落' },
      {
        type: BlockType.CHAT_CUSTOM,
        role: '設計師',
        alignment: 'left',
        content: '對話內容',
      },
      { type: BlockType.BULLET_LIST, content: '真正的無序清單' },
    ], {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    const stylesXml = await readDocxXml(blob, 'word/styles.xml');
    const markerPattern =
      /<w:(?:keepNext|keepLines|pageBreakBefore|suppressLineNumbers)(?:\s[^>]*)?\/>/;

    expect(documentXml).not.toMatch(markerPattern);
    expect(stylesXml).not.toMatch(markerPattern);
    expect(documentXml.match(/<w:numPr>/g)).toHaveLength(1);
    expect(documentXml.match(/<w:br w:type="page"\/>/g)).toHaveLength(1);
  });

  it('鏡像邊界在 section 寫入裝訂預留並於 settings 啟用鏡像頁邊界', async () => {
    const blob = await generateDocx([], {
      exportSettings: {
        profileId: 'publisher-binding',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-binding',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toMatch(
      /<w:pgMar(?=[^>]*w:top="1134")(?=[^>]*w:right="1020")(?=[^>]*w:bottom="1247")(?=[^>]*w:left="1247")(?=[^>]*w:gutter="283")[^>]*\/>/,
    );

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:mirrorMargins(?:\s[^>]*)?\/>/);
    expect(settingsXml).not.toContain('<w:gutterAtTop');
    const settingsChildNames = getSettingsChildNames(settingsXml);
    const displayBackgroundIndex = settingsChildNames.indexOf('displayBackgroundShape');
    const mirrorMarginsIndex = settingsChildNames.indexOf('mirrorMargins');
    expect(mirrorMarginsIndex).toBe(displayBackgroundIndex + 1);
    expect(mirrorMarginsIndex).toBeLessThan(settingsChildNames.indexOf('updateFields'));
    expect(mirrorMarginsIndex).toBeLessThan(settingsChildNames.indexOf('compat'));
  });

  it('上方裝訂預留在 settings 啟用 gutterAtTop 且不誤啟用鏡像邊界', async () => {
    const blob = await generateDocx([], {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'custom',
        customMargins: {
          mode: 'standard',
          topCm: 2,
          rightCm: 2,
          bottomCm: 2,
          leftCm: 2,
          gutterCm: 0.5,
          gutterPosition: 'top',
        },
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toMatch(/<w:pgMar(?=[^>]*w:gutter="283")[^>]*\/>/);

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:gutterAtTop(?:\s[^>]*)?\/>/);
    expect(settingsXml).not.toContain('<w:mirrorMargins');
    const settingsChildNames = getSettingsChildNames(settingsXml);
    const displayBackgroundIndex = settingsChildNames.indexOf('displayBackgroundShape');
    const gutterAtTopIndex = settingsChildNames.indexOf('gutterAtTop');
    expect(gutterAtTopIndex).toBe(displayBackgroundIndex + 1);
    expect(gutterAtTopIndex).toBeLessThan(settingsChildNames.indexOf('updateFields'));
    expect(gutterAtTopIndex).toBeLessThan(settingsChildNames.indexOf('compat'));
  });

  it('出版社裝訂版以 CodeBlock 段落輸出程式碼且目錄使用動態 Word 欄位', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.CODE_BLOCK,
        content: 'const answer = 42;',
        metadata: { showLineNumbers: false, language: 'typescript' },
      },
      {
        type: BlockType.TOC,
        content: '第一章 1',
      },
    ], {
      exportSettings: {
        profileId: 'publisher-binding',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-binding',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).not.toContain('<w:tbl');
    expect(documentXml).toMatch(
      /<w:pStyle w:val="CodeBlock"\/>[\s\S]*?<w:shd w:fill="F4F6F9"\/>[\s\S]*?<w:ind(?=[^>]*w:left="230")(?=[^>]*w:right="230")[^>]*\/>/,
    );
    expect(documentXml).toContain('<w:sdt>');
    expect(documentXml).toMatch(/TOC \\h \\o (?:&quot;|")1-3(?:&quot;|")/);
    expect(documentXml).not.toContain('<w:tabs>');
  });

  it('上方裝訂預留仍以 CodeBlock 段落輸出且目錄使用動態 Word 欄位', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.CODE_BLOCK,
        content: 'const topGutter = true;',
        metadata: { showLineNumbers: false },
      },
      {
        type: BlockType.TOC,
        content: '上方裝訂 1',
      },
    ], {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'custom',
        customMargins: {
          mode: 'standard',
          topCm: 2,
          bottomCm: 2,
          leftCm: 2,
          rightCm: 2,
          gutterCm: 0.5,
          gutterPosition: 'top',
        },
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).not.toContain('<w:tbl');
    expect(documentXml).toMatch(
      /<w:pStyle w:val="CodeBlock"\/>[\s\S]*?<w:shd w:fill="F4F6F9"\/>[\s\S]*?<w:ind(?=[^>]*w:left="230")(?=[^>]*w:right="230")[^>]*\/>/,
    );
    expect(documentXml).toContain('<w:sdt>');
    expect(documentXml).toMatch(/TOC \\h \\o (?:&quot;|")1-3(?:&quot;|")/);
    expect(documentXml).not.toContain('<w:tabs>');
  });

  it('technical-legacy 保持頁首書名與頁尾僅頁碼的既有行為', async () => {
    const blob = await generateDocx([{
      type: BlockType.HEADING_1,
      content: '舊版分頁標題',
      metadata: { pageBreakBefore: true },
    }], {
      exportSettings: {
        profileId: 'technical-legacy',
        pageSizeId: 'tech',
        marginPresetId: 'standard',
      },
      showLineNumbers: false,
      meta: {
        title: '舊版技術書稿',
        header: true,
        footer: true,
      },
    });

    const headerXml = await readDocxXml(blob, 'word/header1.xml');
    expect(headerXml).toContain('舊版技術書稿');

    const footerXml = await readDocxXml(blob, 'word/footer1.xml');
    expect(footerXml).not.toContain('舊版技術書稿');
    expect(footerXml).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    const stylesXml = await readDocxXml(blob, 'word/styles.xml');
    const markerPattern =
      /<w:(?:keepNext|keepLines|pageBreakBefore|suppressLineNumbers)(?:\s[^>]*)?\/>/;

    expect(documentXml).not.toMatch(markerPattern);
    expect(stylesXml).not.toMatch(markerPattern);
    expect(documentXml).toMatch(/<w:br w:type="page"\/>/);
  });

  it('technical-legacy 章首頁移除黑方塊格式標記，只有 goals 保留真正的清單符號', async () => {
    const blob = await generateDocx([
      { type: BlockType.PARAGRAPH, content: '目錄之後的前置內容' },
      {
        type: BlockType.CHAPTER_OPENER,
        content: '章首頁',
        metadata: {
          chapter: {
            number: '01',
            part: '第一部：建立觀測站',
            title: '點亮第一張星圖',
            englishTitle: 'Lighting the First Star Map',
            summary: '章首頁摘要。',
            goals: ['理解文件 Profile。', '完成公開範例。'],
          },
        },
      },
    ], {
      exportSettings: {
        profileId: 'technical-legacy',
        pageSizeId: 'tech',
        marginPresetId: 'standard',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    const stylesXml = await readDocxXml(blob, 'word/styles.xml');
    const markerPattern =
      /<w:(?:keepNext|keepLines|pageBreakBefore|suppressLineNumbers)(?:\s[^>]*)?\/>/;

    expect(documentXml).not.toMatch(markerPattern);
    expect(stylesXml).not.toMatch(markerPattern);
    expect(documentXml.match(/<w:numPr>/g)).toHaveLength(2);
    expect(documentXml.match(/<w:br w:type="page"\/>/g)).toHaveLength(1);
  });

  it('publisher [TOC] 產生 heading 1–3 hyperlink 欄位並觀察緊鄰手填內容 warning', async () => {
    const warnings: unknown[] = [];
    const { blocks } = parseMarkdown([
      '[TOC]',
      '- 第一章 1',
      '- 第二章 8',
      '',
      '普通正文中的第一章 1 不在重複目錄偵測範圍',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      onWarning: (warning) => warnings.push(warning),
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    const document = new DOMParser().parseFromString(
      documentXml,
      'application/xml',
    );
    const instructions = Array.from(
      document.getElementsByTagName('w:instrText'),
    ).map((element) => element.textContent ?? '');
    expect(instructions).toContain('TOC \\h \\o "1-3"');
    expect(document.getElementsByTagName('w:sdt')).toHaveLength(1);
    expect(documentXml).not.toContain('第二章 8');
    expect(documentXml).toContain('普通正文中的第一章1');
    expect(warnings).toEqual([
      expect.objectContaining({
        code: 'PUBLISHER_TOC_MANUAL_CONTENT',
        message: expect.stringContaining('手填目錄'),
      }),
    ]);

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:updateFields(?:\s+w:val="true")?\s*\/>/);
  });

  it('publisher 空白 [TOC] 與普通正文不會誤報手填目錄 warning', async () => {
    const warnings: unknown[] = [];
    const { blocks } = parseMarkdown([
      '[TOC]',
      '第一章 1 是普通正文，不是手填目錄。',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      onWarning: (warning) => warnings.push(warning),
    });

    expect(warnings).toEqual([]);
    expect(await readDocxXml(blob, 'word/document.xml'))
      .toContain('第一章1是普通正文，不是手填目錄。');
  });

  it.each([
    [
      '空白行後的普通清單',
      ['[TOC]', '', '- 安裝需求', '- 執行步驟'].join('\n'),
    ],
    [
      '直接相鄰但沒有頁碼的普通清單',
      ['[TOC]', '- 安裝需求', '- 執行步驟'].join('\n'),
    ],
  ])('publisher %s 保留清單且不回報手填目錄 warning', async (
    _caseName,
    markdown,
  ) => {
    const warnings: unknown[] = [];
    const { blocks } = parseMarkdown(markdown);
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      onWarning: (warning) => warnings.push(warning),
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toContain('安裝需求');
    expect(documentXml).toContain('執行步驟');
    expect(warnings).toEqual([]);
  });

  it('technical-legacy 完整保留手動目錄段落與定位點', async () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '- 第一章 1',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'technical-legacy',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toContain('目 錄');
    expect(documentXml).toContain('第一章');
    expect(documentXml).toMatch(
      /<w:tab(?=[^>]*w:val="right")(?=[^>]*w:leader="dot")[^>]*\/>/,
    );
    expect(documentXml).not.toContain('<w:sdt');
  });

  it('heading bookmark 名稱唯一、確定且不破壞樣式與行內格式', async () => {
    const blocks = [
      { type: BlockType.HEADING_1, content: 'Release **Plan**' },
      { type: BlockType.HEADING_2, content: 'Release Plan' },
      { type: BlockType.HEADING_3, content: '純中文標題' },
      { type: BlockType.HEADING_2, content: 'C# / .NET 8 工具' },
      {
        type: BlockType.HEADING_1,
        content: 'An extremely long heading title that must remain deterministic after truncation',
      },
    ];
    const options = {
      exportSettings: {
        profileId: 'publisher-exact' as const,
        pageSizeId: 'tech' as const,
        marginPresetId: 'publisher-exact' as const,
      },
      showLineNumbers: false,
    };

    const firstBlob = await generateDocx(blocks, options);
    const secondBlob = await generateDocx(blocks, options);
    const readBookmarkNames = async (blob: Blob): Promise<string[]> => {
      const document = new DOMParser().parseFromString(
        await readDocxXml(blob, 'word/document.xml'),
        'application/xml',
      );
      return Array.from(document.getElementsByTagName('w:bookmarkStart'))
        .map((bookmark) =>
          bookmark.getAttribute('w:name') ?? bookmark.getAttribute('name') ?? ''
        );
    };
    const firstNames = await readBookmarkNames(firstBlob);
    const secondNames = await readBookmarkNames(secondBlob);

    expect(firstNames).toEqual([
      'h1_release_plan_1',
      'h2_release_plan_2',
      'h3_heading_3_3',
      'h2_c_net_8_4',
      expect.stringMatching(/^h1_an_extremely_long_heading_[a-z0-9_]*_5$/),
    ]);
    expect(secondNames).toEqual(firstNames);
    expect(new Set(firstNames).size).toBe(firstNames.length);
    expect(firstNames.every((name) =>
      /^[A-Za-z0-9_]+$/.test(name) && name.length <= 40
    )).toBe(true);

    const document = new DOMParser().parseFromString(
      await readDocxXml(firstBlob, 'word/document.xml'),
      'application/xml',
    );
    const firstHeading = Array.from(document.getElementsByTagName('w:p'))
      .find((paragraph) => paragraph.textContent?.includes('Release Plan'));
    expect(firstHeading).toBeDefined();
    expect(firstHeading!.getElementsByTagName('w:pStyle')[0]
      .getAttribute('w:val')).toBe('Heading1');
    expect(firstHeading!.getElementsByTagName('w:bookmarkStart')).toHaveLength(1);
    const planRun = Array.from(firstHeading!.getElementsByTagName('w:r'))
      .find((run) => run.textContent === 'Plan');
    expect(planRun?.getElementsByTagName('w:b')).toHaveLength(1);
  });

  it('chapter 與 heading 共用文件級 bookmark allocator 且 start/end 一一配對', async () => {
    const repeatedLongNumber = 'Appendix-This-Is-An-Extremely-Long-Chapter-Number';
    const blocks = [
      {
        type: BlockType.CHAPTER_OPENER,
        content: '第一個附錄',
        metadata: {
          chapter: {
            number: repeatedLongNumber,
            title: '第一個附錄',
            goals: [],
          },
        },
      },
      { type: BlockType.HEADING_1, content: 'Shared allocator heading' },
      {
        type: BlockType.CHAPTER_OPENER,
        content: '第二個附錄',
        metadata: {
          chapter: {
            number: repeatedLongNumber,
            title: '第二個附錄',
            goals: [],
          },
        },
      },
      { type: BlockType.HEADING_2, content: 'Shared allocator heading' },
    ];
    const options = {
      exportSettings: {
        profileId: 'publisher-exact' as const,
        pageSizeId: 'tech' as const,
        marginPresetId: 'publisher-exact' as const,
      },
      showLineNumbers: false,
    };

    const readBookmarks = async (blob: Blob) => {
      const document = new DOMParser().parseFromString(
        await readDocxXml(blob, 'word/document.xml'),
        'application/xml',
      );
      const starts = Array.from(
        document.getElementsByTagName('w:bookmarkStart'),
      ).map((bookmark) => ({
        name: bookmark.getAttribute('w:name') ?? '',
        id: bookmark.getAttribute('w:id') ?? '',
      }));
      const ends = Array.from(
        document.getElementsByTagName('w:bookmarkEnd'),
      ).map((bookmark) => bookmark.getAttribute('w:id') ?? '');
      return { starts, ends };
    };

    const first = await readBookmarks(await generateDocx(blocks, options));
    const second = await readBookmarks(await generateDocx(blocks, options));

    expect(first).toEqual(second);
    expect(first.starts).toHaveLength(4);
    expect(first.ends).toHaveLength(4);
    expect(new Set(first.starts.map(({ id }) => id)).size).toBe(4);
    expect(new Set(first.starts.map(({ name }) => name)).size).toBe(4);
    expect(first.starts.every(({ name }) =>
      /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name)
    )).toBe(true);
    expect(first.starts.map(({ name }) => name)).toEqual([
      expect.stringMatching(/_1$/),
      expect.stringMatching(/_2$/),
      expect.stringMatching(/_3$/),
      expect.stringMatching(/_4$/),
    ]);
    for (const { id } of first.starts) {
      expect(first.ends.filter((endId) => endId === id)).toHaveLength(1);
    }
  });

  it('真實 numbering.xml 為每組相鄰有序清單建立 startOverride=1', async () => {
    const markdown = [
      '1. 第一組 A',
      '2. 第一組 B',
      '',
      '中斷段落',
      '',
      '1. 第二組 A',
      '2. 第二組 B',
      '',
      '- 無序中斷',
      '',
      '1. 第三組 A',
    ].join('\n');
    const { blocks } = parseMarkdown(markdown);
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });

    const document = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/document.xml'),
      'application/xml',
    );
    const numberedParagraphs = Array.from(document.getElementsByTagName('w:p'))
      .filter((paragraph) => paragraph.textContent?.includes('組'));
    const numIds = numberedParagraphs.map((paragraph) => {
      const numId = paragraph.getElementsByTagName('w:numId')[0];
      return numId.getAttribute('w:val') ?? numId.getAttribute('val');
    });
    expect(numIds[0]).toBe(numIds[1]);
    expect(numIds[2]).toBe(numIds[3]);
    expect(numIds[0]).not.toBe(numIds[2]);
    expect(numIds[2]).not.toBe(numIds[4]);

    const numbering = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/numbering.xml'),
      'application/xml',
    );
    for (const numId of new Set(numIds)) {
      const concreteNumbering = Array.from(
        numbering.getElementsByTagName('w:num'),
      ).find((element) =>
        (element.getAttribute('w:numId') ?? element.getAttribute('numId'))
        === numId
      );
      expect(concreteNumbering, `numId=${numId}`).toBeDefined();
      const override = concreteNumbering!
        .getElementsByTagName('w:startOverride')[0];
      expect(
        override.getAttribute('w:val') ?? override.getAttribute('val'),
      ).toBe('1');
    }
  });

  it('真實 DOCX 的外層有序清單跨巢狀 bullet 不重啟', async () => {
    const { blocks } = parseMarkdown([
      '1. Parent A',
      '   - nested bullet',
      '     1. nested ordered',
      '2. Parent B',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });
    const document = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/document.xml'),
      'application/xml',
    );
    const numIdByText = (text: string): string | null => {
      const paragraph = Array.from(document.getElementsByTagName('w:p'))
        .find((candidate) => candidate.textContent === text);
      const numId = paragraph?.getElementsByTagName('w:numId')[0];
      return numId?.getAttribute('w:val') ?? null;
    };

    expect(numIdByText('Parent A')).toBe(numIdByText('Parent B'));
    expect(numIdByText('nested ordered')).toBe(numIdByText('Parent A'));
  });

  it('numbered manual TOC 不消耗真實 DOCX 保留清單的 instance', async () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '1. 第一章 1',
      '2. 第二章 8',
      '',
      '目錄後正文',
      '',
      '1. First retained A',
      '2. First retained B',
      '',
      '群組分隔',
      '',
      '1. Second retained',
    ].join('\n'));
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });
    const document = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/document.xml'),
      'application/xml',
    );
    const paragraphs = Array.from(document.getElementsByTagName('w:p'));
    const numIdByText = (text: string): string | null => {
      const paragraph = paragraphs.find((candidate) =>
        candidate.textContent === text
      );
      const numId = paragraph?.getElementsByTagName('w:numId')[0];
      return numId?.getAttribute('w:val') ?? null;
    };
    const firstNumId = numIdByText('First retained A');
    const secondNumId = numIdByText('Second retained');

    expect(blocks.filter(({ type }) =>
      type === BlockType.NUMBERED_LIST
    ).map((block) => block.metadata?.listInstance)).toEqual([1, 1, 2]);
    expect(firstNumId).toBe(numIdByText('First retained B'));
    expect(firstNumId).not.toBe(secondNumId);

    const numbering = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/numbering.xml'),
      'application/xml',
    );
    for (const numId of [firstNumId, secondNumId]) {
      const concreteNumbering = Array.from(
        numbering.getElementsByTagName('w:num'),
      ).find((element) =>
        (element.getAttribute('w:numId') ?? element.getAttribute('numId'))
        === numId
      );
      expect(concreteNumbering).toBeDefined();
      expect(concreteNumbering!
        .getElementsByTagName('w:startOverride')[0]
        .getAttribute('w:val')).toBe('1');
    }
  });

  it.each([
    [
      'sublist 後接 code',
      [
        '- Parent',
        '  - Child',
        '  ```ts',
        '  code',
        '  ```',
      ].join('\n'),
      ['Parent', 'Child', 'code'],
    ],
    [
      'code 後接 trailing paragraph',
      [
        '- Parent',
        '  ```ts',
        '  code',
        '  ```',
        '',
        '  trailing paragraph',
      ].join('\n'),
      ['Parent', 'code', 'trailing paragraph'],
    ],
  ])('真實 DOCX 保留 list item 的 $0 順序', async (
    _caseName,
    markdown,
    expectedOrder,
  ) => {
    const { blocks } = parseMarkdown(markdown);
    const blob = await generateDocx(blocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
    });
    const document = new DOMParser().parseFromString(
      await readDocxXml(blob, 'word/document.xml'),
      'application/xml',
    );
    const targetTexts = new Set(expectedOrder);
    const actualOrder = Array.from(document.getElementsByTagName('w:p'))
      .map((paragraph) => paragraph.textContent ?? '')
      .filter((text) => targetTexts.has(text));

    expect(actualOrder).toEqual(expectedOrder);
  });
});
