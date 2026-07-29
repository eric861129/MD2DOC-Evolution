import { describe, expect, it, vi } from 'vitest';
import { validateExport } from '../services/exportValidation';
import { DEFAULT_EXPORT_SETTINGS } from '../services/docx/layout/presets';
import { BlockType, ParsedBlock } from '../services/types';

const VALID_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

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
    exportSettings: DEFAULT_EXPORT_SETTINGS,
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
      imageRegistry: { 'image-1': VALID_GIF_DATA_URL },
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

  it.each([
    {
      name: '直接 data URL',
      content: 'data:image/png;base64,bm90LWEtcG5n',
      imageRegistry: {},
    },
    {
      name: 'registry reference',
      content: 'broken-image',
      imageRegistry: {
        'broken-image': 'data:image/png;base64,bm90LWEtcG5n',
      },
    },
    {
      name: 'registry 非 data URL',
      content: 'remote-image',
      imageRegistry: {
        'remote-image': 'https://example.com/cover.png',
      },
    },
    {
      name: 'MIME 與 magic bytes 不一致',
      content:
        'data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      imageRegistry: {},
    },
  ])('普通 IMAGE 的無效媒體在 builder 前回傳 error：$name', async ({
    content,
    imageRegistry,
  }) => {
    const issues = await validate({
      blocks: [{
        type: BlockType.IMAGE,
        content,
        metadata: { alt: '無效圖片' },
      }],
      imageRegistry,
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'image-invalid-0',
      severity: 'error',
      title: '圖片格式無效',
      message: expect.any(String),
    }));
  });

  it('外部 URL 若有 registry 對應，必須驗證 registry 內容而不是只回傳外部圖片警告', async () => {
    const source = 'https://example.com/cover.png';
    const issues = await validate({
      blocks: [{
        type: BlockType.IMAGE,
        content: source,
        metadata: { alt: '已登錄的外部圖片' },
      }],
      imageRegistry: {
        [source]: 'data:image/png;base64,bm90LWEtcG5n',
      },
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'image-invalid-0',
      severity: 'error',
      title: '圖片格式無效',
    }));
    expect(issues).not.toContainEqual(expect.objectContaining({
      id: 'image-external-0',
    }));
  });

  it('實體邊界小於 1 公分時警告，但 gutter 不算實體邊界', async () => {
    const marginIssues = await validate({
      exportSettings: {
        profileId: 'publisher-narrow',
        pageSizeId: 'tech',
        marginPresetId: 'custom',
        customMargins: {
          mode: 'standard',
          topCm: 0.75,
          rightCm: 1.2,
          bottomCm: 1.2,
          leftCm: 1.2,
          gutterCm: 0,
          gutterPosition: 'left',
        },
      },
    });
    const bindingIssues = await validate({
      exportSettings: {
        profileId: 'publisher-binding',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-binding',
      },
    });

    expect(marginIssues).toContainEqual(expect.objectContaining({
      id: 'layout-margin-print-risk',
      severity: 'warning',
    }));
    expect(bindingIssues).not.toContainEqual(expect.objectContaining({
      id: 'layout-margin-print-risk',
    }));
  });

  it.each([
    {
      name: '寬度',
      page: { width: 10, height: 20 },
      id: 'layout-content-width',
    },
    {
      name: '高度',
      page: { width: 20, height: 10 },
      id: 'layout-content-height',
    },
  ])('有效內容$name不足時回傳 error', async ({ page, id }) => {
    const issues = await validate({
      exportSettings: {
        profileId: 'publisher-narrow',
        pageSizeId: 'custom',
        marginPresetId: 'custom',
        customPageSizeCm: page,
        customMargins: {
          mode: 'standard',
          topCm: 1.1,
          rightCm: 1.1,
          bottomCm: 1.1,
          leftCm: 1.1,
          gutterCm: 0,
          gutterPosition: 'left',
        },
      },
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id,
      severity: 'error',
    }));
  });

  it('publisher-exact 覆寫紙張或邊界預設時警告', async () => {
    const issues = await validate({
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'a4',
        marginPresetId: 'publisher-exact',
      },
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'layout-publisher-exact-overridden',
      severity: 'warning',
    }));
  });

  it('章首頁圖片 key 缺少時回傳 error，但接受通過 MIME、magic 與結構驗證的 data URL', async () => {
    const missing = await validate({
      blocks: [{
        type: BlockType.CHAPTER_OPENER,
        content: '第一章',
        metadata: {
          chapter: {
            number: '1',
            title: '開始',
            image: 'chapter-cover',
            goals: [],
          },
        },
      }],
    });
    const directDataUrl = await validate({
      blocks: [{
        type: BlockType.CHAPTER_OPENER,
        content: '第一章',
        metadata: {
          chapter: {
            number: '1',
            title: '開始',
            image: VALID_GIF_DATA_URL,
            goals: [],
          },
        },
      }],
    });

    expect(missing).toContainEqual(expect.objectContaining({
      id: 'chapter-image-missing-0',
      severity: 'error',
    }));
    expect(directDataUrl).not.toContainEqual(expect.objectContaining({
      id: 'chapter-image-missing-0',
    }));
  });

  it.each([
    {
      name: 'registry 值不是 data URL',
      image: 'chapter-cover',
      registry: { 'chapter-cover': 'https://example.com/cover.png' },
    },
    {
      name: 'registry Base64 無效',
      image: 'chapter-cover',
      registry: { 'chapter-cover': 'data:image/gif;base64,%%%' },
    },
    {
      name: 'direct MIME 與 magic bytes 不一致',
      image: VALID_GIF_DATA_URL.replace('image/gif', 'image/png'),
      registry: {},
    },
    {
      name: 'direct MIME 不支援',
      image: VALID_GIF_DATA_URL.replace('image/gif', 'image/webp'),
      registry: {},
    },
  ])('章首頁圖片 $name 時回傳 chapter-image-invalid', async ({ image, registry }) => {
    const issues = await validate({
      blocks: [{
        type: BlockType.CHAPTER_OPENER,
        content: '第一章',
        metadata: {
          chapter: {
            number: '1',
            title: '開始',
            image,
            goals: [],
          },
        },
      }],
      imageRegistry: registry,
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'chapter-image-invalid-0',
      severity: 'error',
    }));
  });

  it('章首頁圖片 registry 的合法 data URL 通過預檢', async () => {
    const issues = await validate({
      blocks: [{
        type: BlockType.CHAPTER_OPENER,
        content: '第一章',
        metadata: {
          chapter: {
            number: '1',
            title: '開始',
            image: 'chapter-cover',
            goals: [],
          },
        },
      }],
      imageRegistry: { 'chapter-cover': VALID_GIF_DATA_URL },
    });

    expect(issues).not.toContainEqual(expect.objectContaining({
      id: 'chapter-image-invalid-0',
    }));
    expect(issues).not.toContainEqual(expect.objectContaining({
      id: 'chapter-image-missing-0',
    }));
  });

  it.each([
    'javascript:alert(1)',
    'ftp://example.com/file',
    '不是網址',
  ])('QR URL 非 http/https 或無法解析時回傳 error：%s', async (url) => {
    const issues = await validate({
      blocks: [{
        type: BlockType.QR,
        content: '來源',
        metadata: { url },
      }],
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'qr-url-invalid-0',
      severity: 'error',
    }));
  });

  it('resolver 的其他版面錯誤整合為單一 layout-invalid issue', async () => {
    const issues = await validate({
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'custom',
        marginPresetId: 'publisher-exact',
      },
    });

    expect(issues).toContainEqual(expect.objectContaining({
      id: 'layout-invalid',
      severity: 'error',
      message: expect.stringContaining('自訂紙張尺寸不可為空'),
    }));
    expect(issues.filter((issue) => issue.id === 'layout-invalid')).toHaveLength(1);
  });
});
