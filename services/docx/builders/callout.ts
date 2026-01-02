import { Paragraph, TextRun, BorderStyle } from "docx";
import { BlockType } from "../../../types";
import { SPACING, COLORS, FONT_SIZES, LAYOUT } from "../../../constants/theme";
import { parseInlineStyles, FONT_CONFIG_NORMAL } from "./common";

export const createCallout = (content: string, type: BlockType): Paragraph => {
  const config = {
    [BlockType.CALLOUT_TIP]: { label: "TIP", color: COLORS.CALLOUT.TIP.BORDER, style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CALLOUT_TIP, bg: COLORS.CALLOUT.TIP.BG },
    [BlockType.CALLOUT_WARNING]: { label: "WARNING", color: COLORS.CALLOUT.WARNING.BORDER, style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CALLOUT_WARNING, bg: COLORS.CALLOUT.WARNING.BG },
    [BlockType.CALLOUT_NOTE]: { label: "NOTE", color: COLORS.CALLOUT.NOTE.BORDER, style: BorderStyle.DASHED, size: LAYOUT.BORDER.CALLOUT_NOTE, bg: COLORS.CALLOUT.NOTE.BG },
  }[type] || { label: "NOTE", color: COLORS.CALLOUT.NOTE.BORDER, style: BorderStyle.DASHED, size: LAYOUT.BORDER.CALLOUT_NOTE, bg: COLORS.CALLOUT.NOTE.BG };

  const children: TextRun[] = [
    new TextRun({ text: `[ ${config.label} ]`, bold: true, size: FONT_SIZES.LABEL, font: FONT_CONFIG_NORMAL })
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
    spacing: SPACING.CALLOUT,
    indent: { left: LAYOUT.INDENT.CALLOUT, right: LAYOUT.INDENT.CALLOUT }
  });
};
