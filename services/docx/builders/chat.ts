/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Paragraph, TextRun, AlignmentType } from "docx";
import { ParsedBlock } from "../../types";
import { WORD_THEME, LINE_HEIGHT } from "../../../constants/theme";
import { parseInlineStyles, FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

const { COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

export const createChatBubble = async (block: ParsedBlock, config?: DocxConfig): Promise<Paragraph> => {
  const { role, content, alignment = 'left' } = block;
  
  const isRight = alignment === 'right';
  const isCenter = alignment === 'center';

  const docxAlignment = isRight 
    ? AlignmentType.RIGHT 
    : isCenter 
      ? AlignmentType.CENTER 
      : AlignmentType.LEFT;

  const bgFill = isRight 
    ? COLORS.WHITE 
    : isCenter 
      ? COLORS.BG_SHORTCUT 
      : COLORS.BG_AI_CHAT;

  const borderStyle = isRight ? "dashed" : isCenter ? "double" : "dotted";

  const children = [
      new TextRun({ 
        text: `${role}:`, 
        bold: true, 
        size: FONT_SIZES.LABEL, 
        font: FONT_CONFIG_NORMAL 
      }),
      new TextRun({ text: "", break: 1 }),
      ...await parseInlineStyles(content, config)
  ];

  return new Paragraph({
    children,
    border: {
      top: { style: borderStyle, space: 10, color: COLORS.CHAT_BORDER },
      bottom: { style: borderStyle, space: 10, color: COLORS.CHAT_BORDER },
      left: { style: borderStyle, space: 10, color: COLORS.CHAT_BORDER },
      right: { style: borderStyle, space: 10, color: COLORS.CHAT_BORDER },
    },
    indent: isRight 
      ? { left: LAYOUT.INDENT.CHAT } 
      : isCenter 
        ? { left: 720, right: 720 } // Slight indent for center
        : { right: LAYOUT.INDENT.CHAT }, 
    alignment: docxAlignment,
    spacing: { before: 400, after: 400, line: LINE_HEIGHT.ONE_POINT_TWO },
    shading: { fill: bgFill }
  });
};
