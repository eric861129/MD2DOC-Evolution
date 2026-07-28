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
});
