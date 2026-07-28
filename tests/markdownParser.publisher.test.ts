import { describe, expect, it } from 'vitest';
import { validateExport } from '../services/exportValidation';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

describe('出版社 Markdown 語法', () => {
  it('將獨占一行且標籤以 QR: 開頭的連結解析為 QR 區塊', () => {
    const { blocks } = parseMarkdown(
      '[QR:GitHub 原始碼](https://github.com/example/repo)',
    );

    expect(blocks).toEqual([
      expect.objectContaining({
        type: BlockType.QR,
        content: 'GitHub 原始碼',
        metadata: {
          url: 'https://github.com/example/repo',
          label: 'GitHub 原始碼',
        },
      }),
    ]);
  });

  it.each([
    ['普通連結', '[GitHub](https://github.com/example/repo)'],
    ['前方有文字', '原始碼：[QR:GitHub](https://github.com/example/repo)'],
    ['後方有文字', '[QR:GitHub](https://github.com/example/repo) 原始碼'],
    ['行內連結', '請參考 [QR:GitHub](https://github.com/example/repo) 文件。'],
  ])('%s 不會誤判為 QR 區塊', (_caseName, markdown) => {
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
  });

  it('相鄰文字未以空白行分隔時仍只轉換獨占實體行的 QR', () => {
    const { blocks } = parseMarkdown([
      '前言',
      '[QR:GitHub 原始碼](https://github.com/example/repo)',
      '後記',
    ].join('\n'));

    expect(blocks.map(({ type, content }) => ({ type, content }))).toEqual([
      { type: BlockType.PARAGRAPH, content: '前言' },
      { type: BlockType.QR, content: 'GitHub 原始碼' },
      { type: BlockType.PARAGRAPH, content: '後記' },
    ]);
  });

  it.each([
    {
      name: 'LF',
      markdown: [
        '前言',
        '[QR:GitHub 原始碼](https://github.com/example/repo)',
        '後記',
      ].join('\n'),
      expected: [
        { type: BlockType.PARAGRAPH, sourceLine: 0, startIndex: 0, endIndex: 2 },
        { type: BlockType.QR, sourceLine: 1, startIndex: 3, endIndex: 51 },
        { type: BlockType.PARAGRAPH, sourceLine: 2, startIndex: 52, endIndex: 54 },
      ],
    },
    {
      name: 'CRLF',
      markdown: [
        '前言',
        '[QR:GitHub 原始碼](https://github.com/example/repo)',
        '後記',
      ].join('\r\n'),
      expected: [
        { type: BlockType.PARAGRAPH, sourceLine: 0, startIndex: 0, endIndex: 2 },
        { type: BlockType.QR, sourceLine: 1, startIndex: 4, endIndex: 52 },
        { type: BlockType.PARAGRAPH, sourceLine: 2, startIndex: 54, endIndex: 56 },
      ],
    },
  ])('$name 實體行拆分後保留精確 source map', ({ markdown, expected }) => {
    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map((block) => ({
      type: block.type,
      sourceLine: block.sourceLine,
      startIndex: block.startIndex,
      endIndex: block.endIndex,
    }))).toEqual(expected);
  });

  it.each([
    ['空白 label', '[QR:](https://example.com)'],
    ['空白 href', '[QR:文件]()'],
  ])('%s 不轉成 QR', (_caseName, markdown) => {
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.PARAGRAPH);
  });

  it('TOC 與相鄰 QR 拆分後仍保留 TOC semantic block', () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '[QR:文件](https://example.com)',
    ].join('\n'));

    expect(blocks.map(({ type, content }) => ({ type, content }))).toEqual([
      { type: BlockType.TOC, content: '' },
      { type: BlockType.QR, content: '文件' },
    ]);
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 章首頁 YAML 保留引號、多行摘要與精確 source map', (_name, newline) => {
    const chapter = [
      '[CHAPTER]',
      'number: "02"',
      'part: "第一部：心法與準備"',
      'title: "工具箱"',
      'englishTitle: "Developer Toolbox"',
      'summary: >-',
      '  建立能開發、能復原，',
      '  也能保護機密的工作環境。',
      'image: "toolbox-cover"',
      'goals:',
      '  - "完成基礎開發環境與 AI 工具設定。"',
      '  - "使用 Git、GitHub 與知識庫保存專案脈絡。"',
      'futureOption: "由未來版本處理"',
      '[/CHAPTER]',
    ].join(newline);
    const markdown = `前言${newline}${chapter}${newline}後記`;

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toMatchObject({
      type: BlockType.CHAPTER_OPENER,
      content: '工具箱',
      sourceLine: 1,
      startIndex: `前言${newline}`.length,
      endIndex: `前言${newline}${chapter}`.length,
      metadata: {
        chapter: {
          number: '02',
          part: '第一部：心法與準備',
          title: '工具箱',
          englishTitle: 'Developer Toolbox',
          summary: '建立能開發、能復原， 也能保護機密的工作環境。',
          image: 'toolbox-cover',
          goals: [
            '完成基礎開發環境與 AI 工具設定。',
            '使用 Git、GitHub 與知識庫保存專案脈絡。',
          ],
        },
      },
    });
    expect(blocks[1].validationIssues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        title: '章首頁包含未知欄位',
        sourceLine: 1,
        blockType: BlockType.CHAPTER_OPENER,
      }),
    ]);
  });

  it('goals 缺失時正規化為空陣列且不產生錯誤', async () => {
    const markdown = [
      '[CHAPTER]',
      'number: "03"',
      'title: "可靠交付"',
      '[/CHAPTER]',
    ].join('\n');

    const { blocks, meta } = parseMarkdown(markdown);
    expect(blocks[0].metadata?.chapter).toEqual({
      number: '03',
      title: '可靠交付',
      goals: [],
    });

    const issues = await validateExport({
      content: markdown,
      blocks,
      meta,
      imageRegistry: {},
    });
    expect(issues.filter(({ blockType }) =>
      blockType === BlockType.CHAPTER_OPENER
    )).toEqual([]);
  });

  it('錯誤型別、缺少必填欄位與無效 YAML 轉成 ValidationIssue 而不中斷後續解析', async () => {
    const markdown = [
      '[CHAPTER]',
      'number: 4',
      'englishTitle: 99',
      'goals: "不是陣列"',
      '[/CHAPTER]',
      '',
      '章後正文',
      '',
      '[CHAPTER]',
      'number: "05"',
      'title: [不完整',
      '[/CHAPTER]',
      '',
      '仍可解析的正文',
    ].join('\n');

    const { blocks, meta } = parseMarkdown(markdown);
    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
    ]);
    expect(blocks[0].metadata?.chapter).toEqual({
      number: '',
      title: '',
      goals: [],
    });

    const issues = await validateExport({
      content: markdown,
      blocks,
      meta,
      imageRegistry: {},
    });
    const chapterIssues = issues.filter(({ blockType }) =>
      blockType === BlockType.CHAPTER_OPENER
    );
    expect(chapterIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: 'error',
        title: '章首頁 number 必須是字串',
      }),
      expect.objectContaining({
        severity: 'error',
        title: '章首頁缺少 title',
      }),
      expect.objectContaining({
        severity: 'warning',
        title: '章首頁 englishTitle 必須是字串',
      }),
      expect.objectContaining({
        severity: 'warning',
        title: '章首頁 goals 必須是字串陣列',
      }),
      expect.objectContaining({
        severity: 'error',
        title: '章首頁 YAML 無法解析',
      }),
    ]));
  });

  it.each([
    [
      'fenced code',
      [
        '```markdown',
        '[CHAPTER]',
        'number: "99"',
        'title: "程式碼範例"',
        '[/CHAPTER]',
        '```',
      ].join('\n'),
    ],
    [
      'indented code',
      [
        '    [CHAPTER]',
        '    number: "99"',
        '    title: "程式碼範例"',
        '    [/CHAPTER]',
      ].join('\n'),
    ],
    [
      'CRLF fenced code',
      [
        '```markdown',
        '[CHAPTER]',
        'number: "99"',
        'title: "程式碼範例"',
        '[/CHAPTER]',
        '```',
      ].join('\r\n'),
    ],
    [
      'CRLF indented code',
      [
        '    [CHAPTER]',
        '    number: "99"',
        '    title: "程式碼範例"',
        '    [/CHAPTER]',
      ].join('\r\n'),
    ],
  ])('%s 內的 CHAPTER 標記保留為程式碼', (_name, markdown) => {
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.CODE_BLOCK,
      content: expect.stringContaining('[CHAPTER]'),
    });
    expect(blocks).not.toContainEqual(
      expect.objectContaining({ type: BlockType.CHAPTER_OPENER }),
    );
  });

  it.each([
    ['2-space fenced code', '  ', true],
    ['4-space fenced code', '    ', true],
    ['6-space fenced code', '      ', false],
  ])('list item 內的 %s 不會轉成 CHAPTER', (
    _name,
    indentation,
    isMarkedBlockCode,
  ) => {
    const markdown = [
      '- 外層項目',
      `${indentation}\`\`\`markdown`,
      `${indentation}[CHAPTER]`,
      `${indentation}number: "91"`,
      `${indentation}title: "巢狀程式碼"`,
      `${indentation}[/CHAPTER]`,
      `${indentation}\`\`\``,
    ].join('\n');
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).not.toContainEqual(
      expect.objectContaining({ type: BlockType.CHAPTER_OPENER }),
    );
    expect(blocks[0]).toMatchObject({
      type: BlockType.BULLET_LIST,
      content: expect.stringContaining('外層項目'),
    });
    const codeBlocks = blocks.filter(({ type }) =>
      type === BlockType.CODE_BLOCK
    );
    expect(codeBlocks).toHaveLength(isMarkedBlockCode ? 1 : 0);
    if (isMarkedBlockCode) {
      expect(codeBlocks[0].content).toContain('[CHAPTER]');
      expect(codeBlocks[0].content).toContain('[/CHAPTER]');
    } else {
      expect(blocks[0].content).toContain('[CHAPTER]');
      expect(blocks[0].content).toContain('[/CHAPTER]');
    }
  });

  it('list item 內 Marked 辨識的 indented code 受保護且保留 code block', () => {
    const markdown = [
      '- 外層項目',
      '',
      '      [CHAPTER]',
      '      number: "92"',
      '      title: "縮排程式碼"',
      '      [/CHAPTER]',
    ].join('\n');
    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.BULLET_LIST,
      BlockType.CODE_BLOCK,
    ]);
    expect(blocks[0].content).toBe('外層項目');
    expect(blocks[1].content).toContain('[CHAPTER]');
    expect(blocks[1].content).toContain('[/CHAPTER]');
  });

  it('CRLF list 內重複相同 fenced code raw 依序配對且全部保護', () => {
    const repeatedCode = [
      '  ```markdown',
      '  [CHAPTER]',
      '  number: "93"',
      '  title: "重複程式碼"',
      '  [/CHAPTER]',
      '  ```',
    ];
    const markdown = [
      '- 第一個項目',
      ...repeatedCode,
      '- 第二個項目',
      ...repeatedCode,
    ].join('\r\n');
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).not.toContainEqual(
      expect.objectContaining({ type: BlockType.CHAPTER_OPENER }),
    );
    expect(blocks.filter(({ type }) =>
      type === BlockType.BULLET_LIST
    ).map(({ content }) => content)).toEqual([
      '第一個項目',
      '第二個項目',
    ]);
    expect(blocks.filter(({ type }) =>
      type === BlockType.CODE_BLOCK
    ).map(({ content }) => content)).toEqual([
      expect.stringContaining('[CHAPTER]'),
      expect.stringContaining('[CHAPTER]'),
    ]);
  });

  it('未關閉 CHAPTER 只回復 marker，後續 heading 與 paragraph 全部保留', () => {
    const markdown = [
      '[CHAPTER]',
      'number: "09"',
      'title: "尚未關閉"',
      '',
      '# 後續標題',
      '',
      '後續正文',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
      BlockType.HEADING_1,
      BlockType.PARAGRAPH,
    ]);
    expect(blocks[0].validationIssues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        title: '章首頁缺少 [/CHAPTER]',
      }),
    );
    expect(blocks[2].content).toBe('後續標題');
    expect(blocks[3].content).toBe('後續正文');
    expect(blocks[0].endIndex).toBe('[CHAPTER]'.length);
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 未關閉 opener 不會跨越下一個合法 CHAPTER 配對', (
    _name,
    newline,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "01"',
      'title: "未關閉"',
      '',
      '# 中間標題',
      '',
      '中間正文',
      '',
      '[CHAPTER]',
      'number: "02"',
      'title: "合法章節"',
      '[/CHAPTER]',
      '',
      'Tail',
    ].join(newline);
    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
      BlockType.HEADING_1,
      BlockType.PARAGRAPH,
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
    ]);
    expect(blocks[0]).toMatchObject({
      content: '',
      endIndex: '[CHAPTER]'.length,
      validationIssues: expect.arrayContaining([
        expect.objectContaining({ title: '章首頁缺少 [/CHAPTER]' }),
      ]),
    });
    expect(blocks[2].content).toBe('中間標題');
    expect(blocks[3].content).toBe('中間正文');
    expect(blocks[4]).toMatchObject({
      content: '合法章節',
      metadata: {
        chapter: {
          number: '02',
          title: '合法章節',
          goals: [],
        },
      },
      validationIssues: [],
    });
    expect(blocks[5].content).toBe('Tail');
  });

  it('TOC 與普通清單隔著空白行時不合併', () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '',
      '- 第一章 1',
      '- 第二章 8',
    ].join('\n'));

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.TOC,
      BlockType.BULLET_LIST,
      BlockType.BULLET_LIST,
    ]);
    expect(blocks[0].metadata?.manualTocContent).toBe(false);
  });

  it('TOC 後直接相鄰但沒有頁碼的普通清單不合併', () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '- 安裝需求',
      '- 執行步驟',
    ].join('\n'));

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.TOC,
      BlockType.BULLET_LIST,
      BlockType.BULLET_LIST,
    ]);
    expect(blocks[0].metadata?.manualTocContent).toBe(false);
  });

  it('TOC 後直接相鄰且每列皆為標題加頁碼時合併為 legacy 手動目錄', () => {
    const { blocks } = parseMarkdown([
      '[TOC]',
      '- 第一章 1',
      '- 第二章 8',
    ].join('\n'));

    expect(blocks).toEqual([
      expect.objectContaining({
        type: BlockType.TOC,
        content: '- 第一章 1\n- 第二章 8',
        metadata: expect.objectContaining({ manualTocContent: true }),
      }),
    ]);
  });

  it('numbered manual TOC 移除後只 compact 保留的 ordered group ids', () => {
    const markdown = [
      '[TOC]',
      '1. 第一章 1',
      '2. 第二章 8',
      '',
      '目錄後正文',
      '',
      '1. Parent A',
      '   - nested bullet',
      '     1. nested ordered',
      '2. Parent B',
      '',
      '群組分隔',
      '',
      '1. Second group',
    ].join('\n');
    const { blocks } = parseMarkdown(markdown);
    const numberedBlocks = blocks.filter(({ type }) =>
      type === BlockType.NUMBERED_LIST
    );

    expect(blocks[0]).toMatchObject({
      type: BlockType.TOC,
      metadata: expect.objectContaining({ manualTocContent: true }),
    });
    expect(numberedBlocks.map((block) => ({
      content: block.content,
      instance: block.metadata?.listInstance,
    }))).toEqual([
      { content: 'Parent A', instance: 1 },
      { content: 'nested ordered', instance: 1 },
      { content: 'Parent B', instance: 1 },
      { content: 'Second group', instance: 2 },
    ]);
  });

  it('相鄰有序清單共用 instance，並由其他 block 明確切斷', () => {
    const markdown = [
      '1. 第一項',
      '   1. 第一層',
      '      1. 第二層',
      '2. 第二項',
      '',
      '- 無序項目',
      '',
      '1. 無序後重新開始',
      '2. 同組第二項',
      '',
      '段落切斷',
      '',
      '1. 段落後重新開始',
      '',
      '| 欄位 | 值 |',
      '| :--- | :--- |',
      '| A | B |',
      '',
      '1. 表格後重新開始',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);
    const numberedBlocks = blocks.filter(({ type }) =>
      type === BlockType.NUMBERED_LIST
    );

    expect(numberedBlocks.map((block) => ({
      content: block.content,
      level: block.nestingLevel,
      instance: block.metadata?.listInstance,
    }))).toEqual([
      { content: '第一項', level: 0, instance: 1 },
      { content: '第一層', level: 1, instance: 1 },
      { content: '第二層', level: 2, instance: 1 },
      { content: '第二項', level: 0, instance: 1 },
      { content: '無序後重新開始', level: 0, instance: 2 },
      { content: '同組第二項', level: 0, instance: 2 },
      { content: '段落後重新開始', level: 0, instance: 3 },
      { content: '表格後重新開始', level: 0, instance: 4 },
    ]);
  });

  it('外層有序清單不會被巢狀 bullet 切斷且 ordered descendants 共用 instance', () => {
    const markdown = [
      '1. Parent A',
      '   - nested bullet',
      '     1. nested ordered',
      '2. Parent B',
    ].join('\n');

    const firstPass = parseMarkdown(markdown).blocks;
    const secondPass = parseMarkdown(markdown).blocks;
    const projectListShape = (blocks: typeof firstPass) => blocks.map((block) => ({
      type: block.type,
      content: block.content,
      level: block.nestingLevel,
      instance: block.metadata?.listInstance,
    }));

    expect(projectListShape(firstPass)).toEqual([
      {
        type: BlockType.NUMBERED_LIST,
        content: 'Parent A',
        level: 0,
        instance: 1,
      },
      {
        type: BlockType.BULLET_LIST,
        content: 'nested bullet',
        level: 1,
        instance: undefined,
      },
      {
        type: BlockType.NUMBERED_LIST,
        content: 'nested ordered',
        level: 2,
        instance: 1,
      },
      {
        type: BlockType.NUMBERED_LIST,
        content: 'Parent B',
        level: 0,
        instance: 1,
      },
    ]);
    expect(projectListShape(secondPass)).toEqual(projectListShape(firstPass));
  });

  it('不同文件的有序清單 instance 都從 1 開始', () => {
    const first = parseMarkdown('1. 第一份文件').blocks[0];
    const second = parseMarkdown('1. 第二份文件').blocks[0];

    expect(first.metadata?.listInstance).toBe(1);
    expect(second.metadata?.listInstance).toBe(1);
  });
});
