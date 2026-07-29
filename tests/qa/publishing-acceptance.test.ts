import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  inspectPublisherDocx,
  PUBLISHER_ACCEPTANCE_PROFILES,
} from '../../services/docx/acceptance';
import { generateDocx } from '../../services/docxGenerator';
import { parseMarkdown } from '../../services/markdownParser';

const acceptanceMarkdown = [
  '[TOC]',
  '',
  '[CHAPTER]',
  '',
  '第一部：建立觀測站',
  '',
  '01',
  '',
  '# 點亮第一張星圖',
  '',
  '- 檢查北方定位刻度',
  '- 記錄觀測時間',
  '',
  '- [ ] 待確認出版社換頁',
  '- [x] 已完成紙張與邊界設定',
  '',
].join('\n');

describe('出版級 DOCX 驗收', () => {
  it.each(PUBLISHER_ACCEPTANCE_PROFILES)(
    '$profileId 會通過版面、目錄、書籤、清單與分頁標記檢查',
    async (profile) => {
      const parsed = parseMarkdown(acceptanceMarkdown);
      const blob = await generateDocx(parsed.blocks, {
        exportSettings: profile.exportSettings,
        showLineNumbers: true,
        meta: parsed.meta,
      });

      const result = await inspectPublisherDocx(blob, profile, {
        expectedBulletTexts: ['檢查北方定位刻度', '記錄觀測時間'],
        expectedTaskTexts: ['待確認出版社換頁', '已完成紙張與邊界設定'],
        minimumMediaCount: 0,
      });

      expect(result.status).toBe('passed');
      expect(result.checks.every(({ passed }) => passed)).toBe(true);
      expect(result.metrics.tocFieldCount).toBeGreaterThanOrEqual(1);
      expect(result.metrics.bookmarkPairCount).toBeGreaterThanOrEqual(2);
      expect(result.metrics.explicitPageBreakCount).toBeGreaterThanOrEqual(1);
      expect(result.metrics.bulletParagraphCount).toBe(2);
      expect(result.metrics.taskParagraphCount).toBe(2);
    },
  );

  it('再次出現非列印分頁標記時會讓驗收失敗', async () => {
    const parsed = parseMarkdown(acceptanceMarkdown);
    const blob = await generateDocx(parsed.blocks, {
      exportSettings: PUBLISHER_ACCEPTANCE_PROFILES[0].exportSettings,
      showLineNumbers: true,
      meta: parsed.meta,
    });
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await zip.file('word/document.xml')!.async('string');
    zip.file(
      'word/document.xml',
      documentXml.replace('<w:pPr>', '<w:pPr><w:keepNext/>'),
    );
    const tampered = new Blob([
      await zip.generateAsync({ type: 'uint8array' }),
    ]);

    const result = await inspectPublisherDocx(
      tampered,
      PUBLISHER_ACCEPTANCE_PROFILES[0],
      {
        expectedBulletTexts: ['檢查北方定位刻度'],
        expectedTaskTexts: ['待確認出版社換頁'],
        minimumMediaCount: 0,
      },
    );

    expect(result.status).toBe('failed');
    expect(result.checks).toContainEqual(expect.objectContaining({
      id: 'nonprinting-pagination-markers',
      passed: false,
    }));
  });
});
