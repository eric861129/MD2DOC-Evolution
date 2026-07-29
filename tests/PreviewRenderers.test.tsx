import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PreviewBlock,
  RenderRichText,
} from '../components/editor/PreviewRenderers';
import { getDocumentProfile } from '../services/docx/profiles';
import type { DocumentStyleProfile } from '../services/docx/profiles';
import i18n from '../services/i18n';
import { BlockType } from '../services/types';

const editorContextState = vi.hoisted(() => ({
  documentProfile: undefined as DocumentStyleProfile | undefined,
}));

vi.mock('../constants/meta', () => ({
  APP_VERSION: '2.0.0',
}));

vi.mock('../contexts/EditorContext', () => ({
  useEditor: () => ({
    documentProfile: editorContextState.documentProfile,
    imageRegistry: {},
  }),
}));

beforeEach(() => {
  editorContextState.documentProfile = getDocumentProfile('technical-legacy');
});

afterEach(async () => {
  await i18n.changeLanguage('zh');
});

describe('PreviewBlock Callout', () => {
  it.each([
    [BlockType.CALLOUT_IMPORTANT, 'IMPORTANT', '重要資訊'],
    [BlockType.CALLOUT_CAUTION, 'CAUTION', '風險提醒'],
  ])('預覽 %s 的語意標籤與內容', (type, label, content) => {
    render(<PreviewBlock block={{ type, content }} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('獨立 QR 預覽保留可點擊標籤且不套用一般段落 renderer', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.QR,
          content: 'GitHub 原始碼',
          metadata: {
            label: 'GitHub 原始碼',
            url: 'https://github.com/example/repo',
          },
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'GitHub 原始碼' }))
      .toHaveAttribute('href', 'https://github.com/example/repo');
  });

  it('章首頁預覽顯示章號、標題、摘要與本章完成目標', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.CHAPTER_OPENER,
          content: '工具箱',
          metadata: {
            chapter: {
              number: '02',
              part: '第一部：心法與準備',
              title: '工具箱',
              englishTitle: 'Developer Toolbox',
              summary: '建立可靠的工作環境。',
              goals: ['完成環境設定。'],
            },
          },
        }}
      />,
    );

    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '工具箱' }))
      .toBeInTheDocument();
    expect(screen.getByText('Developer Toolbox')).toBeInTheDocument();
    expect(screen.getByText('建立可靠的工作環境。')).toBeInTheDocument();
    expect(screen.getByText('本章完成')).toBeInTheDocument();
    expect(screen.getByText('完成環境設定。')).toBeInTheDocument();
  });

  it('遠端圖片需經使用者同意才載入且不傳送 referrer', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.IMAGE,
          content: 'https://tracker.example/cover.png',
          metadata: { alt: '遠端封面' },
        }}
      />,
    );

    expect(screen.queryByRole('img', { name: '遠端封面' }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {
      name: '載入遠端圖片：遠端封面',
    }));

    expect(screen.getByRole('img', { name: '遠端封面' })).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
  });

  it('data URL 圖片不需確認即可預覽', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.IMAGE,
          content: 'data:image/png;base64,AA==',
          metadata: { alt: '本機圖片' },
        }}
      />,
    );

    expect(screen.getByRole('img', { name: '本機圖片' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', {
      name: '載入遠端圖片：本機圖片',
    })).not.toBeInTheDocument();
  });

  it('英文介面顯示英文遠端圖片確認文字', async () => {
    await i18n.changeLanguage('en');

    render(
      <PreviewBlock
        block={{
          type: BlockType.IMAGE,
          content: 'https://tracker.example/cover.png',
          metadata: { alt: 'Remote cover' },
        }}
      />,
    );

    expect(screen.getByRole('button', {
      name: 'Load remote image: Remote cover',
    })).toHaveTextContent('Load remote image');
  });
});

describe('PreviewBlock Profile 樣式', () => {
  it('publisher 對話預覽將角色與內容分成上下兩行', () => {
    editorContextState.documentProfile = getDocumentProfile('publisher-exact');

    render(
      <PreviewBlock
        block={{
          type: BlockType.CHAT_CUSTOM,
          role: '設計師',
          alignment: 'left',
          content: '這是對話內容。',
        }}
      />,
    );

    const role = screen.getByText('設計師：');
    const content = screen.getByText('這是對話內容。');
    expect(role.tagName).toBe('STRONG');
    expect(role).toHaveAttribute('data-dialogue-role', 'publisher');
    const contentContainer = content.closest('[data-dialogue-content]');
    expect(contentContainer).toHaveAttribute(
      'data-dialogue-content',
      'publisher',
    );
    expect(role.parentElement).toBe(contentContainer?.parentElement);
  });

  it('technical-legacy 對話預覽保留浮動角色標籤', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.CHAT_CUSTOM,
          role: '舊版角色',
          alignment: 'right',
          content: '舊版對話內容。',
        }}
      />,
    );

    expect(screen.getByText('舊版角色')).not
      .toHaveAttribute('data-dialogue-role');
    expect(screen.getByText('舊版對話內容。')).not
      .toHaveAttribute('data-dialogue-content');
  });

  it('publisher 一般連結不顯示 legacy QR icon', () => {
    editorContextState.documentProfile = getDocumentProfile('publisher-exact');

    const { container } = render(
      <RenderRichText text="[Publisher link](https://example.com/publisher)" />,
    );

    expect(screen.getByRole('link', { name: 'Publisher link' }))
      .toHaveAttribute('href', 'https://example.com/publisher');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('technical-legacy 一般連結保留 QR icon', () => {
    const { container } = render(
      <RenderRichText text="[Legacy link](https://example.com/legacy)" />,
    );

    expect(screen.getByRole('link', { name: 'Legacy link' }))
      .toHaveAttribute('href', 'https://example.com/legacy');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('publisher code 不顯示 DOCX 省略的語言 badge 與行號', () => {
    editorContextState.documentProfile = getDocumentProfile('publisher-exact');

    render(
      <PreviewBlock
        block={{
          type: BlockType.CODE_BLOCK,
          content: 'const first = 1;\nconst second = 2;',
          metadata: {
            language: 'typescript',
            showLineNumbers: true,
          },
        }}
      />,
    );

    expect(screen.queryByText('typescript')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('technical-legacy code 保留語言 badge 與行號', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.CODE_BLOCK,
          content: 'const first = 1;\nconst second = 2;',
          metadata: {
            language: 'typescript',
            showLineNumbers: true,
          },
        }}
      />,
    );

    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('publisher code content 直接使用 profile font/color 且不受 legacy class 覆蓋', () => {
    editorContextState.documentProfile = getDocumentProfile('publisher-exact');

    render(
      <PreviewBlock
        block={{
          type: BlockType.CODE_BLOCK,
          content: 'const publisher = true;',
          metadata: { showLineNumbers: false },
        }}
      />,
    );

    const code = screen.getByText('const publisher = true;');
    expect(code).not.toHaveClass('text-slate-950');
    expect(code.style.fontFamily).toBe('var(--publisher-code-font, monospace)');
    expect(code.style.color).toBe('var(--publisher-body, currentColor)');
    expect(code.parentElement).not.toHaveClass('font-mono');
  });

  it('technical-legacy code 完整保留 font-mono 與 text-slate-950 classes', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.CODE_BLOCK,
          content: 'const legacy = true;',
          metadata: { showLineNumbers: false },
        }}
      />,
    );

    const code = screen.getByText('const legacy = true;');
    expect(code).toHaveClass('text-slate-950');
    expect(code.style.fontFamily).toBe('');
    expect(code.style.color).toBe('');
    expect(code.parentElement).toHaveClass('font-mono');
  });

  it('publisher QR label 使用 inline-code profile variable', () => {
    editorContextState.documentProfile = getDocumentProfile('publisher-exact');

    render(
      <PreviewBlock
        block={{
          type: BlockType.QR,
          content: 'Publisher QR',
          metadata: {
            label: 'Publisher QR',
            url: 'https://example.com/publisher',
          },
        }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Publisher QR' });
    expect(link).not.toHaveClass('text-[#9B1C1C]');
    expect(link.style.color).toBe('var(--publisher-inline-code, #9B1C1C)');
  });

  it('technical-legacy QR label 保留既有固定色 class', () => {
    render(
      <PreviewBlock
        block={{
          type: BlockType.QR,
          content: 'Legacy QR',
          metadata: {
            label: 'Legacy QR',
            url: 'https://example.com/legacy',
          },
        }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Legacy QR' });
    expect(link).toHaveClass('text-[#9B1C1C]');
    expect(link.style.color).toBe('');
  });
});
