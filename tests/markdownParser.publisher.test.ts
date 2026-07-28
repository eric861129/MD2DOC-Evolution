import { describe, expect, it } from 'vitest';
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
});
