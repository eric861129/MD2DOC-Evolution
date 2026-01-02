import { Paragraph, AlignmentType } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

export const createParagraph = (content: string): Paragraph => {
  return new Paragraph({
    children: parseInlineStyles(content),
    spacing: WORD_THEME.SPACING.PARAGRAPH,
    alignment: AlignmentType.BOTH
  });
};