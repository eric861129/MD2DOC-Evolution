import { Paragraph } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";

const { SPACING, LAYOUT } = WORD_THEME;

export const createParagraph = async (content: string, config?: DocxConfig): Promise<Paragraph> => {
  return new Paragraph({
    children: await parseInlineStyles(content, config),
    spacing: SPACING.PARAGRAPH
  });
};