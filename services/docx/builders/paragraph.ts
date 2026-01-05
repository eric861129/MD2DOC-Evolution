import { Paragraph } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";

const { SPACING, LAYOUT } = WORD_THEME;

export const createParagraph = (content: string, config?: DocxConfig): Paragraph => {
  return new Paragraph({
    children: parseInlineStyles(content, config),
    spacing: SPACING.PARAGRAPH
  });
};