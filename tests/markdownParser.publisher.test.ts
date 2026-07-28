import { describe, expect, it } from 'vitest';
import { validateExport } from '../services/exportValidation';
import { parseMarkdown } from '../services/markdownParser';
import { measureChapterSpanScanOperations } from '../services/parser/ast';
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
    const chapterPrefix = `前言${newline}${newline}`;
    const markdown = `${chapterPrefix}${chapter}${newline}後記`;

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toMatchObject({
      type: BlockType.CHAPTER_OPENER,
      content: '工具箱',
      sourceLine: 2,
      startIndex: chapterPrefix.length,
      endIndex: `${chapterPrefix}${chapter}`.length,
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
        sourceLine: 2,
        blockType: BlockType.CHAPTER_OPENER,
      }),
    ]);
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 章首頁 YAML 允許必填欄位之間有空白行', (
    _name,
    newline,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "114"',
      '',
      'title: "空白行仍是合法 YAML"',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.CHAPTER_OPENER,
      content: '空白行仍是合法 YAML',
      startIndex: 0,
      endIndex: markdown.length,
      metadata: {
        chapter: {
          number: '114',
          title: '空白行仍是合法 YAML',
          goals: [],
        },
      },
      validationIssues: [],
    });
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 章首頁 YAML 接受 indentless goals sequence', (
    _name,
    newline,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "115"',
      'title: "Indentless sequence"',
      'goals:',
      '- "第一項"',
      '- "第二項"',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].metadata?.chapter).toEqual({
      number: '115',
      title: 'Indentless sequence',
      goals: ['第一項', '第二項'],
    });
    expect(blocks[0].validationIssues).toEqual([]);
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 章首頁 YAML 保留含空白行的 summary 並回報 unknown key', (
    _name,
    newline,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "116"',
      'title: "完整 YAML"',
      'summary: |-',
      '  第一段',
      '',
      '  第二段',
      '',
      'futureOption: "由未來版本處理"',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].metadata?.chapter).toMatchObject({
      number: '116',
      title: '完整 YAML',
      summary: '第一段\n\n第二段',
      goals: [],
    });
    expect(blocks[0].validationIssues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        title: '章首頁包含未知欄位',
      }),
    ]);
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 無效 YAML 的正常 closing 仍建立 chapter 與 issues', (
    _name,
    newline,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "117"',
      '- invalid yaml',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.CHAPTER_OPENER,
      startIndex: 0,
      endIndex: markdown.length,
      validationIssues: expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          title: '章首頁 YAML 無法解析',
        }),
      ]),
    });
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
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s 相同內容的 root chapter 與後續 indented code 只解析前者', (
    _name,
    newline,
  ) => {
    const chapterLines = [
      '[CHAPTER]',
      'number: "94"',
      'title: "相同內容"',
      '[/CHAPTER]',
    ];
    const markdown = [
      ...chapterLines,
      '',
      ...chapterLines.map((line) => `    ${line}`),
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.CODE_BLOCK,
    ]);
    expect(blocks[0].metadata?.chapter).toMatchObject({
      number: '94',
      title: '相同內容',
    });
    expect(blocks[1].content).toBe(chapterLines.join('\n'));
  });

  it.each([
    ['1-space', ' '],
    ['2-space', '  '],
    ['4-space', '    '],
    ['6-space', '      '],
    ['tab', '\t'],
  ])('%s leading whitespace 的 marker 不視為 root CHAPTER', (
    _name,
    indentation,
  ) => {
    const markdown = [
      `${indentation}[CHAPTER]`,
      `${indentation}number: "95"`,
      `${indentation}title: "縮排內容"`,
      `${indentation}[/CHAPTER]`,
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).not.toContainEqual(
      expect.objectContaining({ type: BlockType.CHAPTER_OPENER }),
    );
  });

  it.each([
    [
      'backtick fence 與較長 closing',
      [
        '```markdown',
        '[CHAPTER]',
        'number: "96"',
        'title: "Fence 內容"',
        '[/CHAPTER]',
        '````',
      ].join('\n'),
    ],
    [
      'tilde fence',
      [
        '~~~markdown',
        '[CHAPTER]',
        'number: "96"',
        'title: "Fence 內容"',
        '[/CHAPTER]',
        '~~~',
      ].join('\n'),
    ],
    [
      '2-space top-level fence',
      [
        '  ```markdown',
        '[CHAPTER]',
        'number: "96"',
        'title: "Fence 內容"',
        '[/CHAPTER]',
        '  ```',
      ].join('\n'),
    ],
    [
      '未關閉 fence 到 EOF',
      [
        '```markdown',
        '[CHAPTER]',
        'number: "96"',
        'title: "Fence 內容"',
        '[/CHAPTER]',
      ].join('\n'),
    ],
  ])('%s 內零縮排 marker 全部受保護', (_name, markdown) => {
    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.CODE_BLOCK,
      content: expect.stringContaining('[CHAPTER]'),
    });
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s root marker 允許行尾水平空白', (_name, newline) => {
    const markdown = [
      '[CHAPTER] \t',
      'number: "99"',
      'title: "行尾空白"',
      '[/CHAPTER]\t ',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.CHAPTER_OPENER,
      content: '行尾空白',
    });
  });

  it('fence 只能由同字元且長度足夠的 closing 關閉', () => {
    const markdown = [
      '````markdown',
      '[CHAPTER]',
      'number: "97"',
      'title: "仍在 Fence"',
      '[/CHAPTER]',
      '~~~',
      '```',
      '`````',
      '',
      '[CHAPTER]',
      'number: "98"',
      'title: "合法章節"',
      '[/CHAPTER]',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CODE_BLOCK,
      BlockType.CHAPTER_OPENER,
    ]);
    expect(blocks[1].metadata?.chapter).toMatchObject({
      number: '98',
      title: '合法章節',
    });
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s single-backtick multiline codespan 內的 root marker 不轉成 CHAPTER', (
    _name,
    newline,
  ) => {
    const markdown = [
      'before `inline code',
      '[CHAPTER]',
      'number: "100"',
      'title: "Codespan 內容"',
      '[/CHAPTER]',
      'tail` after',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.PARAGRAPH,
      content: expect.stringContaining('[CHAPTER]'),
    });
  });

  it.each([
    ['double delimiter', '``', '`', '```'],
    ['triple delimiter', '```', '``', '````'],
  ])('%s multiline codespan 只由相同長度 run 關閉', (
    _name,
    delimiter,
    shorterRun,
    longerRun,
  ) => {
    const markdown = [
      `before ${delimiter}inline ${shorterRun}`,
      '[CHAPTER]',
      'number: "101"',
      'title: "不同長度 run"',
      '[/CHAPTER]',
      `inside ${longerRun} remains inside`,
      `tail${delimiter} after`,
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.PARAGRAPH,
      content: expect.stringContaining('[CHAPTER]'),
    });
  });

  it('同一行 codespan 關閉且經合法 block boundary 後 root CHAPTER 有效', () => {
    const markdown = [
      'before `inline code` after',
      '',
      '[CHAPTER]',
      'number: "102"',
      'title: "合法章節"',
      '[/CHAPTER]',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.PARAGRAPH,
      BlockType.CHAPTER_OPENER,
    ]);
    expect(blocks[1].metadata?.chapter).toMatchObject({
      number: '102',
      title: '合法章節',
    });
  });

  it('unmatched opener 不跨空白行配對並隱藏後續 root CHAPTER', () => {
    const markdown = [
      'before `unmatched opener',
      '',
      '[CHAPTER]',
      'number: "103"',
      'title: "合法章節"',
      '[/CHAPTER]',
      'unmatched closer`',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.PARAGRAPH,
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
    ]);
    expect(blocks[1].metadata?.chapter).toMatchObject({
      number: '103',
      title: '合法章節',
    });
  });

  it('escaped backtick 不成為 opener，後續 root CHAPTER 仍有效', () => {
    const markdown = [
      'before \\`escaped delimiter',
      '',
      '[CHAPTER]',
      'number: "104"',
      'title: "合法章節"',
      '[/CHAPTER]',
      'unmatched closer`',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.PARAGRAPH,
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
    ]);
  });

  it('escaped run 的剩餘 backticks 仍依 Marked 語意形成 codespan', () => {
    const markdown = [
      'before \\```double delimiter after escape',
      '[CHAPTER]',
      'number: "105"',
      'title: "Codespan 內容"',
      '[/CHAPTER]',
      'tail`` after',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.PARAGRAPH,
      content: expect.stringContaining('[CHAPTER]'),
    });
  });

  it('fenced code 的 backticks 不會干擾後續 multiline inline codespan', () => {
    const markdown = [
      '```markdown',
      '` fenced literal',
      '```',
      'before `inline code',
      '[CHAPTER]',
      'number: "106"',
      'title: "Codespan 內容"',
      '[/CHAPTER]',
      'tail` after',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CODE_BLOCK,
      BlockType.PARAGRAPH,
    ]);
    expect(blocks[1].content).toContain('[CHAPTER]');
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s list lazy codespan 內的 marker 保留完整 BULLET_LIST', (
    _name,
    newline,
  ) => {
    const markdown = [
      '- 外層 `inline',
      '[CHAPTER]',
      'number: "107"',
      'title: "Lazy list"',
      '[/CHAPTER]',
      'tail`',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.BULLET_LIST,
      content: expect.stringContaining('[CHAPTER]'),
    });
    expect(blocks[0].content).toContain('[/CHAPTER]');
    expect(blocks[0].content).toContain('tail');
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s blockquote lazy codespan 內的 marker 保留完整 QUOTE_BLOCK', (
    _name,
    newline,
  ) => {
    const markdown = [
      '> 引言 `inline',
      '[CHAPTER]',
      'number: "108"',
      'title: "Lazy quote"',
      '[/CHAPTER]',
      'tail`',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: BlockType.QUOTE_BLOCK,
      content: expect.stringContaining('[CHAPTER]'),
    });
    expect(blocks[0].content).toContain('[/CHAPTER]');
    expect(blocks[0].content).toContain('tail');
  });

  it.each([
    ['list', '- 外層 `inline', BlockType.BULLET_LIST],
    ['blockquote', '> 引言 `inline', BlockType.QUOTE_BLOCK],
  ])('重複相同 raw 的兩個 %s 只有後續 root chapter 生效', (
    _name,
    containerStart,
    containerType,
  ) => {
    const chapterLines = [
      '[CHAPTER]',
      'number: "109"',
      'title: "唯一 root chapter"',
      '[/CHAPTER]',
    ];
    const containerLines = [
      containerStart,
      ...chapterLines,
      'tail`',
    ];
    const markdown = [
      ...containerLines,
      '',
      ...containerLines,
      '',
      ...chapterLines,
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      containerType,
      containerType,
      BlockType.CHAPTER_OPENER,
    ]);
    expect(blocks[2].metadata?.chapter).toMatchObject({
      number: '109',
      title: '唯一 root chapter',
    });
  });

  it.each([
    ['LF list', '\n', '- 外層 `inline', BlockType.BULLET_LIST],
    ['CRLF list', '\r\n', '- 外層 `inline', BlockType.BULLET_LIST],
    ['LF blockquote', '\n', '> 引言 `inline', BlockType.QUOTE_BLOCK],
    ['CRLF blockquote', '\r\n', '> 引言 `inline', BlockType.QUOTE_BLOCK],
  ])('%s lazy codespan 的重複 closing/raw 不會關閉 unclosed root', (
    _name,
    newline,
    containerStart,
    containerType,
  ) => {
    const containerLines = [
      containerStart,
      '[/CHAPTER]',
      'same raw',
      '[/CHAPTER]',
      'tail`',
    ];
    const markdown = [
      '[CHAPTER]',
      'number: "118"',
      'title: "尚未關閉"',
      '',
      ...containerLines,
      '',
      ...containerLines,
      '',
      '[CHAPTER]',
      'number: "119"',
      'title: "後續合法章節"',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
      containerType,
      containerType,
      BlockType.CHAPTER_OPENER,
    ]);
    expect(blocks[0]).toMatchObject({
      content: '',
      endIndex: '[CHAPTER]'.length,
      validationIssues: expect.arrayContaining([
        expect.objectContaining({ title: '章首頁缺少 [/CHAPTER]' }),
      ]),
    });
    for (const container of blocks.slice(2, 4)) {
      expect(container.content.match(/\[\/CHAPTER\]/g)).toHaveLength(2);
      expect(container.content).toContain('tail');
    }
    expect(blocks[4].metadata?.chapter).toMatchObject({
      number: '119',
      title: '後續合法章節',
    });
  });

  it.each([
    [
      'LF list items',
      '\n',
      [
        '- 第一項 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
        '- 第二項 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
      ],
      BlockType.BULLET_LIST,
      2,
    ],
    [
      'CRLF list items',
      '\r\n',
      [
        '- 第一項 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
        '- 第二項 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
      ],
      BlockType.BULLET_LIST,
      2,
    ],
    [
      'LF blockquote paragraphs',
      '\n',
      [
        '> 第一段 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
        '>',
        '> 第二段 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
      ],
      BlockType.QUOTE_BLOCK,
      1,
    ],
    [
      'CRLF blockquote paragraphs',
      '\r\n',
      [
        '> 第一段 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
        '>',
        '> 第二段 `inline',
        '[/CHAPTER]',
        'same raw',
        'tail`',
      ],
      BlockType.QUOTE_BLOCK,
      1,
    ],
  ])('%s 同一容器的重複 raw 依 semantic boundary 保留', (
    _name,
    newline,
    containerLines,
    containerType,
    expectedContainerCount,
  ) => {
    const markdown = [
      '[CHAPTER]',
      'number: "120"',
      'title: "尚未關閉"',
      '',
      ...containerLines,
      '',
      '[CHAPTER]',
      'number: "121"',
      'title: "後續合法章節"',
      '[/CHAPTER]',
    ].join(newline);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.PARAGRAPH,
      ...Array(expectedContainerCount).fill(containerType),
      BlockType.CHAPTER_OPENER,
    ]);
    const containers = blocks.slice(2, 2 + expectedContainerCount);
    expect(
      containers.flatMap(
        ({ content }) => content.match(/\[\/CHAPTER\]/g) ?? [],
      ),
    ).toHaveLength(2);
    expect(blocks.at(-1)?.metadata?.chapter).toMatchObject({
      number: '121',
      title: '後續合法章節',
    });
  });

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('%s unmatched backtick 不會跨 list item 保護 closing', (
    _name,
    newline,
  ) => {
    const closing = '[/CHAPTER]';
    const markdown = [
      '[CHAPTER]',
      'number: "122"',
      'title: "跨項目"',
      '',
      '- 第一項 `未配對',
      closing,
      '- 第二項 未配對`',
    ].join(newline);
    const closingStartIndex = markdown.indexOf(closing);

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual([
      BlockType.CHAPTER_OPENER,
      BlockType.BULLET_LIST,
    ]);
    expect(blocks[0]).toMatchObject({
      endIndex: closingStartIndex + closing.length,
      validationIssues: expect.arrayContaining([
        expect.objectContaining({
          title: '章首頁 YAML 無法解析',
        }),
      ]),
    });
    expect(blocks[1].content).toContain('第二項 未配對');
    expect(blocks[1].content).not.toContain(closing);
  });

  it.each([
    ['文件起點', [], [BlockType.CHAPTER_OPENER]],
    [
      'heading 後無空行',
      ['# 前置標題'],
      [BlockType.HEADING_1, BlockType.CHAPTER_OPENER],
    ],
    [
      'paragraph 後合法 block boundary',
      ['前置正文', ''],
      [BlockType.PARAGRAPH, BlockType.CHAPTER_OPENER],
    ],
  ])('%s 的 top-level chapter opener 有效', (
    _name,
    prefixLines,
    expectedTypes,
  ) => {
    const markdown = [
      ...prefixLines,
      '[CHAPTER]',
      'number: "110"',
      'title: "合法章節"',
      '[/CHAPTER]',
    ].join('\n');

    const { blocks } = parseMarkdown(markdown);

    expect(blocks.map(({ type }) => type)).toEqual(expectedTypes);
    expect(blocks.at(-1)?.metadata?.chapter).toMatchObject({
      number: '110',
      title: '合法章節',
    });
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

  it('nested sublist 與 fenced code 依 item.tokens 原始順序輸出', () => {
    const { blocks } = parseMarkdown([
      '- Parent',
      '  - Child',
      '  ```ts',
      '  code',
      '  ```',
    ].join('\n'));

    expect(blocks.map(({ type, content }) => ({ type, content }))).toEqual([
      { type: BlockType.BULLET_LIST, content: 'Parent' },
      { type: BlockType.BULLET_LIST, content: 'Child' },
      { type: BlockType.CODE_BLOCK, content: 'code' },
    ]);
  });

  it('fenced code 後的 trailing paragraph 保留獨立 block 與原始順序', () => {
    const { blocks } = parseMarkdown([
      '- Parent',
      '  ```ts',
      '  code',
      '  ```',
      '',
      '  trailing paragraph',
    ].join('\n'));

    expect(blocks.map(({ type, content }) => ({ type, content }))).toEqual([
      { type: BlockType.BULLET_LIST, content: 'Parent' },
      { type: BlockType.CODE_BLOCK, content: 'code' },
      { type: BlockType.PARAGRAPH, content: 'trailing paragraph' },
    ]);
  });

  it('code/sublist/code 交錯順序與 nested ordered instance 均保留', () => {
    const { blocks } = parseMarkdown([
      '- Parent',
      '  ```ts',
      '  before',
      '  ```',
      '  - Child',
      '    1. ordered child',
      '  ```ts',
      '  after',
      '  ```',
    ].join('\n'));

    expect(blocks.map((block) => ({
      type: block.type,
      content: block.content,
      instance: block.metadata?.listInstance,
    }))).toEqual([
      { type: BlockType.BULLET_LIST, content: 'Parent', instance: undefined },
      { type: BlockType.CODE_BLOCK, content: 'before', instance: undefined },
      { type: BlockType.BULLET_LIST, content: 'Child', instance: undefined },
      { type: BlockType.NUMBERED_LIST, content: 'ordered child', instance: 1 },
      { type: BlockType.CODE_BLOCK, content: 'after', instance: undefined },
    ]);
  });

  it.each([1_500, 3_000, 6_000, 12_000])(
    '%i 行 near-match 的 chapter 掃描每行只轉移一次',
    (lineCount) => {
      const prefixLineCount = Math.floor((lineCount - 3) / 2);
      const codeLineCount = lineCount - prefixLineCount - 3;
      const markdown = [
        '- Parent',
        '',
        ...Array.from(
          { length: prefixLineCount },
          () => '  almost-the-same',
        ),
        '',
        ...Array.from(
          { length: codeLineCount - 1 },
          () => '      almost-the-same',
        ),
        '      final-code-line',
      ].join('\n');
      const metrics = measureChapterSpanScanOperations(markdown);

      expect(metrics.sourceLineCount).toBe(lineCount);
      expect(metrics.lineTransitionCount).toBe(lineCount);
    },
  );

  it('50k top-level/nested workload 的 char/token/line 操作量維持線性', () => {
    const topLevelBlockCount = 25_000;
    const nestedItemCount = 25_000;
    const markdown = [
      ...Array.from(
        { length: topLevelBlockCount },
        (_, index) => [`段落-${index}`, ''],
      ).flat(),
      '- root',
      ...Array.from(
        { length: nestedItemCount },
        (_, index) => `  - child-${index}`,
      ),
    ].join('\n');

    const metrics = measureChapterSpanScanOperations(markdown);

    expect(metrics.characterTransitionCount).toBe(markdown.length);
    expect(metrics.closerProtectionCharacterTransitionCount).toBe(
      markdown.length,
    );
    expect(metrics.tokenTransitionCount).toBe(
      topLevelBlockCount * 2 + 1,
    );
    expect(metrics.sourceLineCount).toBe(
      topLevelBlockCount * 2 + nestedItemCount + 1,
    );
    expect(metrics.lineTransitionCount).toBe(metrics.sourceLineCount);
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
