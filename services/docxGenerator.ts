/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Document, Packer, Paragraph, AlignmentType, Table } from "docx";
import { ParsedBlock } from "./types";
import { FONT_CONFIG_NORMAL } from "./docx/builders/common";
import { SIZES, WORD_THEME } from "../constants/theme";

// Registry & Handlers
import { docxRegistry } from "./docx/registry";
import { registerDefaultHandlers } from "./docx/builders/index";
import { DocxConfig } from "./docx/types";

// Initialize default handlers
registerDefaultHandlers();

// Re-export DocxConfig for consumers
export type { DocxConfig };

const { FONT_SIZES, LAYOUT } = WORD_THEME;

// --- 主生成函式 ---
export const generateDocx = async (
    blocks: ParsedBlock[], 
    config: DocxConfig = { widthCm: 17, heightCm: 23 }
): Promise<Blob> => {
  const docChildren: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    const result = docxRegistry.handle(block, config);
    if (result) {
      if (Array.isArray(result)) {
        docChildren.push(...result);
      } else {
        docChildren.push(result);
      }
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