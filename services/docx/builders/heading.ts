import { Paragraph } from "docx";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";
import { DOCUMENT_STYLE_IDS } from "../styles";

export const createHeading = async (content: string, level: 1 | 2 | 3, config?: DocxConfig): Promise<Paragraph> => {
  const style = {
    1: DOCUMENT_STYLE_IDS.heading1,
    2: DOCUMENT_STYLE_IDS.heading2,
    3: DOCUMENT_STYLE_IDS.heading3,
  }[level];

  return new Paragraph({
    style,
    children: await parseInlineStyles(content, config),
  });
};
