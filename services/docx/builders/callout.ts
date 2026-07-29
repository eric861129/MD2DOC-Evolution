import {
  BorderStyle,
  Paragraph,
  TextRun,
  type ParagraphChild,
} from 'docx';
import { WORD_THEME } from '../../../constants/theme';
import { BlockType } from '../../types';
import type { CalloutKind, CalloutStyleToken } from '../profiles';
import { DOCUMENT_STYLE_IDS } from '../styles';
import type { DocxConfig } from '../types';
import { FONT_CONFIG_NORMAL, parseInlineStyles } from './common';

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
  if (config.profile.id === 'technical-legacy') {
    const legacy = {
      [BlockType.CALLOUT_TIP]: {
        label: 'TIP',
        color: WORD_THEME.COLORS.CALLOUT.TIP.BORDER,
        style: BorderStyle.SINGLE,
        size: WORD_THEME.LAYOUT.BORDER.CALLOUT_TIP,
        fill: WORD_THEME.COLORS.CALLOUT.TIP.BG,
      },
      [BlockType.CALLOUT_WARNING]: {
        label: 'WARNING',
        color: WORD_THEME.COLORS.CALLOUT.WARNING.BORDER,
        style: BorderStyle.SINGLE,
        size: WORD_THEME.LAYOUT.BORDER.CALLOUT_WARNING,
        fill: WORD_THEME.COLORS.CALLOUT.WARNING.BG,
      },
      [BlockType.CALLOUT_NOTE]: {
        label: 'NOTE',
        color: WORD_THEME.COLORS.CALLOUT.NOTE.BORDER,
        style: BorderStyle.DASHED,
        size: WORD_THEME.LAYOUT.BORDER.CALLOUT_NOTE,
        fill: WORD_THEME.COLORS.CALLOUT.NOTE.BG,
      },
    }[type] ?? {
      label: 'NOTE',
      color: WORD_THEME.COLORS.CALLOUT.NOTE.BORDER,
      style: BorderStyle.DASHED,
      size: WORD_THEME.LAYOUT.BORDER.CALLOUT_NOTE,
      fill: WORD_THEME.COLORS.CALLOUT.NOTE.BG,
    };
    const children: ParagraphChild[] = [
      new TextRun({
        text: `[ ${legacy.label} ]`,
        bold: true,
        size: WORD_THEME.FONT_SIZES.LABEL,
        font: FONT_CONFIG_NORMAL,
      }),
    ];
    for (const line of content.split('\n')) {
      children.push(new TextRun({ text: '', break: 1 }));
      children.push(...await parseInlineStyles(line, config));
    }

    return [
      new Paragraph({
        children,
        shading: { fill: legacy.fill },
        border: {
          top: {
            style: legacy.style,
            space: 5,
            size: legacy.size,
            color: legacy.color,
          },
          bottom: {
            style: legacy.style,
            space: 5,
            size: legacy.size,
            color: legacy.color,
          },
          left: {
            style: legacy.style,
            space: 15,
            size: legacy.size,
            color: legacy.color,
          },
          right: {
            style: legacy.style,
            space: 15,
            size: legacy.size,
            color: legacy.color,
          },
        },
        spacing: WORD_THEME.SPACING.CALLOUT,
        indent: {
          left: WORD_THEME.LAYOUT.INDENT.CALLOUT,
          right: WORD_THEME.LAYOUT.INDENT.CALLOUT,
        },
      }),
    ];
  }

  const kind = CALLOUT_KIND_BY_BLOCK_TYPE[type] ?? 'note';
  const token = config.profile.callouts[kind];
  const paragraphs = [
    createCalloutParagraph([
      new TextRun({
        text: `${token.label} `,
        bold: true,
        font: config.profile.fonts.body,
      }),
    ], token, config),
  ];

  const sourceLines = content === ''
    ? []
    : content.split(/\r?\n/);

  for (const line of sourceLines) {
    paragraphs.push(createCalloutParagraph(
      await parseInlineStyles(line, config),
      token,
      config,
    ));
  }

  return paragraphs;
};
