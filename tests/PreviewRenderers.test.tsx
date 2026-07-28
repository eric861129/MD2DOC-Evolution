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
});
