import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_MANUSCRIPTS,
  getExampleManuscript,
} from '../constants/exampleContent';
import {
  INITIAL_CONTENT_EN,
  INITIAL_CONTENT_ZH,
} from '../constants/defaultContent';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

describe('exampleContent', () => {
  it('提供中英文快速範例與完整功能稿', () => {
    expect(EXAMPLE_MANUSCRIPTS.map(({ id }) => id)).toEqual([
      'quick-zh',
      'complete-zh',
      'quick-en',
      'complete-en',
    ]);
    expect(new Set(EXAMPLE_MANUSCRIPTS.map(({ id }) => id)).size).toBe(4);
    expect(EXAMPLE_MANUSCRIPTS.every(({ content }) => content.trim().length > 0)).toBe(true);
    expect(getExampleManuscript('quick-zh').language).toBe('zh');
    expect(getExampleManuscript('complete-en').kind).toBe('complete');
  });

  it('讓預設內容與快速範例共用同一來源', () => {
    expect(INITIAL_CONTENT_ZH).toBe(getExampleManuscript('quick-zh').content);
    expect(INITIAL_CONTENT_EN).toBe(getExampleManuscript('quick-en').content);
  });

  it('中英文完整稿皆覆蓋 Parser、Preview 與 DOCX 所需語法', () => {
    for (const id of ['complete-zh', 'complete-en'] as const) {
      const { content } = getExampleManuscript(id);
      const { blocks, meta } = parseMarkdown(content);
      const blockTypes = blocks.map(({ type }) => type);

      expect(meta).toMatchObject({ header: true, footer: true });
      expect(blockTypes).toEqual(expect.arrayContaining([
        BlockType.TOC,
        BlockType.CHAPTER_OPENER,
        BlockType.HEADING_1,
        BlockType.HEADING_2,
        BlockType.HEADING_3,
        BlockType.PARAGRAPH,
        BlockType.BULLET_LIST,
        BlockType.NUMBERED_LIST,
        BlockType.QUOTE_BLOCK,
        BlockType.HORIZONTAL_RULE,
        BlockType.CODE_BLOCK,
        BlockType.MERMAID,
        BlockType.CALLOUT_NOTE,
        BlockType.CALLOUT_TIP,
        BlockType.CALLOUT_WARNING,
        BlockType.CALLOUT_IMPORTANT,
        BlockType.CALLOUT_CAUTION,
        BlockType.CHAT_CUSTOM,
        BlockType.TABLE,
        BlockType.IMAGE,
        BlockType.QR,
      ]));
      expect(content).toContain('- [ ]');
      expect(content).toContain('- [x]');
      expect(content).toContain('<u>');
      expect(content).toContain('**');
      expect(content).toContain('[Ctrl]');
      expect(
        blocks
          .filter(({ type }) => type === BlockType.CHAT_CUSTOM)
          .map(({ alignment }) => alignment),
      ).toEqual(['left', 'right', 'center']);
    }
  });

  it('QA 與網站完整中文稿讀取完全相同的 Markdown 檔案', async () => {
    const sourcePath = path.resolve(
      process.cwd(),
      'content',
      'examples',
      'complete.zh.md',
    );
    const scriptPath = path.resolve(
      process.cwd(),
      'scripts',
      'qa',
      'generate-publisher-fixture.ts',
    );
    const [source, script] = await Promise.all([
      readFile(sourcePath, 'utf8'),
      readFile(scriptPath, 'utf8'),
    ]);

    expect(getExampleManuscript('complete-zh').content).toBe(source);
    expect(script).toContain("'content',\n  'examples',\n  'complete.zh.md'");
    expect(script).not.toContain('IMAGE_PATTERN');
    expect(script).not.toContain('chapterNeedsContentPage');
  });
});
