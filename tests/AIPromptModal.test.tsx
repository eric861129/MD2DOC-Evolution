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

  it('renders the repo-aware AI prompt contract', () => {
    render(<AIPromptModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'AI 轉稿提示' })).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/github\.com\/eric861129\/MD2DOC-Evolution/)).toBeInTheDocument();
    expect(screen.getByText(/Non-negotiable Output Contract/)).toBeInTheDocument();
    expect(screen.getByText(/只輸出「轉換後的 Markdown 原稿」/)).toBeInTheDocument();
  });

  it('copies the full prompt to the clipboard', async () => {
    render(<AIPromptModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /複製/ }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(copied).toContain('https://github.com/eric861129/MD2DOC-Evolution');
    expect(copied).toContain('Silent Quality Check Before Answering');
    expect(await screen.findByText('已複製')).toBeInTheDocument();
  });
});
