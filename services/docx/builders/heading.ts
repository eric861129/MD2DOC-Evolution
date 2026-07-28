import { Bookmark, Paragraph } from 'docx';
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";
import { DOCUMENT_STYLE_IDS } from "../styles";

const MAX_BOOKMARK_LENGTH = 40;

const createHeadingBookmarkId = (
  content: string,
  level: 1 | 2 | 3,
  sequence: number,
): string => {
  const normalizedSlug = content
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const slug = normalizedSlug || `heading_${sequence}`;
  const prefix = `h${level}_`;
  const suffix = `_${sequence}`;
  const maximumSlugLength = MAX_BOOKMARK_LENGTH
    - prefix.length
    - suffix.length;
  const truncatedSlug = slug
    .slice(0, maximumSlugLength)
    .replace(/_+$/g, '')
    || `heading_${sequence}`;
  return `${prefix}${truncatedSlug}${suffix}`;
};

export const createHeading = async (
  content: string,
  level: 1 | 2 | 3,
  config: DocxConfig,
): Promise<Paragraph> => {
  const style = {
    1: DOCUMENT_STYLE_IDS.heading1,
    2: DOCUMENT_STYLE_IDS.heading2,
    3: DOCUMENT_STYLE_IDS.heading3,
  }[level];

  config.counters.bookmark += 1;
  const bookmarkId = createHeadingBookmarkId(
    content,
    level,
    config.counters.bookmark,
  );

  return new Paragraph({
    style,
    children: [
      new Bookmark({
        id: bookmarkId,
        children: await parseInlineStyles(content, config),
      }),
    ],
  });
};
