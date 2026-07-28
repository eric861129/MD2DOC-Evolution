import { describe, expect, it } from 'vitest';
import { WORD_THEME } from '../../constants/theme';
import { getDocumentProfile } from '../../services/docx/profiles';
import {
  createDocumentStyles,
  DOCUMENT_STYLE_IDS,
} from '../../services/docx/styles';

describe('DOCX 文件樣式 Profile', () => {
  it('publisher-exact 使用出版社字體與段落節奏', () => {
    const profile = getDocumentProfile('publisher-exact');

    expect(profile.fonts.body).toEqual({
      ascii: 'Calibri',
      hAnsi: 'Calibri',
      eastAsia: 'Noto Sans TC',
      cs: 'Noto Sans TC',
    });
    expect(profile.paragraph.normal).toMatchObject({
      sizeHalfPoints: 22,
      beforeTwips: 0,
      afterTwips: 120,
      lineTwips: 300,
    });
    expect(profile.heading.h1.sizeHalfPoints).toBe(32);
    expect(profile.heading.h2).toMatchObject({
      sizeHalfPoints: 26,
      color: '2E74B5',
    });
    expect(profile.heading.h3.sizeHalfPoints).toBe(24);
  });

  it('出版社命名樣式保留程式碼、Callout 與圖說規格', () => {
    const profile = getDocumentProfile('publisher-exact');

    expect(profile.paragraph.code).toMatchObject({
      sizeHalfPoints: 18,
      beforeTwips: 0,
      afterTwips: 0,
      lineTwips: 240,
    });
    expect(profile.fonts.code.ascii).toBe('Consolas');
    expect(profile.paragraph.callout).toMatchObject({
      sizeHalfPoints: 21,
      color: '0B2545',
    });
    expect(profile.paragraph.caption).toMatchObject({
      sizeHalfPoints: 18,
      italics: true,
      color: '555555',
    });
  });

  it('三種出版社版型只由版面 preset 區分，樣式 Token 完全相同', () => {
    const exact = getDocumentProfile('publisher-exact');

    for (const profileId of ['publisher-narrow', 'publisher-binding'] as const) {
      const candidate = getDocumentProfile(profileId);
      expect({
        ...candidate,
        id: exact.id,
      }).toEqual(exact);
    }
  });

  it('technical-legacy 保留既有 WORD_THEME 字型、字級與段距', () => {
    const profile = getDocumentProfile('technical-legacy');

    expect(WORD_THEME).toMatchObject({
      FONTS: {
        CJK: 'Microsoft JhengHei',
        LATIN: 'Consolas',
      },
      FONT_SIZES: {
        BODY: 22,
        CODE: 18,
        H1: 32,
        H2: 28,
        H3: 24,
      },
      SPACING: {
        PARAGRAPH: { before: 200, after: 200 },
        H1: { before: 480, after: 240 },
        H2: { before: 400, after: 200 },
        H3: { before: 300, after: 150 },
      },
    });
    expect(profile.fonts.body).toEqual({
      ascii: 'Consolas',
      hAnsi: 'Consolas',
      eastAsia: 'Microsoft JhengHei',
      cs: 'Consolas',
    });
    expect(profile.paragraph.normal).toMatchObject({
      sizeHalfPoints: 22,
      beforeTwips: 200,
      afterTwips: 200,
    });
    expect(profile.heading).toMatchObject({
      h1: { sizeHalfPoints: 32, beforeTwips: 480, afterTwips: 240 },
      h2: { sizeHalfPoints: 28, beforeTwips: 400, afterTwips: 200 },
      h3: { sizeHalfPoints: 24, beforeTwips: 300, afterTwips: 150 },
    });
  });
});

describe('createDocumentStyles', () => {
  it('產生穩定的 Word 樣式 ID 與出版社命名樣式', () => {
    const styles = createDocumentStyles(getDocumentProfile('publisher-exact'));
    const customStyleIds = styles.paragraphStyles?.map((style) => style.id);

    expect(DOCUMENT_STYLE_IDS).toEqual({
      normal: 'Normal',
      heading1: 'Heading1',
      heading2: 'Heading2',
      heading3: 'Heading3',
      codeBlock: 'CodeBlock',
      callout: 'Callout',
      bookCaption: 'BookCaption',
    });
    expect(customStyleIds).toEqual([
      'Normal',
      'CodeBlock',
      'Callout',
      'BookCaption',
    ]);
  });

  it('標題樣式保留同頁控制與正確 outline level', () => {
    const styles = createDocumentStyles(getDocumentProfile('publisher-exact'));

    expect(styles.default?.heading1?.paragraph).toMatchObject({
      keepNext: true,
      keepLines: true,
      outlineLevel: 0,
    });
    expect(styles.default?.heading2?.paragraph).toMatchObject({
      keepNext: true,
      keepLines: true,
      outlineLevel: 1,
    });
    expect(styles.default?.heading3?.paragraph).toMatchObject({
      keepNext: true,
      keepLines: true,
      outlineLevel: 2,
    });
  });

  it('命名樣式使用 Profile 字體、字級、色彩與段落節奏', () => {
    const styles = createDocumentStyles(getDocumentProfile('publisher-exact'));
    const normal = styles.paragraphStyles?.find(({ id }) => id === 'Normal');
    const codeBlock = styles.paragraphStyles?.find(({ id }) => id === 'CodeBlock');
    const callout = styles.paragraphStyles?.find(({ id }) => id === 'Callout');
    const caption = styles.paragraphStyles?.find(({ id }) => id === 'BookCaption');

    expect(normal).toMatchObject({
      run: {
        font: {
          ascii: 'Calibri',
          hAnsi: 'Calibri',
          eastAsia: 'Noto Sans TC',
          cs: 'Noto Sans TC',
        },
        size: 22,
        color: '000000',
      },
      paragraph: {
        spacing: { before: 0, after: 120, line: 300 },
      },
    });
    expect(codeBlock).toMatchObject({
      run: { font: { ascii: 'Consolas' }, size: 18 },
      paragraph: {
        spacing: { before: 0, after: 0, line: 240 },
      },
    });
    expect(callout).toMatchObject({
      run: { size: 21, color: '0B2545' },
    });
    expect(caption).toMatchObject({
      run: { size: 18, italics: true, color: '555555' },
    });
  });
});
