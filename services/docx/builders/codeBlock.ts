import { Paragraph, TextRun } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";

const { SPACING, COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

export const createCodeBlock = (content: string): Paragraph => {
  const codeLines = content.split('\n');
  return new Paragraph({
    children: codeLines.map((line, index) => new TextRun({
       text: line,
       font: FONT_CONFIG_NORMAL,
       size: FONT_SIZES.CODE,
       break: index > 0 ? 1 : undefined
    })),
    border: {
      top: { style: "single", space: 10, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      bottom: { style: "single", space: 10, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      left: { style: "single", space: 10, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      right: { style: "single", space: 10, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
    },
    shading: { fill: COLORS.BG_CODE },
    spacing: SPACING.CODE_BLOCK,
    indent: { left: LAYOUT.INDENT.CODE, right: LAYOUT.INDENT.CODE }
  });
};