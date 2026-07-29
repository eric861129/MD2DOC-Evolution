import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorPane } from '../components/editor/EditorPane';

const registerImage = vi.fn();

vi.mock('../contexts/EditorContext', () => ({
  useEditor: () => ({
    registerImage,
    t: (key: string) => ({
      'workspace.editor': '稿件編輯',
      'workspace.source': 'Markdown 草稿',
      'workspace.words': '字數',
      'workspace.insert': '插入',
      'workspace.import': '匯入',
      'workspace.importHelp': '點選或拖入 .md 與圖片',
      'workspace.emptyTitle': '開始建立',
      'workspace.emptyDescription': '請輸入內容',
      'imports.replaceConfirm': '確定取代？',
    }[key] ?? key),
  }),
}));

describe('EditorPane click import', () => {
  beforeEach(() => {
    registerImage.mockReset();
  });

  it('可由檔案按鈕匯入 Markdown', async () => {
    const setContent = vi.fn();
    const { container } = render(
      <EditorPane
        content=""
        setContent={setContent}
        wordCount={0}
        textareaRef={React.createRef<HTMLTextAreaElement>()}
        onScroll={vi.fn()}
      />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const markdown = new File(['# 匯入稿件'], 'manuscript.md', {
      type: 'text/markdown',
    });

    expect(screen.getByRole('button', { name: '匯入' })).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [markdown] } });

    await waitFor(() => expect(setContent).toHaveBeenCalledWith('# 匯入稿件'));
  });

  it('可由同一按鈕匯入圖片並插入 Markdown 圖片語法', async () => {
    const setContent = vi.fn();
    const { container } = render(
      <EditorPane
        content=""
        setContent={setContent}
        wordCount={0}
        textareaRef={React.createRef<HTMLTextAreaElement>()}
        onScroll={vi.fn()}
      />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const image = new File([new Uint8Array([137, 80, 78, 71])], 'cover.png', {
      type: 'image/png',
    });

    fireEvent.change(input, { target: { files: [image] } });

    await waitFor(() => expect(registerImage).toHaveBeenCalledOnce());
    expect(setContent).toHaveBeenCalledWith(
      expect.stringMatching(/^!\[cover\.png\]\(img_\d+_\d+\)\n$/),
    );
  });
});
