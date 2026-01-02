import { Paragraph, HeadingLevel } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

const { SPACING, COLORS, LAYOUT } = WORD_THEME;

export const createHeading = (content: string, level: 1 | 2 | 3): Paragraph => {
  const configs = {
    1: { heading: HeadingLevel.HEADING_1, spacing: SPACING.H1, borderBottom: true },
    2: { heading: HeadingLevel.HEADING_2, spacing: SPACING.H2, borderBottom: false },
    3: { heading: HeadingLevel.HEADING_3, spacing: SPACING.H3, borderBottom: false },
  }[level];

  return new Paragraph({
    children: parseInlineStyles(content),
    heading: configs.heading,
    spacing: configs.spacing,
    border: configs.borderBottom ? { 
      bottom: { style: "single", space: 8, color: COLORS.BLACK, size: LAYOUT.BORDER.H1_BOTTOM } 
    } : undefined
  });
};