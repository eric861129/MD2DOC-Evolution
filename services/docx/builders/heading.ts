import { Paragraph } from "docx";
import { SPACING, COLORS, LAYOUT } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

export const createHeading = (content: string, level: 1 | 2 | 3): Paragraph => {
  const configs = {
    1: { heading: "Heading1", spacing: SPACING.H1, borderBottom: true },
    2: { heading: "Heading2", spacing: SPACING.H2, borderBottom: false },
    3: { heading: "Heading3", spacing: SPACING.H3, borderBottom: false },
  }[level];

  return new Paragraph({
    children: parseInlineStyles(content),
    heading: configs.heading as any,
    spacing: configs.spacing,
    border: configs.borderBottom ? { 
      bottom: { style: "single", space: 8, color: COLORS.BLACK, size: LAYOUT.BORDER.H1_BOTTOM } 
    } : undefined
  });
};
