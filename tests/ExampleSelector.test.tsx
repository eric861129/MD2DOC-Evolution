import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExampleSelector } from '../components/editor/ExampleSelector';

describe('ExampleSelector', () => {
  it('列出中英文快速與完整範例，並回傳選取的稿件', () => {
    const onSelect = vi.fn();
    render(
      <ExampleSelector
        label="範例稿件"
        placeholder="載入範例"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('combobox', { name: '範例稿件' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '中文快速範例' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '中文完整功能稿' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English quick example' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English complete manuscript' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'complete-en' },
    });

    expect(onSelect).toHaveBeenCalledWith('complete-en');
  });
});
