import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIPromptModal } from '../components/AIPromptModal';

describe('AIPromptModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  it('顯示兩種 AI 提示模式與 Profile 邊界', () => {
    render(<AIPromptModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'AI 轉稿提示 v2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /轉換既有稿件/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /建立新稿初稿/ })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('ai-prompt-preview')).toHaveTextContent(
      'https://github.com/eric861129/MD2DOC-Evolution',
    );
    expect(screen.getByTestId('ai-prompt-preview')).toHaveTextContent('Profile and Pagination Boundary');
  });

  it('可分別複製既有稿件轉換與新稿初稿提示詞', async () => {
    render(<AIPromptModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '複製轉換既有稿件提示詞' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0])
      .toContain('## Source Manuscript');
    expect(await screen.findByText('已複製')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /建立新稿初稿/ }));
    expect(screen.getByTestId('ai-prompt-preview')).toHaveTextContent('## Book Brief');

    fireEvent.click(screen.getByRole('button', { name: '複製建立新稿初稿提示詞' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[1][0])
      .toContain('## Book Brief');
  });
});
