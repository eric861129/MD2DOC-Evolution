import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InsertMenu } from '../components/editor/InsertMenu';

describe('InsertMenu', () => {
  it('在共用選單依群組提供完整插入命令', () => {
    const onInsert = vi.fn();
    render(
      <InsertMenu
        label="插入"
        onInsert={onInsert}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '插入' }));
    expect(screen.getByText('清單')).toBeInTheDocument();
    expect(screen.getByText('圖片與連結')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: '插入待辦清單' }));
    expect(onInsert).toHaveBeenCalledWith('- [ ] ');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
