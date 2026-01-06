/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Document, Packer, Paragraph, AlignmentType, Table, Header, Footer, PageNumber, TextRun } from "docx";
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
    const result = await docxRegistry.handle(block, config);
    if (result) {
      if (Array.isArray(result)) {
        docChildren.push(...result);
      } else {
        docChildren.push(result);
      }
    }
  }

  // 2. Prepare Headers & Footers
  const docMeta = config.meta || {};
  const headers: any = {};
  const footers: any = {};

  // Header: Show Title if 'header' is not false and title exists
  if (docMeta.header !== false && docMeta.title) {
    headers.default = new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: docMeta.title, font: FONT_CONFIG_NORMAL.ascii, size: 18, color: "808080" })
          ],
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: "single", size: 6, color: "E0E0E0", space: 6 } } // Slight underline
        })
      ]
    });
  }

  // Footer: Show Page Number if 'footer' is not false (Default true)
  if (docMeta.footer !== false) {
    footers.default = new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              children: [PageNumber.CURRENT],
              font: FONT_CONFIG_NORMAL.ascii,
              size: 20
            })
          ],
          alignment: AlignmentType.CENTER
        })
      ]
    });
  }

  const doc = new Document({
    creator: docMeta.author,
    title: docMeta.title,
    description: docMeta.subject,
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
      headers: headers,
      footers: footers,
      children: docChildren
    }],
    styles: {
      default: { document: { run: { font: FONT_CONFIG_NORMAL, size: FONT_SIZES.BODY } } },
    },
  });

  return await Packer.toBlob(doc);
};