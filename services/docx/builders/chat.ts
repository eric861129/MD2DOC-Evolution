import { Paragraph, TextRun, AlignmentType } from "docx";
import { BlockType } from "../../../types";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles, FONT_CONFIG_NORMAL } from "./common";

const { SPACING, COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

export const createChatBubble = (content: string, type: BlockType.CHAT_USER | BlockType.CHAT_AI): Paragraph => {
  const isUser = type === BlockType.CHAT_USER;
  return new Paragraph({
    children: [
        new TextRun({ text: isUser ? "User:" : "AI:", bold: true, size: FONT_SIZES.LABEL, font: FONT_CONFIG_NORMAL }),
        new TextRun({ text: "", break: 1 }),
        ...parseInlineStyles(content)
    ],
    border: {
      top: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      bottom: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      left: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
      right: { style: isUser ? "dashed" : "dotted", space: 10, color: COLORS.CHAT_BORDER },
    },
    indent: isUser ? { left: LAYOUT.INDENT.CHAT } : { right: LAYOUT.INDENT.CHAT }, 
    alignment: isUser ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing: SPACING.CHAT,
    shading: { fill: isUser ? COLORS.WHITE : COLORS.BG_AI_CHAT }
  });
};