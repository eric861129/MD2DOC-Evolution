import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getExampleManuscript } from '../constants/exampleContent';
import { useEditorState } from '../hooks/useEditorState';
import { validateExport } from '../services/exportValidation';
import { BlockType } from '../services/types';

const changeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'zh',
      changeLanguage,
    },
  }),
}));

describe('useEditorState 內建範例圖片', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('重新開啟內建完整稿草稿時會恢復圖片且不出現匯出提醒', async () => {
    const example = getExampleManuscript('complete-zh');
    localStorage.setItem('draft_content', example.content);
    const { result, unmount } = renderHook(() => useEditorState());

    await waitFor(() => {
      expect(result.current.parsedBlocks.length).toBeGreaterThan(0);
    });

    const issues = await validateExport({
      content: result.current.content,
      blocks: result.current.parsedBlocks.filter(({ type }) => (
        type === BlockType.CHAPTER_OPENER || type === BlockType.IMAGE
      )),
      meta: result.current.documentMeta,
      imageRegistry: result.current.imageRegistry,
    });

    expect(result.current.imageRegistry).toMatchObject(
      example.imageRegistry ?? {},
    );
    expect(issues).toEqual([]);
    unmount();
  });
});
