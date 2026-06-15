import { describe, expect, it, vi } from 'vitest';
import { validateExport } from '../services/exportValidation';
import { BlockType, ParsedBlock } from '../services/types';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(async (chart: string) => (
      chart.includes('invalid') ? false : { diagramType: 'flowchart-v2' }
    )),
  },
}));

const validate = (overrides: Partial<Parameters<typeof validateExport>[0]> = {}) =>
  validateExport({
    content: '# 技術書稿\n',
    blocks: [],
    meta: { title: '技術書稿', author: 'Eric' },
    imageRegistry: {},
    ...overrides,
  });

describe('validateExport', () => {
  it('returns no issues for a complete export-ready document', async () => {
    const blocks: ParsedBlock[] = [
      { type: BlockType.CODE_BLOCK, content: 'const ok = true;', metadata: { language: 'ts' } },
      { type: BlockType.MERMAID, content: 'graph TD;\n  A-->B;' },
      { type: BlockType.IMAGE, content: 'image-1', metadata: { alt: '架構圖' } },
    ];

    await expect(validate({
      content: '| 欄位 | 說明 |\n| :--- | :--- |\n| title | 文件標題 |',
      blocks,
      imageRegistry: { 'image-1': 'data:image/png;base64,AAA=' },
    })).resolves.toEqual([]);
  });

  it('accepts valid tables with multiple body rows', async () => {
    await expect(validate({
      content: [
        '| 功能特性 | 支援狀況 | 備註說明 |',
        '| --- | --- | --- |',
        '| 粗體樣式 | 支援 | 使用星號包覆 |',
        '| 表格排版 | 支援 | 自動生成格線 |',
        '| 轉檔引擎 | 快速 | 純前端運算 |',
      ].join('\n'),
    })).resolves.toEqual([]);
  });

  it('warns when required frontmatter fields are missing', async () => {
    const issues = await validate({ meta: {} });

    expect(issues.map((issue) => issue.id)).toEqual([
      'frontmatter-title',
      'frontmatter-author',
    ]);
  });

  it('warns for code blocks without a language', async () => {
    const issues = await validate({
      blocks: [{ type: BlockType.CODE_BLOCK, content: 'console.log("missing language");' }],
    });

    expect(issues).toEqual([
      expect.objectContaining({
        id: 'code-language-0',
        title: 'Code block 缺少語言',
      }),
    ]);
  });

  it('warns for invalid Mermaid diagrams', async () => {
    const issues = await validate({
      blocks: [{ type: BlockType.MERMAID, content: 'invalid graph' }],
    });

    expect(issues).toEqual([
      expect.objectContaining({
        id: 'mermaid-syntax-0',
        title: 'Mermaid 語法可能有誤',
      }),
    ]);
  });

  it('warns for external or unresolved images', async () => {
    const issues = await validate({
      blocks: [
        { type: BlockType.IMAGE, content: 'https://example.com/cover.png' },
        { type: BlockType.IMAGE, content: 'local-image-id' },
      ],
    });

    expect(issues.map((issue) => issue.id)).toEqual([
      'image-external-0',
      'image-missing-1',
    ]);
  });

  it('warns for suspicious table separator rows', async () => {
    const issues = await validate({
      content: '| 欄位 | 說明 |\n| --- | bad |\n| title | 文件標題 |',
    });

    expect(issues).toEqual([
      expect.objectContaining({
        id: 'table-separator-1',
        title: '疑似表格分隔列格式錯誤',
      }),
    ]);
  });
});
