import { WORD_THEME } from '../../../constants/theme';
import type { DocumentStyleProfile, FontFamilySet } from './types';

const legacyFont: FontFamilySet = {
  ascii: WORD_THEME.FONTS.LATIN,
  hAnsi: WORD_THEME.FONTS.LATIN,
  eastAsia: WORD_THEME.FONTS.CJK,
  cs: WORD_THEME.FONTS.LATIN,
};

/** 舊版 Profile 直接映射既有 WORD_THEME，避免改變現行匯出外觀。 */
export const LEGACY_DOCUMENT_PROFILE: DocumentStyleProfile = {
  id: 'technical-legacy',
  fonts: {
    body: legacyFont,
    code: legacyFont,
  },
  colors: {
    body: WORD_THEME.COLORS.BLACK,
    heading1: WORD_THEME.COLORS.BLACK,
    heading2: WORD_THEME.COLORS.BLACK,
    heading3: WORD_THEME.COLORS.BLACK,
    inlineCode: WORD_THEME.COLORS.BLACK,
    caption: WORD_THEME.COLORS.BLACK,
    calloutText: WORD_THEME.COLORS.BLACK,
  },
  paragraph: {
    normal: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.BODY,
      beforeTwips: WORD_THEME.SPACING.PARAGRAPH.before,
      afterTwips: WORD_THEME.SPACING.PARAGRAPH.after,
      color: WORD_THEME.COLORS.BLACK,
    },
    code: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.CODE,
      beforeTwips: WORD_THEME.SPACING.CODE_BLOCK.before,
      afterTwips: WORD_THEME.SPACING.CODE_BLOCK.after,
      lineTwips: WORD_THEME.SPACING.CODE_BLOCK.line,
      shadingFill: WORD_THEME.COLORS.BG_CODE,
      leftIndentTwips: WORD_THEME.LAYOUT.INDENT.CODE,
      rightIndentTwips: WORD_THEME.LAYOUT.INDENT.CODE,
    },
    callout: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.BODY,
      beforeTwips: WORD_THEME.SPACING.CALLOUT.before,
      afterTwips: WORD_THEME.SPACING.CALLOUT.after,
      lineTwips: WORD_THEME.SPACING.CALLOUT.line,
      color: WORD_THEME.COLORS.BLACK,
      leftIndentTwips: WORD_THEME.LAYOUT.INDENT.CALLOUT,
      rightIndentTwips: WORD_THEME.LAYOUT.INDENT.CALLOUT,
    },
    caption: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.LABEL,
      beforeTwips: 0,
      afterTwips: WORD_THEME.SPACING.TABLE_AFTER,
      color: WORD_THEME.COLORS.BLACK,
    },
  },
  heading: {
    h1: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.H1,
      beforeTwips: WORD_THEME.SPACING.H1.before,
      afterTwips: WORD_THEME.SPACING.H1.after,
      color: WORD_THEME.COLORS.BLACK,
      bold: true,
      outlineLevel: 0,
    },
    h2: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.H2,
      beforeTwips: WORD_THEME.SPACING.H2.before,
      afterTwips: WORD_THEME.SPACING.H2.after,
      color: WORD_THEME.COLORS.BLACK,
      bold: true,
      outlineLevel: 1,
    },
    h3: {
      sizeHalfPoints: WORD_THEME.FONT_SIZES.H3,
      beforeTwips: WORD_THEME.SPACING.H3.before,
      afterTwips: WORD_THEME.SPACING.H3.after,
      color: WORD_THEME.COLORS.BLACK,
      bold: true,
      outlineLevel: 2,
    },
  },
  callouts: {
    note: { label: 'NOTE', fill: WORD_THEME.COLORS.CALLOUT.NOTE.BG },
    tip: { label: 'TIP', fill: WORD_THEME.COLORS.CALLOUT.TIP.BG },
    warning: { label: 'WARNING', fill: WORD_THEME.COLORS.CALLOUT.WARNING.BG },
    important: { label: 'IMPORTANT', fill: WORD_THEME.COLORS.CALLOUT.NOTE.BG },
    caution: { label: 'CAUTION', fill: WORD_THEME.COLORS.CALLOUT.WARNING.BG },
  },
  table: {
    styleId: 'TableGrid',
    headerFill: WORD_THEME.COLORS.BG_BUTTON,
    indentTwips: 0,
    cellMarginsTwips: { top: 0, bottom: 0, start: 0, end: 0 },
    bodySizeHalfPoints: WORD_THEME.FONT_SIZES.BODY,
    paragraphAfterTwips: WORD_THEME.SPACING.TABLE_AFTER,
  },
  image: {
    maxWidthCm: 13,
    chapterOpenerWidthCm: 9.8,
    allowedMarginIntrusionCm: 0,
  },
  headerFooter: {
    distanceCm: 1.25,
    showTitle: true,
    showBookAndPage: false,
  },
};
