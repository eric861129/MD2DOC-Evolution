import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewBlock } from '../components/editor/PreviewRenderers';
import { BlockType } from '../services/types';

vi.mock('../contexts/EditorContext', () => ({
  useEditor: () => ({ imageRegistry: {} }),
}));

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
});
