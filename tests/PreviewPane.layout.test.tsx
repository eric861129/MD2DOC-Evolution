import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewPane } from '../components/editor/PreviewPane';
import { EditorProvider } from '../contexts/EditorContext';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { generateDocx } from '../services/docxGenerator';
import { DEFAULT_EXPORT_SETTINGS } from '../services/docx/layout/presets';
import { resolvePageLayout } from '../services/docx/layout/resolve';
import type {
  ExportSettings,
  ResolvedPageLayout,
} from '../services/docx/layout/types';
import { getDocumentProfile } from '../services/docx/profiles';
import { BlockType, type ParsedBlock } from '../services/types';
import '../services/i18n';

vi.mock('../constants/meta', () => ({ APP_VERSION: 'test' }));
vi.mock('file-saver', () => ({ default: vi.fn() }));
vi.mock('../services/docxGenerator', () => ({
  generateDocx: vi.fn(async () => new Blob(['docx'])),
}));

const paragraph: ParsedBlock = {
  type: BlockType.PARAGRAPH,
  content: '相同的預覽內容',
};

const publisherBlocks: ParsedBlock[] = [
  { type: BlockType.HEADING_1, content: '出版社標題' },
  { type: BlockType.CALLOUT_WARNING, content: '重要提醒' },
  {
    type: BlockType.TABLE,
    content: '',
    tableRows: [
      ['欄位', '說明'],
      ['profile', '出版社樣式'],
    ],
  },
];

const exactLayout: ResolvedPageLayout = {
  page: {
    widthCm: 17,
    heightCm: 23,
    widthTwips: 9638,
    heightTwips: 13039,
  },
  margins: {
    mode: 'standard',
    topCm: 2.54,
    rightCm: 2.54,
    bottomCm: 2.54,
    leftCm: 2.54,
    gutterCm: 0,
    gutterPosition: 'left',
    topTwips: 1440,
    rightTwips: 1440,
    bottomTwips: 1440,
    leftTwips: 1440,
    gutterTwips: 0,
  },
  content: {
    widthCm: 11.92,
    heightCm: 17.92,
    widthTwips: 6758,
    heightTwips: 10159,
  },
  isCustomizedFromProfile: false,
  warnings: [],
};

const narrowLayout: ResolvedPageLayout = {
  ...exactLayout,
  margins: {
    ...exactLayout.margins,
    topCm: 1.27,
    rightCm: 1.27,
    bottomCm: 1.27,
    leftCm: 1.27,
    topTwips: 720,
    rightTwips: 720,
    bottomTwips: 720,
    leftTwips: 720,
  },
  content: {
    widthCm: 14.46,
    heightCm: 20.46,
    widthTwips: 8198,
    heightTwips: 11599,
  },
};

const bindingLayout: ResolvedPageLayout = {
  ...exactLayout,
  margins: {
    mode: 'mirrored',
    topCm: 2,
    rightCm: 1.8,
    bottomCm: 2.2,
    leftCm: 2.2,
    insideCm: 2.2,
    outsideCm: 1.8,
    gutterCm: 0.5,
    gutterPosition: 'left',
    topTwips: 1134,
    rightTwips: 1020,
    bottomTwips: 1247,
    leftTwips: 1247,
    gutterTwips: 283,
  },
  content: {
    widthCm: 12.5,
    heightCm: 18.8,
    widthTwips: 7088,
    heightTwips: 10658,
  },
};

const landscapeTopGutterLayout: ResolvedPageLayout = {
  page: {
    widthCm: 29.7,
    heightCm: 21,
    widthTwips: 16838,
    heightTwips: 11906,
  },
  margins: {
    mode: 'standard',
    topCm: 1.25,
    rightCm: 1.1,
    bottomCm: 1.5,
    leftCm: 1.2,
    gutterCm: 0.35,
    gutterPosition: 'top',
    topTwips: 709,
    rightTwips: 624,
    bottomTwips: 850,
    leftTwips: 680,
    gutterTwips: 198,
  },
  content: {
    widthCm: 27.4,
    heightCm: 17.9,
    widthTwips: 15534,
    heightTwips: 10149,
  },
  isCustomizedFromProfile: true,
  warnings: [],
};

const exactSettings: ExportSettings = {
  profileId: 'publisher-exact',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-exact',
};

const narrowSettings: ExportSettings = {
  profileId: 'publisher-narrow',
  pageSizeId: 'tech',
  marginPresetId: 'narrow',
};

const bindingSettings: ExportSettings = {
  profileId: 'publisher-binding',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-binding',
};

const landscapeSettings: ExportSettings = {
  profileId: 'publisher-narrow',
  pageSizeId: 'custom',
  marginPresetId: 'custom',
  customPageSizeCm: { width: 29.7, height: 21 },
  customMargins: {
    mode: 'standard',
    topCm: 1.25,
    rightCm: 1.1,
    bottomCm: 1.5,
    leftCm: 1.2,
    gutterCm: 0.35,
    gutterPosition: 'top',
  },
};

interface PreviewTreeOptions {
  settings: ExportSettings;
  layout: ResolvedPageLayout;
  blocks?: ParsedBlock[];
}

const createPreviewTree = ({
  settings,
  layout,
  blocks = [paragraph],
}: PreviewTreeOptions) => (
  <EditorProvider
    editorState={{
      t: (key: string) => key,
      imageRegistry: {},
      exportSettings: settings,
      resolvedPageLayout: layout,
      documentProfile: getDocumentProfile(settings.profileId),
    } as never}
    darkModeState={{} as never}
  >
    <PreviewPane
      parsedBlocks={blocks}
      previewRef={React.createRef<HTMLDivElement>() as React.RefObject<HTMLDivElement>}
    />
  </EditorProvider>
);

interface AtomicPreviewHarnessProps {
  initialExportSettings?: ExportSettings;
}

const AtomicPreviewHarness: React.FC<AtomicPreviewHarnessProps> = ({
  initialExportSettings,
}) => {
  const editorState = useMarkdownEditor(initialExportSettings);

  return (
    <EditorProvider
      editorState={editorState}
      darkModeState={{} as never}
    >
      <PreviewPane
        parsedBlocks={editorState.parsedBlocks}
        previewRef={editorState.previewRef}
      />
      <button
        type="button"
        onClick={() => editorState.setExportSettings(exactSettings)}
      >
        套用 exact
      </button>
      <button
        type="button"
        onClick={() => editorState.setExportSettings((previous) => ({
          ...previous,
          profileId: 'publisher-narrow',
          marginPresetId: 'narrow',
        }))}
      >
        函式切換 narrow
      </button>
      <button
        type="button"
        onClick={() => editorState.setExportSettings({
          profileId: 'publisher-binding',
          pageSizeId: 'custom',
          marginPresetId: 'custom',
        })}
      >
        套用無效設定
      </button>
      <button
        type="button"
        onClick={() => editorState.setContent([
          '# 下載測試',
          '',
          '[套用後連結](https://example.com/applied)',
          '',
          '```typescript:ln',
          'const applied = true;',
          '```',
        ].join('\n'))}
      >
        載入下載內容
      </button>
      <button
        type="button"
        onClick={() => void editorState.handleDownload()}
      >
        下載 DOCX
      </button>
      <button
        type="button"
        onClick={() => {
          editorState.setExportSettings(exactSettings);
          void editorState.handleDownload();
        }}
      >
        套用 exact 並立即下載
      </button>
      {editorState.exportError && (
        <div role="alert">{editorState.exportError}</div>
      )}
    </EditorProvider>
  );
};

describe('PreviewPane 版面同步', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('以 Context 的 resolved layout 與 document profile 輸出頁面比例和 CSS variables', () => {
    render(createPreviewTree({
      settings: narrowSettings,
      layout: narrowLayout,
    }));

    const page = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(page).toHaveAttribute('data-page-size', '17x23');
    expect(page).toHaveAttribute('data-margin-preset', 'narrow');
    expect(page).toHaveAttribute('data-profile', 'publisher-narrow');
    expect(page.style.aspectRatio).toBe('17 / 23');
    expect(page.style.padding).toBe('1.27cm');
    expect(page.style.getPropertyValue('--page-aspect-ratio')).toBe('17 / 23');
    expect(page.style.getPropertyValue('--page-width')).toBe('17cm');
    expect(page.style.getPropertyValue('--page-height')).toBe('23cm');
    expect(page.style.getPropertyValue('--page-margin-left')).toBe('1.27cm');
    expect(page.style.getPropertyValue('--publisher-body')).toBe('#000000');
    expect(page.style.getPropertyValue('--publisher-heading-1')).toBe('#2E74B5');
    expect(page.style.getPropertyValue('--publisher-caption')).toBe('#555555');
    expect(page.style.getPropertyValue('--publisher-callout-text')).toBe('#0B2545');
    expect(page.style.getPropertyValue('--publisher-body-font')).toContain('Calibri');
    expect(page.style.getPropertyValue('--publisher-code-font')).toContain('Consolas');
    expect(page.style.getPropertyValue('--publisher-table-header-background')).toBe('#E8EEF5');
  });

  it('切換 exact 與 narrow 時保留內容，只改變 resolved layout 的 padding', () => {
    const view = render(createPreviewTree({
      settings: exactSettings,
      layout: exactLayout,
    }));

    const exactPage = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(screen.getByText('相同的預覽內容')).toBeInTheDocument();
    expect(exactPage.style.padding).toBe('2.54cm');

    view.rerender(createPreviewTree({
      settings: narrowSettings,
      layout: narrowLayout,
    }));

    const narrowPage = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(screen.getByText('相同的預覽內容')).toBeInTheDocument();
    expect(narrowPage.style.padding).toBe('1.27cm');
  });

  it('binding 單頁示意把內側映射到左側並加入 gutter，但不宣稱奇偶頁精確', () => {
    render(createPreviewTree({
      settings: bindingSettings,
      layout: bindingLayout,
    }));

    const page = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(page).toHaveAttribute('data-margin-mode', 'mirrored');
    expect(page).toHaveAttribute('data-mirrored-mapping', 'inside-left-outside-right');
    expect(page).toHaveAttribute('data-gutter-position', 'left');
    expect(page.style.paddingTop).toBe('2cm');
    expect(page.style.paddingRight).toBe('1.8cm');
    expect(page.style.paddingBottom).toBe('2.2cm');
    expect(page.style.paddingLeft).toBe('2.7cm');
    expect(page.style.getPropertyValue('--page-margin-inside')).toBe('2.2cm');
    expect(page.style.getPropertyValue('--page-margin-outside')).toBe('1.8cm');
    expect(page.style.getPropertyValue('--page-gutter')).toBe('0.5cm');
    expect(screen.getByText(/內側顯示於左側、外側顯示於右側/)).toBeInTheDocument();
    expect(screen.getByText(/實際奇偶頁以 DOCX 為準/)).toBeInTheDocument();
  });

  it('自訂橫向紙張直接使用解析後寬高，並把 top gutter 加入上方 padding', () => {
    render(createPreviewTree({
      settings: landscapeSettings,
      layout: landscapeTopGutterLayout,
    }));

    const page = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(page).toHaveAttribute('data-page-size', '29.7x21');
    expect(page).toHaveAttribute('data-margin-preset', 'custom');
    expect(page).toHaveAttribute('data-gutter-position', 'top');
    expect(page.style.aspectRatio).toBe('29.7 / 21');
    expect(page.style.paddingTop).toBe('1.6cm');
    expect(page.style.paddingRight).toBe('1.1cm');
    expect(page.style.paddingBottom).toBe('1.5cm');
    expect(page.style.paddingLeft).toBe('1.2cm');
    expect(page.style.width).toBe('100%');
    expect(page.style.maxWidth).toBe('100%');
  });

  it('publisher renderer 使用 profile variables，且移除 legacy 的 H1 黑底線與厚 callout', () => {
    render(createPreviewTree({
      settings: exactSettings,
      layout: exactLayout,
      blocks: publisherBlocks,
    }));

    const heading = screen.getByRole('heading', { name: '出版社標題' });
    const callout = screen.getByText('重要提醒')
      .closest<HTMLElement>('[data-callout-kind]');
    const headerRow = screen.getByText('欄位').closest('tr');

    expect(heading).not.toHaveClass('border-b-4');
    expect(heading.style.color).toBe('var(--publisher-heading-1)');
    expect(callout).toHaveAttribute('data-callout-kind', 'warning');
    expect(callout).not.toHaveClass('border-2');
    expect(callout?.style.backgroundColor).toBe('var(--publisher-callout-warning-background)');
    expect(headerRow?.style.backgroundColor).toBe('var(--publisher-table-header-background)');
  });

  it('technical-legacy renderer 保留既有 H1、warning callout 與表頭外觀', () => {
    render(createPreviewTree({
      settings: DEFAULT_EXPORT_SETTINGS,
      layout: exactLayout,
      blocks: publisherBlocks,
    }));

    const heading = screen.getByRole('heading', { name: '出版社標題' });
    const callout = screen.getByText('重要提醒')
      .closest<HTMLElement>('[data-callout-kind]');
    const headerRow = screen.getByText('欄位').closest('tr');
    const page = screen.getByRole('article', { name: '文件頁面預覽' });

    expect(page).toHaveClass('text-slate-950');
    expect(page.style.fontFamily).toContain('Geist Mono');
    expect(heading).toHaveClass('border-b-4');
    expect(callout).toHaveClass('border-2');
    expect(headerRow).toHaveClass('bg-slate-100');
  });
});

describe('useMarkdownEditor 的版面 Context', () => {
  it('同時公開 resolvedPageLayout 與 documentProfile', () => {
    const { result, unmount } = renderHook(() => useMarkdownEditor());

    expect(result.current.resolvedPageLayout.page).toMatchObject({
      widthCm: 17,
      heightCm: 23,
    });
    expect(result.current.documentProfile.id).toBe('technical-legacy');

    act(() => {
      result.current.setExportSettings(narrowSettings);
    });

    expect(result.current.resolvedPageLayout.margins.leftCm).toBe(1.27);
    expect(result.current.documentProfile.id).toBe('publisher-narrow');
    unmount();
  });

  it('只原子套用合法 settings，invalid 後 Preview、profile 與 download 都保留上一組合法值', async () => {
    vi.mocked(generateDocx).mockImplementation(async (_blocks, options) => {
      resolvePageLayout(options.exportSettings);
      return new Blob(['docx']);
    });

    render(<AtomicPreviewHarness />);
    const getPage = () => screen.getByRole('article', { name: '文件頁面預覽' });

    fireEvent.click(screen.getByRole('button', { name: '套用 exact' }));
    expect(getPage()).toHaveAttribute('data-profile', 'publisher-exact');
    expect(getPage()).toHaveAttribute('data-margin-preset', 'publisher-exact');
    expect(getPage().style.padding).toBe('2.54cm');

    fireEvent.click(screen.getByRole('button', { name: '函式切換 narrow' }));
    expect(getPage()).toHaveAttribute('data-profile', 'publisher-narrow');
    expect(getPage()).toHaveAttribute('data-margin-preset', 'narrow');
    expect(getPage().style.padding).toBe('1.27cm');

    fireEvent.click(screen.getByRole('button', { name: '套用無效設定' }));
    expect(getPage()).toHaveAttribute('data-profile', 'publisher-narrow');
    expect(getPage()).toHaveAttribute('data-margin-preset', 'narrow');
    expect(getPage()).toHaveAttribute('data-page-size', '17x23');
    expect(getPage().style.padding).toBe('1.27cm');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '版面設定無效：自訂紙張尺寸不可為空',
    );

    fireEvent.click(screen.getByRole('button', { name: '載入下載內容' }));
    expect(await screen.findByRole('heading', { name: '下載測試' }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下載 DOCX' }));
    await waitFor(() => expect(generateDocx).toHaveBeenCalledTimes(1));

    expect(generateDocx).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        exportSettings: narrowSettings,
      }),
    );
    expect(screen.queryByText(/DOCX 匯出失敗/)).not.toBeInTheDocument();
  });

  it('applied publisher settings 讓 Preview 套用與 DOCX 相同的 link/code 語意', async () => {
    const { container } = render(<AtomicPreviewHarness />);

    fireEvent.click(screen.getByRole('button', { name: '載入下載內容' }));
    expect(await screen.findByRole('link', { name: '套用後連結' }))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '套用 exact' }));

    const link = screen.getByRole('link', { name: '套用後連結' });
    expect(link.parentElement?.querySelector('svg')).toBeNull();
    expect(screen.queryByText('typescript')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(container.querySelector('[data-profile="publisher-exact"]'))
      .toBeInTheDocument();
  });

  it('initial hydration 無效時原子回退 default triple 並顯示錯誤', () => {
    render(
      <AtomicPreviewHarness
        initialExportSettings={{
          profileId: 'publisher-binding',
          pageSizeId: 'custom',
          marginPresetId: 'custom',
        }}
      />,
    );

    const page = screen.getByRole('article', { name: '文件頁面預覽' });
    expect(page).toHaveAttribute('data-profile', 'technical-legacy');
    expect(page).toHaveAttribute('data-margin-preset', 'publisher-exact');
    expect(page).toHaveAttribute('data-page-size', '17x23');
    expect(page.style.padding).toBe('2.54cm');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '版面設定無效：自訂紙張尺寸不可為空；已改用預設版面',
    );
  });

  it('同一事件套用合法 settings 並立即下載時不讀取舊 render closure', async () => {
    render(<AtomicPreviewHarness />);

    fireEvent.click(screen.getByRole('button', { name: '載入下載內容' }));
    expect(await screen.findByRole('heading', { name: '下載測試' }))
      .toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: '套用 exact 並立即下載' }),
    );
    await waitFor(() => expect(generateDocx).toHaveBeenCalledTimes(1));

    expect(generateDocx).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        exportSettings: exactSettings,
      }),
    );
  });
});
