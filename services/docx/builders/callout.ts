import { Paragraph, TextRun, type ParagraphChild } from 'docx';
import { BlockType } from '../../types';
import type { CalloutKind, CalloutStyleToken } from '../profiles';
import { DOCUMENT_STYLE_IDS } from '../styles';
import type { DocxConfig } from '../types';
import { parseInlineStyles } from './common';

const CALLOUT_KIND_BY_BLOCK_TYPE: Partial<Record<BlockType, CalloutKind>> = {
  [BlockType.CALLOUT_TIP]: 'tip',
  [BlockType.CALLOUT_NOTE]: 'note',
  [BlockType.CALLOUT_WARNING]: 'warning',
  [BlockType.CALLOUT_IMPORTANT]: 'important',
  [BlockType.CALLOUT_CAUTION]: 'caution',
};

const createCalloutParagraph = (
  children: ParagraphChild[],
  token: CalloutStyleToken,
  config: DocxConfig,
): Paragraph => {
  const style = config.profile.paragraph.callout;

  return new Paragraph({
    style: DOCUMENT_STYLE_IDS.callout,
    children,
    shading: { fill: token.fill },
    indent: {
      left: style.leftIndentTwips ?? 230,
      right: style.rightIndentTwips ?? 230,
    },
  });
};

/**
 * 以命名樣式、語意底色與連續段落建立 Callout，保留每段的行內格式。
 */
export const createCallout = async (
  content: string,
  type: BlockType,
  config: DocxConfig,
): Promise<Paragraph[]> => {
  const kind = CALLOUT_KIND_BY_BLOCK_TYPE[type] ?? 'note';
  const token = config.profile.callouts[kind];
  const paragraphs = [
    createCalloutParagraph([
      new TextRun({
        text: `[ ${token.label} ]`,
        bold: true,
        font: config.profile.fonts.body,
      }),
    ], token, config),
  ];

  const contentParagraphs = content
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.length > 0);

  for (const paragraph of contentParagraphs) {
    paragraphs.push(createCalloutParagraph(
      await parseInlineStyles(paragraph, config),
      token,
      config,
    ));
  }

  return paragraphs;
};
