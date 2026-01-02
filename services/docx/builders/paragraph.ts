import { Paragraph, AlignmentType } from "docx";
import { SPACING } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

export const createParagraph = (content: string): Paragraph => {
  return new Paragraph({
    children: parseInlineStyles(content),
    spacing: SPACING.PARAGRAPH,
    alignment: AlignmentType.BOTH
  });
};
