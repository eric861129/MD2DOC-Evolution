import { describe, expect, it } from 'vitest';
import { createEditorInsertion } from '../utils/editor/insertTemplate';

describe('createEditorInsertion', () => {
  it('在游標位置補齊必要換行並回傳新游標', () => {
    expect(createEditorInsertion(
      '前段後段',
      '## 標題',
      2,
      2,
    )).toEqual({
      content: '前段\n## 標題\n後段',
      insertedText: '\n## 標題\n',
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it('選取文字時只取代選取區，不重複插入多餘換行', () => {
    expect(createEditorInsertion(
      '第一行\n舊內容\n末行',
      '- 新項目\n',
      4,
      7,
    )).toMatchObject({
      content: '第一行\n- 新項目\n末行',
      insertedText: '- 新項目\n',
    });
  });
});
