import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { generateDocx } from '../services/docxGenerator';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

describe('task list semantics', () => {
  it('保留待辦清單的完成狀態，且不混入一般無序清單', () => {
    const { blocks } = parseMarkdown([
      '- [ ] 待確認換頁',
      '- [x] 已完成邊界設定',
      '- 一般無序清單',
    ].join('\n'));

    expect(blocks).toEqual([
      expect.objectContaining({
        type: BlockType.TASK_LIST,
        content: '待確認換頁',
        metadata: expect.objectContaining({ checked: false }),
      }),
      expect.objectContaining({
        type: BlockType.TASK_LIST,
        content: '已完成邊界設定',
        metadata: expect.objectContaining({ checked: true }),
      }),
      expect.objectContaining({
        type: BlockType.BULLET_LIST,
        content: '一般無序清單',
      }),
    ]);
  });

  it('DOCX 待辦項目使用核取方塊文字，不產生 Word 項目符號編號', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.TASK_LIST,
        content: '待確認換頁',
        metadata: { checked: false },
      },
      {
        type: BlockType.TASK_LIST,
        content: '已完成邊界設定',
        metadata: { checked: true },
      },
    ], {
      showLineNumbers: false,
      exportSettings: {
        profileId: 'publisher-narrow',
        pageSizeId: 'tech',
        marginPresetId: 'narrow',
      },
    });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await zip.file('word/document.xml')!.async('string');

    expect(documentXml).toContain('☐');
    expect(documentXml).toContain('☒');
    expect(documentXml).not.toContain('<w:numPr>');
  });
});
