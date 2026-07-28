import { act, renderHook } from '@testing-library/react';
import saveAs from 'file-saver';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocxExport } from '../hooks/useDocxExport';
import { generateDocx } from '../services/docxGenerator';
import { BlockType } from '../services/types';

vi.mock('file-saver', () => ({ default: vi.fn() }));
vi.mock('../services/docxGenerator', () => ({
  generateDocx: vi.fn(async () => new Blob(['docx'])),
}));

describe('useDocxExport DOCX 品質錯誤', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('顯示可讀繁中原因且不下載壞 Blob', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(generateDocx).mockRejectedValueOnce(Object.assign(
      new Error('DOCX 封裝品質檢查失敗'),
      {
        name: 'DocxQualityError',
        issues: [{
          severity: 'error',
          code: 'RELATIONSHIP_TARGET_MISSING',
          message: 'Relationship 指向不存在的項目：media/missing.png',
          entry: 'word/_rels/document.xml.rels',
        }],
      },
    ));
    const { result, unmount } = renderHook(() => useDocxExport({
      content: '可匯出的內文',
      parsedBlocks: [{
        type: BlockType.PARAGRAPH,
        content: '可匯出的內文',
      }],
      documentMeta: { title: '品質測試', author: '黃祈豫' },
      imageRegistry: {},
    }));

    await act(async () => {
      await result.current.handleDownload();
    });

    expect(result.current.exportError).toBe(
      'DOCX 封裝品質檢查失敗：Relationship 指向不存在的項目：media/missing.png',
    );
    expect(saveAs).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
    unmount();
  });
});
