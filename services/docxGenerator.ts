/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Document, Packer, Paragraph, AlignmentType, Table } from "docx";
import { ParsedBlock } from "./types";
import { FONT_CONFIG_NORMAL } from "./docx/builders/common";
import { SIZES, WORD_THEME } from "../constants/theme";
import { parseInlineElements, InlineStyleType } from "../utils/styleParser";
import { generateQRCode } from "./qrCodeService";

// Registry & Handlers
import { docxRegistry } from "./docx/registry";
import { registerDefaultHandlers } from "./docx/builders/index";
import { DocxConfig } from "./docx/types";

// Initialize default handlers
registerDefaultHandlers();

// Re-export DocxConfig for consumers
export type { DocxConfig };

const { FONT_SIZES, LAYOUT } = WORD_THEME;

// Helper to extract URLs from all blocks
const extractUrls = (blocks: ParsedBlock[]): string[] => {
  const urls = new Set<string>();
  for (const block of blocks) {
    if (!block.content) continue;
    
    // Parse inline elements to find links
    const segments = parseInlineElements(block.content);
    for (const seg of segments) {
      if (seg.type === InlineStyleType.LINK && seg.url) {
        urls.add(seg.url);
      }
    }

    // Also check table rows if present
    if (block.tableRows) {
      for (const row of block.tableRows) {
        for (const cell of row) {
          const cellSegments = parseInlineElements(cell);
          for (const seg of cellSegments) {
            if (seg.type === InlineStyleType.LINK && seg.url) {
              urls.add(seg.url);
            }
          }
        }
      }
    }
  }
  return Array.from(urls);
};

// --- 主生成函式 ---
export const generateDocx = async (
    blocks: ParsedBlock[], 
    config: DocxConfig = { widthCm: 17, heightCm: 23 }
): Promise<Blob> => {
  
  // 1. Pre-generate QR Codes for all links
  const urls = extractUrls(blocks);
  const qrCodeMap = new Map<string, ArrayBuffer>();
  
  if (urls.length > 0) {
    await Promise.all(urls.map(async (url) => {
      try {
        const buffer = await generateQRCode(url);
        if (buffer.byteLength > 0) {
          qrCodeMap.set(url, buffer);
        }
      } catch (e) {
        console.warn(`Failed to generate QR for ${url}`, e);
      }
    }));
  }
  
  // Inject QR Map into config
  config.qrCodeMap = qrCodeMap;

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