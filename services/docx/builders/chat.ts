/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { AlignmentType, BorderStyle, Paragraph, TextRun } from "docx";
import { ParsedBlock } from "../../types";
import { LINE_HEIGHT, WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles, FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

export const createChatBubble = async (block: ParsedBlock, config?: DocxConfig): Promise<Paragraph> => {
  const { role, content, alignment = 'left' } = block;
  
  const isRight = alignment === 'right';
  const isCenter = alignment === 'center';

  const docxAlignment = isRight 
    ? AlignmentType.RIGHT 
    : isCenter 
      ? AlignmentType.CENTER 
      : AlignmentType.LEFT;

  if (!config || config.profile.id === 'technical-legacy') {
    const backgroundFill = isRight
      ? WORD_THEME.COLORS.WHITE
      : isCenter
        ? WORD_THEME.COLORS.BG_SHORTCUT
        : WORD_THEME.COLORS.BG_AI_CHAT;
    const legacyBorderStyle = isRight
      ? BorderStyle.DASHED
      : isCenter
        ? BorderStyle.DOUBLE
        : BorderStyle.DOTTED;

    return new Paragraph({
      children: [
        new TextRun({
          text: `${role}:`,
          bold: true,
          size: WORD_THEME.FONT_SIZES.LABEL,
          font: FONT_CONFIG_NORMAL,
        }),
        new TextRun({ text: '', break: 1 }),
        ...await parseInlineStyles(content, config),
      ],
      border: {
        top: {
          style: legacyBorderStyle,
          space: 10,
          color: WORD_THEME.COLORS.CHAT_BORDER,
        },
        bottom: {
          style: legacyBorderStyle,
          space: 10,
          color: WORD_THEME.COLORS.CHAT_BORDER,
        },
        left: {
          style: legacyBorderStyle,
          space: 10,
          color: WORD_THEME.COLORS.CHAT_BORDER,
        },
        right: {
          style: legacyBorderStyle,
          space: 10,
          color: WORD_THEME.COLORS.CHAT_BORDER,
        },
      },
      indent: isRight
        ? { left: WORD_THEME.LAYOUT.INDENT.CHAT }
        : isCenter
          ? { left: 720, right: 720 }
          : { right: WORD_THEME.LAYOUT.INDENT.CHAT },
      alignment: docxAlignment,
      spacing: {
        before: 400,
        after: 400,
        line: LINE_HEIGHT.ONE_POINT_TWO,
      },
      shading: { fill: backgroundFill },
    });
  }

  const bgFill = isRight
    ? 'FFFFFF'
    : isCenter 
      ? 'F8FAFC'
      : 'F2F2F2';

  const borderStyle = isRight
    ? BorderStyle.DASHED
    : isCenter
      ? BorderStyle.DOUBLE
      : BorderStyle.DOTTED;

  const children = [
      new TextRun({ 
        text: `${role}：`,
        bold: true, 
        size: 18,
        font: FONT_CONFIG_NORMAL 
      }),
      ...await parseInlineStyles(content, config)
  ];

  return new Paragraph({
    children,
    border: {
      top: { style: borderStyle, size: 8, space: 6, color: 'A6A6A6' },
      bottom: { style: borderStyle, size: 8, space: 6, color: 'A6A6A6' },
      left: { style: borderStyle, size: 8, space: 6, color: 'A6A6A6' },
      right: { style: borderStyle, size: 8, space: 6, color: 'A6A6A6' },
    },
    indent: isRight 
      ? { left: 1440 }
      : isCenter 
        ? { left: 720, right: 720 }
        : { right: 1440 },
    alignment: docxAlignment,
    spacing: { before: 400, after: 400, line: 300 },
    keepLines: true,
    ...(isRight ? { keepNext: true } : {}),
    shading: { fill: bgFill }
  });
};
