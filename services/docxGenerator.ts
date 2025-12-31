/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from "docx";
import { ParsedBlock, BlockType } from "../types.ts";
import { parseInlineElements, InlineStyleType } from "../utils/styleParser.ts";
import { FONTS, COLORS, SIZES } from "../constants/theme.ts";

// --- 字型配置 ---
const FONT_CONFIG_NORMAL = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN
};

// --- 版面設定介面 ---
export interface DocxConfig {
  widthCm: number;
  heightCm: number;
}

// --- Helper: 行內樣式解析 ---
const parseInlineStyles = (text: string): TextRun[] => {
  const segments = parseInlineElements(text);
  return segments.map(segment => {
    const baseConfig = { text: segment.content, font: FONT_CONFIG_NORMAL };
    
    switch (segment.type) {
      case InlineStyleType.BOLD:
        return new TextRun({ ...baseConfig, bold: true });
      case InlineStyleType.ITALIC:
        return new TextRun({ ...baseConfig, italics: true, color: COLORS.PRIMARY_BLUE });
      case InlineStyleType.UNDERLINE:
        return new TextRun({
          ...baseConfig,
          color: COLORS.LINK_BLUE,
          underline: { type: UnderlineType.SINGLE, color: COLORS.LINK_BLUE }
        });
      case InlineStyleType.CODE:
        return new TextRun({
          ...baseConfig,
          shading: { fill: COLORS.BG_CODE, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.UI_BUTTON:
        return new TextRun({
          ...baseConfig,
          bold: true,
          shading: { fill: COLORS.BG_BUTTON, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.SHORTCUT:
        return new TextRun({
          ...baseConfig,
          size: 20,
          shading: { fill: COLORS.BG_SHORTCUT, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.BOOK:
        return new TextRun({ ...baseConfig, bold: true });
      default:
        return new TextRun(baseConfig);
    }
  });
};

// --- Block Builders: 將不同類型的區塊生成邏輯拆分 ---

const createHeading = (content: string, level: 1 | 2 | 3): Paragraph => {
  const configs = {
    1: { heading: "Heading1", before: 480, after: 240, borderBottom: true },
    2: { heading: "Heading2", before: 400, after: 200, borderBottom: false },
    3: { heading: "Heading3", before: 300, after: 150, borderBottom: false },
  }[level];

  return new Paragraph({
    children: parseInlineStyles(content),
    heading: configs.heading as any,
    spacing: { before: configs.before, after: configs.after },
    border: configs.borderBottom ? { 
      bottom: { style: "single", space: 8, color: COLORS.BLACK, size: 18 }
    } : undefined
  });
};

const createParagraph = (content: string): Paragraph => {
  return new Paragraph({
    children: parseInlineStyles(content),
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.BOTH
  });
};

const createCodeBlock = (content: string): Paragraph => {
  const codeLines = content.split('\n');
  return new Paragraph({
    children: codeLines.map((line, index) => new TextRun({
       text: line,
       font: FONT_CONFIG_NORMAL,
       size: 18,
       break: index > 0 ? 1 : undefined
    })),
    border: {
      top: { style: "single", space: 10, size: 6, color: COLORS.CODE_BORDER },
      bottom: { style: "single", space: 10, size: 6, color: COLORS.CODE_BORDER },
      left: { style: "single", space: 10, size: 6, color: COLORS.CODE_BORDER },
      right: { style: "single", space: 10, size: 6, color: COLORS.CODE_BORDER },
    },
    shading: { fill: COLORS.BG_CODE },
    spacing: { before: 400, after: 400, line: 240 },
    indent: { left: 400, right: 400 }
  });
};

const createChatBubble = (content: string, type: BlockType.CHAT_USER | BlockType.CHAT_AI): Paragraph => {
  const isUser = type === BlockType.CHAT_USER;
  return new Paragraph({
    children: [
        new TextRun({ text: isUser ? "User:" : "AI:", bold: true, size: 18, font: FONT_CONFIG_NORMAL }),
        new TextRun({ text: "", break: 1 }),
        ...parseInlineStyles(content)
    ],
    border: {
      top: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      bottom: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      left: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      right: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
    },
    indent: isUser ? { left: 1440 } : { right: 1440 }, 
    alignment: isUser ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: { before: 300, after: 300 },
    shading: { fill: isUser ? COLORS.WHITE : COLORS.BG_AI_CHAT }
  });
};

const createCallout = (content: string, type: BlockType): Paragraph => {
  const config = {
    [BlockType.CALLOUT_TIP]: { label: "TIP", color: COLORS.CALLOUT.TIP.BORDER, style: BorderStyle.SINGLE, size: 36, bg: COLORS.CALLOUT.TIP.BG },
    [BlockType.CALLOUT_WARNING]: { label: "WARNING", color: COLORS.CALLOUT.WARNING.BORDER, style: BorderStyle.SINGLE, size: 48, bg: COLORS.CALLOUT.WARNING.BG },
    [BlockType.CALLOUT_NOTE]: { label: "NOTE", color: COLORS.CALLOUT.NOTE.BORDER, style: BorderStyle.DASHED, size: 24, bg: COLORS.CALLOUT.NOTE.BG },
  }[type] || { label: "NOTE", color: COLORS.CALLOUT.NOTE.BORDER, style: BorderStyle.DASHED, size: 24, bg: COLORS.CALLOUT.NOTE.BG };

  const children: TextRun[] = [
    new TextRun({ text: `[ ${config.label} ]`, bold: true, size: 18, font: FONT_CONFIG_NORMAL })
  ];

  content.split('\n').forEach(line => {
    children.push(new TextRun({ text: "", break: 1 }));
    children.push(...parseInlineStyles(line));
  });

  return new Paragraph({
    children,
    shading: { fill: config.bg },
    border: {
      top: { style: config.style, space: 5, size: config.size, color: config.color },
      bottom: { style: config.style, space: 5, size: config.size, color: config.color },
      left: { style: config.style, space: 15, size: config.size, color: config.color },
      right: { style: config.style, space: 15, size: config.size, color: config.color }
    },
    spacing: { before: 400, after: 400, line: 360 },
    indent: { left: 400, right: 400 }
  });
};

const createTable = (rows: string[][]): Table => {
  return new Table({
    rows: rows.map((row) => 
      new TableRow({
        children: row.map((cellText) => 
          new TableCell({
            children: [new Paragraph({ children: parseInlineStyles(cellText) })],
            width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            },
            shading: { fill: COLORS.WHITE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        )
      })
    ),
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// --- 主生成函式 ---
export const generateDocx = async (
    blocks: ParsedBlock[], 
    config: DocxConfig = { widthCm: 17, heightCm: 23 }
): Promise<Blob> => {
  const docChildren: any[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case BlockType.HEADING_1: docChildren.push(createHeading(block.content, 1)); break;
      case BlockType.HEADING_2: docChildren.push(createHeading(block.content, 2)); break;
      case BlockType.HEADING_3: docChildren.push(createHeading(block.content, 3)); break;
      case BlockType.PARAGRAPH: docChildren.push(createParagraph(block.content)); break;
      case BlockType.CODE_BLOCK: docChildren.push(createCodeBlock(block.content)); break;
      case BlockType.CHAT_USER:
      case BlockType.CHAT_AI: docChildren.push(createChatBubble(block.content, block.type as any)); break;
      case BlockType.CALLOUT_TIP:
      case BlockType.CALLOUT_NOTE:
      case BlockType.CALLOUT_WARNING: docChildren.push(createCallout(block.content, block.type)); break;
      case BlockType.BULLET_LIST:
        docChildren.push(new Paragraph({ children: parseInlineStyles(block.content), bullet: { level: 0 }, spacing: { before: 120, after: 120 } }));
        break;
      case BlockType.NUMBERED_LIST:
        docChildren.push(new Paragraph({ children: parseInlineStyles(block.content), numbering: { reference: "default-numbering", level: 0 }, spacing: { before: 120, after: 120 } }));
        break;
      case BlockType.TABLE:
        if (block.tableRows) {
          docChildren.push(createTable(block.tableRows));
          docChildren.push(new Paragraph({ text: "", spacing: { before: 240 } }));
        }
        break;
      case BlockType.HORIZONTAL_RULE:
        docChildren.push(new Paragraph({ text: "", border: { bottom: { style: "single", size: 12, color: COLORS.BLACK, space: 1 } }, spacing: { before: 240, after: 240 } }));
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
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: docChildren
    }],
    styles: {
      default: { document: { run: { font: FONT_CONFIG_NORMAL, size: 22 } } },
    },
  });

  return await Packer.toBlob(doc);
};
