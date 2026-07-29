import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPORT_SETTINGS } from '../../services/docx/layout/presets';
import { resolvePageLayout } from '../../services/docx/layout/resolve';

describe('resolvePageLayout', () => {
  it('解析出版社一致版為 17.6x23.6 公分、上下 2.1 與左右 2.3 公分邊界', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-exact',
      marginPresetId: 'publisher-exact',
    });

    expect(layout.page.widthCm).toBe(17.6);
    expect(layout.page.heightCm).toBe(23.6);
    expect(layout.page.widthTwips).toBe(9978);
    expect(layout.page.heightTwips).toBe(13380);
    expect(layout.margins).toMatchObject({
      topCm: 2.1,
      rightCm: 2.3,
      bottomCm: 2.1,
      leftCm: 2.3,
      topTwips: 1191,
      rightTwips: 1304,
      bottomTwips: 1191,
      leftTwips: 1304,
    });
    expect(layout.content.widthCm).toBeCloseTo(13, 2);
    expect(layout.content.widthTwips).toBe(7370);
  });

  it('technical-legacy 預設仍維持四邊 2.54 公分', () => {
    const layout = resolvePageLayout(DEFAULT_EXPORT_SETTINGS);

    expect(layout.margins).toMatchObject({
      topCm: 2.54,
      rightCm: 2.54,
      bottomCm: 2.54,
      leftCm: 2.54,
      topTwips: 1440,
      rightTwips: 1440,
      bottomTwips: 1440,
      leftTwips: 1440,
    });
  });

  it('解析窄邊界內容寬度為 15.06 公分', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-narrow',
      marginPresetId: 'narrow',
    });

    expect(layout.content.widthCm).toBeCloseTo(15.06, 2);
  });

  it('拒絕有效內容寬度小於 8 公分', () => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      pageSizeId: 'custom',
      customPageSizeCm: { width: 10, height: 20 },
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 2,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 1,
        gutterPosition: 'left',
      },
    })).toThrow('有效內容寬度不得小於 8 公分');
  });

  it('鏡像邊界將內外側保留給 UI 並寫入 OOXML 左右邊界', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-binding',
      marginPresetId: 'publisher-binding',
    });

    expect(layout.margins).toMatchObject({
      mode: 'mirrored',
      topCm: 2,
      bottomCm: 2.2,
      leftCm: 2.2,
      rightCm: 1.8,
      insideCm: 2.2,
      outsideCm: 1.8,
      gutterCm: 0.5,
    });
    expect(layout.content.widthCm).toBeCloseTo(13.1, 2);
    expect(layout.content.widthTwips).toBe(7428);
  });

  it('自訂邊界低於 1 公分時回傳列印風險警告', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 0.8,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 0,
        gutterPosition: 'left',
      },
    });

    expect(layout.warnings).toContain('邊界小於 1 公分，列印時可能有裁切風險。');
  });

  it('拒絕超出 0.50 至 5.00 公分範圍的自訂邊界', () => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 0.49,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 0,
        gutterPosition: 'left',
      },
    })).toThrow('自訂邊界必須介於 0.50 至 5.00 公分之間');
  });

  it('允許 0 公分裝訂預留且不產生邊界列印風險', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 2,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 0,
        gutterPosition: 'left',
      },
    });

    expect(layout.margins.gutterCm).toBe(0);
    expect(layout.warnings).not.toContain('邊界小於 1 公分，列印時可能有裁切風險。');
  });

  it.each([-0.01, 5.01])('拒絕超出 0.00 至 5.00 公分範圍的裝訂預留：%s', (gutterCm) => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'mirrored',
        topCm: 2,
        bottomCm: 2,
        insideCm: 2,
        outsideCm: 2,
        gutterCm,
        gutterPosition: 'left',
      },
    })).toThrow('裝訂預留必須介於 0.00 至 5.00 公分之間');
  });

  it('拒絕鏡像邊界搭配上方裝訂預留', () => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'mirrored',
        topCm: 2,
        bottomCm: 2,
        insideCm: 2,
        outsideCm: 2,
        gutterCm: 0.5,
        gutterPosition: 'top',
      },
    })).toThrow('鏡像邊界不可搭配上方裝訂預留');
  });

  it('上方裝訂預留只扣除內容高度並保留完整水平內容寬度', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 2,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 0.5,
        gutterPosition: 'top',
      },
    });

    expect(layout.content.widthCm).toBeCloseTo(13.6, 2);
    expect(layout.content).toMatchObject({
      heightCm: 19.1,
      widthTwips: 7710,
      heightTwips: 10829,
    });
  });

  it.each([NaN, Infinity, -Infinity])('拒絕非有限的自訂邊界數值：%s', (value) => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: value,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 0,
        gutterPosition: 'left',
      },
    })).toThrow('自訂邊界必須為有限數值');
  });

  it.each([NaN, Infinity, -Infinity])('拒絕非有限的自訂紙張尺寸：%s', (value) => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      pageSizeId: 'custom',
      customPageSizeCm: { width: value, height: 20 },
    })).toThrow('自訂紙張尺寸必須為有限數值');
  });

  it.each([9.99, 100.01])('拒絕超出 10.00 至 100.00 公分範圍的自訂紙張寬度：%s', (width) => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      pageSizeId: 'custom',
      customPageSizeCm: { width, height: 20 },
    })).toThrow('自訂紙張尺寸必須介於 10.00 至 100.00 公分之間');
  });

  it('覆寫出版社一致版幾何時標記為已自訂並提出頁碼警告', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-exact',
      marginPresetId: 'narrow',
    });

    expect(layout.isCustomizedFromProfile).toBe(true);
    expect(layout.warnings).toContain('已自訂；不保證與出版社參考稿頁碼一致');
  });
});
