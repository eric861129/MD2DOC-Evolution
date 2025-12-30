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

// 基礎字型設定
const FONT_CONFIG_NORMAL = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN
};

// 快捷鍵字型設定 (統一使用標準字體)
const FONT_CONFIG_SHORTCUT = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN
};

// 斜體字型設定 (統一使用標準字體，不使用標楷體)
const FONT_CONFIG_ITALIC = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK, 
  cs: FONTS.LATIN
};

// 版面設定介面
export interface DocxConfig {
  widthCm: number;
  heightCm: number;
}

const parseInlineStyles = (text: string): TextRun[] => {
  const segments = parseInlineElements(text);
  return segments.map(segment => {
    switch (segment.type) {
      case InlineStyleType.BOLD:
        return new TextRun({ 
          text: segment.content, 
          bold: true,
          font: FONT_CONFIG_NORMAL
        });
      case InlineStyleType.ITALIC:
        return new TextRun({ 
          text: segment.content, 
          italics: true,
          color: COLORS.PRIMARY_BLUE, // 深藍色
          font: FONT_CONFIG_ITALIC
        });
      case InlineStyleType.UNDERLINE:
        return new TextRun({ 
          text: segment.content, 
          color: COLORS.LINK_BLUE, // 亮藍色連結感
          underline: {
              type: UnderlineType.SINGLE,
              color: COLORS.LINK_BLUE
          },
          font: FONT_CONFIG_NORMAL
        });
      case InlineStyleType.CODE:
        return new TextRun({ 
          text: segment.content, 
          font: FONT_CONFIG_NORMAL,
          shading: { fill: COLORS.BG_CODE, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.UI_BUTTON:
        return new TextRun({ 
          text: segment.content, 
          bold: true,
          font: FONT_CONFIG_NORMAL,
          shading: { fill: COLORS.BG_BUTTON, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.SHORTCUT:
        return new TextRun({ 
          text: segment.content, 
          font: FONT_CONFIG_SHORTCUT,
          size: 20, // 稍微縮小一點
          shading: { fill: COLORS.BG_SHORTCUT, type: ShadingType.CLEAR, color: "auto" }
        });
      case InlineStyleType.BOOK:
        return new TextRun({ 
          text: segment.content, 
          bold: true,
          font: FONT_CONFIG_NORMAL
        });
      case InlineStyleType.TEXT:
      default:
        return new TextRun({ 
          text: segment.content,
          font: FONT_CONFIG_NORMAL
        });
    }
  });
};

export const generateDocx = async (
    blocks: ParsedBlock[], 
    config: DocxConfig = { widthCm: 17, heightCm: 23 } // 預設為技術書籍大小
): Promise<Blob> => {
  const docChildren: any[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case BlockType.HEADING_1:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          heading: "Heading1",
          spacing: { before: 480, after: 240 },
          border: { bottom: { style: "single", space: 8, color: COLORS.BLACK, size: 18 } }
        }));
        break;
      case BlockType.HEADING_2:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          heading: "Heading2",
          spacing: { before: 400, after: 200 }
        }));
        break;
      case BlockType.HEADING_3:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          heading: "Heading3",
          spacing: { before: 300, after: 150 }
        }));
        break;
      case BlockType.PARAGRAPH:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          spacing: { before: 200, after: 200 },
          alignment: AlignmentType.BOTH
        }));
        break;
      case BlockType.CODE_BLOCK:
        const codeLines = block.content.split('\n');
        docChildren.push(new Paragraph({
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
        }));
        break;
      case BlockType.CHAT_USER:
      case BlockType.CHAT_AI:
        const isUser = block.type === BlockType.CHAT_USER;
        docChildren.push(new Paragraph({
          children: [
              new TextRun({ text: isUser ? "User:" : "AI:", bold: true, size: 18, font: FONT_CONFIG_NORMAL }),
              new TextRun({ text: "", break: 1 }),
              ...parseInlineStyles(block.content)
          ],
          border: {
            top: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
            bottom: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
            left: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
            right: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
          },
          // User: 靠右視覺 (左縮排大), AI: 靠左視覺 (右縮排大)
          indent: isUser ? { left: 1440 } : { right: 1440 }, 
          // User: 內容靠右對齊 (依需求), AI: 內容靠左
          alignment: isUser ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: { before: 300, after: 300 },
          // AI: 淺灰底, User: 無底色(White/Clear)
          shading: { fill: isUser ? COLORS.WHITE : COLORS.BG_AI_CHAT }
        }));
        break;
      case BlockType.CALLOUT_TIP:
      case BlockType.CALLOUT_NOTE:
      case BlockType.CALLOUT_WARNING:
        let label = "NOTE";
        let borderColor = COLORS.CALLOUT.NOTE.BORDER;
        let borderStyle: any = "single";
        let borderSize = 24;
        let shadingFill = COLORS.CALLOUT.NOTE.BG;

        if (block.type === BlockType.CALLOUT_TIP) {
          label = "TIP";
          borderColor = COLORS.CALLOUT.TIP.BORDER;
          borderStyle = "single";
          borderSize = 36;
          shadingFill = COLORS.CALLOUT.TIP.BG;
        } else if (block.type === BlockType.CALLOUT_WARNING) {
          label = "WARNING";
          borderColor = COLORS.CALLOUT.WARNING.BORDER;
          borderStyle = "single"; // 實線
          borderSize = 48; // 粗線
          shadingFill = COLORS.CALLOUT.WARNING.BG;
        } else {
          // NOTE
          label = "NOTE";
          borderColor = COLORS.CALLOUT.NOTE.BORDER;
          borderStyle = "dashed"; // 虛線
          borderSize = 24;
          shadingFill = COLORS.CALLOUT.NOTE.BG;
        }

        // 構建 Callout 內容，使用 parseInlineStyles 以支援粗體/斜體等樣式
        const calloutChildren: TextRun[] = [];
        
        // 1. 標籤 (修正為乾淨的 [ TIP ] 樣式)
        calloutChildren.push(new TextRun({ 
            text: `[ ${label} ]`, 
            bold: true, 
            size: 18, 
            font: FONT_CONFIG_NORMAL 
        }));

        // 2. 內容 (逐行解析樣式)
        const lines = block.content.split('\n');
        lines.forEach((line) => {
            // 每一行前面都加一個換行符，與標題或上一行隔開
            calloutChildren.push(new TextRun({ text: "", break: 1 }));
            
            const styledRuns = parseInlineStyles(line);
            calloutChildren.push(...styledRuns);
        });

        docChildren.push(new Paragraph({
          children: calloutChildren,
          shading: { fill: shadingFill },
          border: { 
            top: { style: borderStyle, space: 5, size: borderSize, color: borderColor },
            bottom: { style: borderStyle, space: 5, size: borderSize, color: borderColor },
            left: { style: borderStyle, space: 15, size: borderSize, color: borderColor },
            right: { style: borderStyle, space: 15, size: borderSize, color: borderColor }
          },
          spacing: { before: 400, after: 400, line: 360 },
          indent: { left: 400, right: 400 }
        }));
        break;
      case BlockType.BULLET_LIST:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          bullet: { level: 0 },
          spacing: { before: 120, after: 120 }
        }));
        break;
      case BlockType.NUMBERED_LIST:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          numbering: { reference: "default-numbering", level: 0 },
          spacing: { before: 120, after: 120 }
        }));
        break;
      case BlockType.TABLE:
        if (block.tableRows) {
          docChildren.push(new Table({
            rows: block.tableRows.map((row) => 
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
          }));
          // Add some spacing after table
          docChildren.push(new Paragraph({ text: "", spacing: { before: 240 } }));
        }
        break;
      case BlockType.HORIZONTAL_RULE:
        docChildren.push(new Paragraph({
          text: "",
          border: {
            bottom: { style: "single", size: 12, color: COLORS.BLACK, space: 1 }
          },
          spacing: { before: 240, after: 240 }
        }));
        break;
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: config.widthCm * SIZES.CM_TO_TWIPS,
            height: config.heightCm * SIZES.CM_TO_TWIPS,
          },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 邊距維持約 2.54cm，可視需求調整
        },
      },
      children: docChildren
    }],
    styles: {
      default: {
        document: {
          run: { font: FONT_CONFIG_NORMAL, size: 22 },
        },
      },
    },
  });

  return await Packer.toBlob(doc);
};