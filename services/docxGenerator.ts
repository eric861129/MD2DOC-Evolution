/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Document, Packer, Paragraph, AlignmentType, Table } from "docx";
import { ParsedBlock, BlockType } from "../types";
import { parseInlineStyles, FONT_CONFIG_NORMAL } from "./docx/builders/common";
import { SIZES, FONT_SIZES, SPACING, LAYOUT, COLORS } from "../constants/theme";

// Builders
import { createManualTOC } from "./docx/builders/toc";
import { DocxConfig } from "./docx/types";
import { createHeading } from "./docx/builders/heading";
import { createParagraph } from "./docx/builders/paragraph";
import { createCodeBlock } from "./docx/builders/codeBlock";
import { createChatBubble } from "./docx/builders/chat";
import { createCallout } from "./docx/builders/callout";
import { createTable } from "./docx/builders/table";

// Re-export DocxConfig for consumers
export type { DocxConfig };

// --- 主生成函式 ---
export const generateDocx = async (
    blocks: ParsedBlock[], 
    config: DocxConfig = { widthCm: 17, heightCm: 23 }
): Promise<Blob> => {
  const docChildren: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case BlockType.TOC: 
        docChildren.push(...createManualTOC(block.content, config)); 
        break;
      case BlockType.HEADING_1: docChildren.push(createHeading(block.content, 1)); break;
      case BlockType.HEADING_2: docChildren.push(createHeading(block.content, 2)); break;
      case BlockType.HEADING_3: docChildren.push(createHeading(block.content, 3)); break;
      case BlockType.PARAGRAPH: docChildren.push(createParagraph(block.content)); break;
      case BlockType.CODE_BLOCK: 
        docChildren.push(createCodeBlock(block.content)); 
        docChildren.push(new Paragraph({ text: "", spacing: { before: 0, after: 0 } })); // Force separation
        break;
      case BlockType.CHAT_USER:
      case BlockType.CHAT_AI: 
        docChildren.push(createChatBubble(block.content, block.type as BlockType.CHAT_USER | BlockType.CHAT_AI)); 
        docChildren.push(new Paragraph({ text: "", spacing: { before: 0, after: 0 } })); // Force separation
        break;
      case BlockType.CALLOUT_TIP:
      case BlockType.CALLOUT_NOTE:
      case BlockType.CALLOUT_WARNING: 
        docChildren.push(createCallout(block.content, block.type)); 
        docChildren.push(new Paragraph({ text: "", spacing: { before: 0, after: 0 } })); // Force separation
        break;
      case BlockType.BULLET_LIST:
        docChildren.push(new Paragraph({ children: parseInlineStyles(block.content), bullet: { level: 0 }, spacing: SPACING.LIST }));
        break;
      case BlockType.NUMBERED_LIST:
        docChildren.push(new Paragraph({ children: parseInlineStyles(block.content), numbering: { reference: "default-numbering", level: 0 }, spacing: SPACING.LIST }));
        break;
      case BlockType.TABLE:
        if (block.tableRows) {
          docChildren.push(createTable(block.tableRows));
          docChildren.push(new Paragraph({ text: "", spacing: { before: SPACING.TABLE_AFTER } }));
        }
        break;
      case BlockType.HORIZONTAL_RULE:
        docChildren.push(new Paragraph({ text: "", border: { bottom: { style: "single", size: LAYOUT.BORDER.HR, color: COLORS.BLACK, space: 1 } }, spacing: SPACING.HR }));
        break;
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: config.widthCm * SIZES.CM_TO_TWIPS, height: config.heightCm * SIZES.CM_TO_TWIPS },
          margin: { top: LAYOUT.MARGIN.NORMAL, right: LAYOUT.MARGIN.NORMAL, bottom: LAYOUT.MARGIN.NORMAL, left: LAYOUT.MARGIN.NORMAL },
        },
      },
      children: docChildren
    }],
    styles: {
      default: { document: { run: { font: FONT_CONFIG_NORMAL, size: FONT_SIZES.BODY } } },
    },
  });

  return await Packer.toBlob(doc);
};