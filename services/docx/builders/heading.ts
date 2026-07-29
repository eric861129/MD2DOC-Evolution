import { HeadingLevel, Paragraph } from 'docx';
import { WORD_THEME } from '../../../constants/theme';
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";
import { DOCUMENT_STYLE_IDS } from "../styles";
import { wrapBookmark } from '../bookmarks';

export const createHeading = async (
  content: string,
  level: 1 | 2 | 3,
  config: DocxConfig,
  pageBreakBefore = false,
): Promise<Paragraph> => {
  const children = wrapBookmark(
    config.bookmarks.allocate({
      kind: 'heading',
      content,
      headingLevel: level,
    }),
    await parseInlineStyles(content, config),
  );
  if (config.profile.id === 'technical-legacy') {
    const legacy = {
      1: {
        heading: HeadingLevel.HEADING_1,
        spacing: WORD_THEME.SPACING.H1,
        borderBottom: true,
      },
      2: {
        heading: HeadingLevel.HEADING_2,
        spacing: WORD_THEME.SPACING.H2,
        borderBottom: false,
      },
      3: {
        heading: HeadingLevel.HEADING_3,
        spacing: WORD_THEME.SPACING.H3,
        borderBottom: false,
      },
    }[level];

    return new Paragraph({
      children,
      heading: legacy.heading,
      spacing: legacy.spacing,
      border: legacy.borderBottom
        ? {
            bottom: {
              style: 'single',
              space: 8,
              color: WORD_THEME.COLORS.BLACK,
              size: WORD_THEME.LAYOUT.BORDER.H1_BOTTOM,
            },
          }
        : undefined,
      pageBreakBefore,
    });
  }

  const style = {
    1: DOCUMENT_STYLE_IDS.heading1,
    2: DOCUMENT_STYLE_IDS.heading2,
    3: DOCUMENT_STYLE_IDS.heading3,
  }[level];

  return new Paragraph({
    style,
    pageBreakBefore,
    children,
  });
};
