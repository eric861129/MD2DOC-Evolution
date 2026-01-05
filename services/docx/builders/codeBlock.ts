import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

const { SPACING, COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

export const createCodeBlock = (content: string, config: DocxConfig): Table => {
  const codeLines = content.split('\n');
  const lineNumWidth = LAYOUT.WIDTH.LINE_NUMBER;
  
  // 計算可用寬度 (總寬度 - 邊距 - 程式碼區塊縮排)
  // 注意：這裡我們把 Table 放在縮排內，或者讓 Table 寬度佔滿可用空間
  const totalWidth = config.widthCm * 567; // TWIPS_PER_CM
  const usableWidth = totalWidth - (2 * LAYOUT.MARGIN.NORMAL) - (2 * LAYOUT.INDENT.CODE);

  const rows = codeLines.map((line, index) => {
    return new TableRow({
      children: [
        // 行號欄位
        new TableCell({
          width: { size: lineNumWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          shading: { fill: COLORS.BG_CODE },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: (index + 1).toString(),
                  font: WORD_THEME.FONTS.LATIN,
                  size: FONT_SIZES.CODE,
                  color: COLORS.LINE_NUMBER_TEXT,
                }),
              ],
              spacing: { before: 0, after: 0, line: SPACING.CODE_BLOCK.line },
            }),
          ],
        }),
        // 程式碼欄位
        new TableCell({
          width: { size: usableWidth - lineNumWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          shading: { fill: COLORS.BG_CODE },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  font: FONT_CONFIG_NORMAL,
                  size: FONT_SIZES.CODE,
                }),
              ],
              spacing: { before: 0, after: 0, line: SPACING.CODE_BLOCK.line },
              indent: { left: 120 }, // 與行號保持一點間距
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    rows: rows,
    width: { size: usableWidth, type: WidthType.DXA },
    indent: { size: LAYOUT.INDENT.CODE, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      left: { style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      right: { style: BorderStyle.SINGLE, size: LAYOUT.BORDER.CODE, color: COLORS.CODE_BORDER },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    margins: {
      top: 100,
      bottom: 100,
    }
  });
};