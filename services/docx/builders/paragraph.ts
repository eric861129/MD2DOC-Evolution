import { Paragraph } from "docx";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";
import { DOCUMENT_STYLE_IDS } from "../styles";

export const createParagraph = async (content: string, config?: DocxConfig): Promise<Paragraph> => {
  return new Paragraph({
    style: DOCUMENT_STYLE_IDS.normal,
    children: await parseInlineStyles(content, config),
  });
};
