import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import saveAs from 'file-saver';
import { GuideCenter } from '../components/GuideCenter';

vi.mock('file-saver', () => ({
  default: vi.fn(),
}));

describe('GuideCenter', () => {
  beforeEach(() => {
    vi.mocked(saveAs).mockClear();
  });

  it('提供目錄、搜尋、章節導覽與完整範例下載', async () => {
    render(<GuideCenter isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', {
      name: 'MD2DOC-Evolution 完整使用教學',
    })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '教學章節' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1. 三分鐘快速開始' }))
      .toHaveAttribute('aria-current', 'page');

    fireEvent.change(screen.getByRole('searchbox', { name: '搜尋教學' }), {
      target: { value: 'Word 換頁' },
    });
    expect(screen.getByRole('button', { name: '8. Word 後製與換頁專章' }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '完整範例 Markdown' }));
    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveAs).mock.calls[0][1])
      .toBe('MD2DOC-Evolution_中文完整功能稿.md');
    expect(screen.getByRole('button', { name: '完整範例 DOCX' }))
      .toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '完整範例 DOCX' }));
    await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(2), {
      timeout: 15_000,
    });
    expect(vi.mocked(saveAs).mock.calls[1][1])
      .toBe('MD2DOC-Evolution_中文完整功能稿_窄邊界.docx');
  }, 20_000);
});
