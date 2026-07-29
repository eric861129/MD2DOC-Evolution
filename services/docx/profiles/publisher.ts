import { PUBLISHER_WORD_THEME } from '../../../constants/theme';
import type { DocumentProfileId } from '../layout/types';
import type { DocumentStyleProfile, FontFamilySet } from './types';

type PublisherProfileId = Exclude<DocumentProfileId, 'technical-legacy'>;

const publisherBodyFont: FontFamilySet = {
  ascii: PUBLISHER_WORD_THEME.FONTS.BODY_LATIN,
  hAnsi: PUBLISHER_WORD_THEME.FONTS.BODY_LATIN,
  eastAsia: PUBLISHER_WORD_THEME.FONTS.CJK,
  cs: PUBLISHER_WORD_THEME.FONTS.CJK,
};

const publisherCodeFont: FontFamilySet = {
  ascii: PUBLISHER_WORD_THEME.FONTS.CODE_LATIN,
  hAnsi: PUBLISHER_WORD_THEME.FONTS.CODE_LATIN,
  eastAsia: PUBLISHER_WORD_THEME.FONTS.CJK,
  cs: PUBLISHER_WORD_THEME.FONTS.CJK,
};

const publisherStyleTokens: Omit<DocumentStyleProfile, 'id'> = {
  fonts: {
    body: publisherBodyFont,
    code: publisherCodeFont,
  },
  colors: {
    body: PUBLISHER_WORD_THEME.COLORS.BODY,
    heading1: PUBLISHER_WORD_THEME.COLORS.HEADING_1,
    heading2: PUBLISHER_WORD_THEME.COLORS.HEADING_2,
    heading3: PUBLISHER_WORD_THEME.COLORS.HEADING_3,
    inlineCode: PUBLISHER_WORD_THEME.COLORS.INLINE_CODE,
    caption: PUBLISHER_WORD_THEME.COLORS.CAPTION,
    calloutText: PUBLISHER_WORD_THEME.COLORS.CALLOUT_TEXT,
  },
  paragraph: {
    normal: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.BODY,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.line,
      color: PUBLISHER_WORD_THEME.COLORS.BODY,
    },
    code: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.CODE,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.CODE_BLOCK.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.CODE_BLOCK.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.CODE_BLOCK.line,
      shadingFill: PUBLISHER_WORD_THEME.COLORS.CODE_BACKGROUND,
      leftIndentTwips: 230,
      rightIndentTwips: 230,
    },
    callout: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.CALLOUT,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.CALLOUT.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.CALLOUT.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.CALLOUT.line,
      color: PUBLISHER_WORD_THEME.COLORS.CALLOUT_TEXT,
      leftIndentTwips: 230,
      rightIndentTwips: 230,
    },
    caption: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.CAPTION,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.CAPTION.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.CAPTION.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.CAPTION.line,
      color: PUBLISHER_WORD_THEME.COLORS.CAPTION,
      italics: true,
    },
  },
  heading: {
    h1: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.H1,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.H1.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.H1.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.line,
      color: PUBLISHER_WORD_THEME.COLORS.HEADING_1,
      bold: true,
      outlineLevel: 0,
    },
    h2: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.H2,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.H2.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.H2.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.line,
      color: PUBLISHER_WORD_THEME.COLORS.HEADING_2,
      bold: true,
      outlineLevel: 1,
    },
    h3: {
      sizeHalfPoints: PUBLISHER_WORD_THEME.FONT_SIZES.H3,
      beforeTwips: PUBLISHER_WORD_THEME.SPACING.H3.before,
      afterTwips: PUBLISHER_WORD_THEME.SPACING.H3.after,
      lineTwips: PUBLISHER_WORD_THEME.SPACING.PARAGRAPH.line,
      color: PUBLISHER_WORD_THEME.COLORS.HEADING_3,
      bold: true,
      outlineLevel: 2,
    },
  },
  callouts: {
    note: {
      label: 'NOTE',
      fill: PUBLISHER_WORD_THEME.CALLOUT_BACKGROUNDS.NOTE,
    },
    tip: {
      label: 'TIP',
      fill: PUBLISHER_WORD_THEME.CALLOUT_BACKGROUNDS.TIP,
    },
    warning: {
      label: 'WARNING',
      fill: PUBLISHER_WORD_THEME.CALLOUT_BACKGROUNDS.WARNING,
    },
    important: {
      label: 'IMPORTANT',
      fill: PUBLISHER_WORD_THEME.CALLOUT_BACKGROUNDS.IMPORTANT,
    },
    caution: {
      label: 'CAUTION',
      fill: PUBLISHER_WORD_THEME.CALLOUT_BACKGROUNDS.CAUTION,
    },
  },
  table: {
    styleId: 'TableGrid',
    headerFill: PUBLISHER_WORD_THEME.COLORS.TABLE_HEADER_BACKGROUND,
    indentTwips: PUBLISHER_WORD_THEME.TABLE.INDENT,
    cellMarginsTwips: PUBLISHER_WORD_THEME.TABLE.CELL_MARGINS,
    bodySizeHalfPoints: PUBLISHER_WORD_THEME.TABLE.BODY_SIZE,
    paragraphAfterTwips: PUBLISHER_WORD_THEME.TABLE.PARAGRAPH_AFTER,
    lineTwips: PUBLISHER_WORD_THEME.TABLE.LINE,
  },
  image: {
    maxWidthCm: PUBLISHER_WORD_THEME.IMAGE.MAX_WIDTH_CM,
    chapterOpenerWidthCm: PUBLISHER_WORD_THEME.IMAGE.CHAPTER_OPENER_WIDTH_CM,
    allowedMarginIntrusionCm: PUBLISHER_WORD_THEME.IMAGE.ALLOWED_MARGIN_INTRUSION_CM,
  },
  headerFooter: {
    distanceCm: PUBLISHER_WORD_THEME.HEADER_FOOTER.DISTANCE_CM,
    showTitle: false,
    showBookAndPage: false,
  },
};

const createPublisherProfile = (id: PublisherProfileId): DocumentStyleProfile => ({
  id,
  ...publisherStyleTokens,
});

export const createPublisherDocumentProfile = (
  id: PublisherProfileId,
): DocumentStyleProfile => createPublisherProfile(id);
