import { Paragraph } from 'docx';
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
  const style = {
    1: DOCUMENT_STYLE_IDS.heading1,
    2: DOCUMENT_STYLE_IDS.heading2,
    3: DOCUMENT_STYLE_IDS.heading3,
  }[level];

  const bookmark = config.bookmarks.allocate({
    kind: 'heading',
    content,
    headingLevel: level,
  });

  return new Paragraph({
    style,
    pageBreakBefore,
    children: wrapBookmark(
      bookmark,
      await parseInlineStyles(content, config),
    ),
  });
};
