import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../services/markdownParser';
import { BlockType } from '../../services/types';

const fixturePath = path.resolve(
  process.cwd(),
  'tests',
  'fixtures',
  'publisher-manuscript.md',
);

describe('出版社公開 Golden Fixture', () => {
  it('以星圖工坊虛構內容涵蓋所有出版社元件', async () => {
    const markdown = await readFile(fixturePath, 'utf8');
    const { blocks, meta } = parseMarkdown(markdown);
    const blockTypes = blocks.map((block) => block.type);

    expect(markdown).toContain('星圖工坊');
    expect(markdown).not.toContain('左手藍圖');
    expect(meta).toMatchObject({
      title: '星圖工坊：觀測站建置手冊',
      author: '星圖工坊編輯室',
      header: true,
      footer: true,
    });
    expect(blockTypes).toEqual(expect.arrayContaining([
      BlockType.TOC,
      BlockType.CHAPTER_OPENER,
      BlockType.HEADING_1,
      BlockType.HEADING_2,
      BlockType.HEADING_3,
      BlockType.PARAGRAPH,
      BlockType.BULLET_LIST,
      BlockType.NUMBERED_LIST,
      BlockType.CALLOUT_NOTE,
      BlockType.CALLOUT_TIP,
      BlockType.CALLOUT_WARNING,
      BlockType.CALLOUT_IMPORTANT,
      BlockType.CALLOUT_CAUTION,
      BlockType.CHAT_CUSTOM,
      BlockType.TABLE,
      BlockType.CODE_BLOCK,
      BlockType.QR,
      BlockType.MERMAID,
    ]));
    expect(
      blocks
        .filter(({ type }) => type === BlockType.CHAT_CUSTOM)
        .map(({ alignment }) => alignment),
    ).toEqual(['left', 'right', 'center']);
    expect(
      blocks
        .filter(({ type }) => type === BlockType.TABLE)
        .map(({ tableRows }) => tableRows?.[0]?.length),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(blocks).toContainEqual(expect.objectContaining({
      type: BlockType.PARAGRAPH,
      content: '![星圖工坊觀測面板](fixture-generated-image '
        + '"星圖工坊測試圖片")',
    }));
    expect(
      blocks.find(({ type }) => type === BlockType.QR),
    ).toMatchObject({
      content: '星圖工坊公開頁面',
      metadata: {
        label: '星圖工坊公開頁面',
        url: 'https://example.com/starmap-workshop',
      },
    });
  });
});
