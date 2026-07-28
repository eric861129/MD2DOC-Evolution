/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { AlignmentType, BorderStyle, Paragraph, TextRun } from "docx";
import { ParsedBlock } from "../../types";
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
