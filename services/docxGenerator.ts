import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun
} from "docx";
import { ParsedBlock, BlockType } from "../types.ts";

const MAIN_FONT_CJK = "Microsoft JhengHei";
const MAIN_FONT_LATIN = "Consolas";

const FONT_CONFIG = {
  ascii: MAIN_FONT_LATIN,
  hAnsi: MAIN_FONT_LATIN,
  eastAsia: MAIN_FONT_CJK,
  cs: MAIN_FONT_LATIN
};

const parseInlineStyles = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  const regex = /(\*\*.*?\*\*)|(`[^`]+`)|(【.*?】)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ 
        text: text.substring(lastIndex, match.index),
        font: FONT_CONFIG
      }));
    }

    const fullMatch = match[0];
    if (fullMatch.startsWith('**')) {
      runs.push(new TextRun({ 
        text: fullMatch.slice(2, -2), 
        bold: true,
        font: FONT_CONFIG
      }));
    } else if (fullMatch.startsWith('`')) {
      runs.push(new TextRun({ 
        text: fullMatch.slice(1, -1), 
        font: FONT_CONFIG,
        shading: { fill: "F2F2F2" }
      }));
    } else if (fullMatch.startsWith('【')) {
      runs.push(new TextRun({ 
        text: fullMatch, 
        bold: true,
        font: FONT_CONFIG
      }));
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ 
      text: text.substring(lastIndex),
      font: FONT_CONFIG
    }));
  }
  return runs;
};

export const generateDocx = async (blocks: ParsedBlock[]): Promise<Blob> => {
  const docChildren: any[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case BlockType.HEADING_1:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          heading: "Heading1",
          spacing: { before: 480, after: 240 },
          border: { bottom: { style: "single", space: 8, color: "000000", size: 18 } }
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
          alignment: "both"
        }));
        break;
      case BlockType.CODE_BLOCK:
        const codeLines = block.content.split('\n');
        docChildren.push(new Paragraph({
          children: codeLines.map((line, index) => new TextRun({
             text: line,
             font: FONT_CONFIG,
             size: 18,
             break: index > 0 ? 1 : undefined
          })),
          border: {
            top: { style: "single", space: 10, size: 6, color: "BFBFBF" },
            bottom: { style: "single", space: 10, size: 6, color: "BFBFBF" },
            left: { style: "single", space: 10, size: 6, color: "BFBFBF" },
            right: { style: "single", space: 10, size: 6, color: "BFBFBF" },
          },
          shading: { fill: "F8F9FA" },
          spacing: { before: 400, after: 400, line: 240 },
          indent: { left: 400, right: 400 }
        }));
        break;
      case BlockType.CHAT_USER:
      case BlockType.CHAT_AI:
        const isUser = block.type === BlockType.CHAT_USER;
        docChildren.push(new Paragraph({
          children: [
              new TextRun({ text: isUser ? "User:" : "AI:", bold: true, size: 18, font: FONT_CONFIG }),
              new TextRun({ text: "", break: 1 }),
              ...parseInlineStyles(block.content)
          ],
          border: {
            top: { style: isUser ? "dashed" : "dotted", space: 10, color: "404040" },
            bottom: { style: isUser ? "dashed" : "dotted", space: 10, color: "404040" },
            left: { style: isUser ? "dashed" : "dotted", space: 10, color: "404040" },
            right: { style: isUser ? "dashed" : "dotted", space: 10, color: "404040" },
          },
          indent: isUser ? { left: 1200 } : { right: 1200 },
          spacing: { before: 300, after: 300 },
          shading: { fill: isUser ? "FFFFFF" : "F2F2F2" }
        }));
        break;
      case BlockType.CALLOUT_TIP:
      case BlockType.CALLOUT_NOTE:
      case BlockType.CALLOUT_WARNING:
        let label = "NOTE";
        let borderColor = "94A3B8";
        let borderStyle: any = "single";
        let borderSize = 24;
        let shadingFill = "F8FAFC";

        if (block.type === BlockType.CALLOUT_TIP) {
          label = "TIP";
          borderColor = "64748B";
          borderStyle = "single";
          borderSize = 36;
          shadingFill = "F9FAFB";
        } else if (block.type === BlockType.CALLOUT_WARNING) {
          label = "WARNING";
          borderColor = "000000";
          borderStyle = "single";
          borderSize = 48;
          shadingFill = "F1F5F9";
        } else {
          label = "NOTE";
          borderColor = "CBD5E1";
          borderStyle = "dashed";
          borderSize = 24;
          shadingFill = "FFFFFF";
        }

        docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `[ ${label} ]`, bold: true, size: 18, font: FONT_CONFIG }),
            new TextRun({ text: "", break: 1 }),
            ...block.content.split('\n').map((l, i) => new TextRun({ text: l, font: FONT_CONFIG, break: i > 0 ? 1 : 0 }))
          ],
          shading: { fill: shadingFill },
          border: { left: { style: borderStyle, space: 15, size: borderSize, color: borderColor } },
          spacing: { before: 400, after: 400, line: 360 },
          indent: { left: 400 }
        }));
        break;
      case BlockType.BULLET_LIST:
        docChildren.push(new Paragraph({
          children: parseInlineStyles(block.content),
          bullet: { level: 0 },
          spacing: { before: 120, after: 120 }
        }));
        break;
      case BlockType.HORIZONTAL_RULE:
        docChildren.push(new Paragraph({
          text: "",
          border: {
            bottom: { style: "single", size: 6, color: "000000", space: 1 }
          },
          spacing: { before: 240, after: 240 }
        }));
        break;
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: docChildren
    }],
    styles: {
      default: {
        document: {
          run: { font: FONT_CONFIG, size: 22 },
        },
      },
    },
  });

  return await Packer.toBlob(doc);
};