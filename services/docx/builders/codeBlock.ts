import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

const { SPACING, COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

export const createCodeBlock = (content: string, config: DocxConfig): Table => {
  const codeLines = content.split('\n');
  const showLineNumbers = config.showLineNumbers !== false; // Default to true
  const lineNumWidth = showLineNumbers ? LAYOUT.WIDTH.LINE_NUMBER : 0;
  
  // 計算可用寬度 (總寬度 - 邊距 - 程式碼區塊縮排)
  // 注意：這裡我們把 Table 放在縮排內，或者讓 Table 寬度佔滿可用空間
  const totalWidth = config.widthCm * 567; // TWIPS_PER_CM
  const usableWidth = totalWidth - (2 * LAYOUT.MARGIN.NORMAL) - (2 * LAYOUT.INDENT.CODE);
  const codeColWidth = usableWidth - lineNumWidth;

  const rows = codeLines.map((line, index) => {
    const cells = [];
    
    // 行號欄位
    if (showLineNumbers) {
      cells.push(new TableCell({
        width: { size: lineNumWidth, type: WidthType.DXA },
        verticalAlign: VerticalAlign.TOP,
        shading: { fill: COLORS.BG_CODE },
        margins: { left: 80, right: 80 }, // 稍微縮減左右邊距讓數字靠近邊框
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT, // 保持靠右對齊，但因為寬度變窄會視覺上更靠左
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
      }));
    }

    // 程式碼欄位
    cells.push(new TableCell({
      width: { size: codeColWidth, type: WidthType.DXA },
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
          indent: { left: 120 },
        }),
      ],
    }));

    return new TableRow({ children: cells });
  });

  // 建立頂部和底部的 Padding Row (空行)
  const paddingRowCells = [];
  if (showLineNumbers) {
    paddingRowCells.push(new TableCell({ width: { size: lineNumWidth, type: WidthType.DXA }, shading: { fill: COLORS.BG_CODE }, children: [] }));
  }
  paddingRowCells.push(new TableCell({ width: { size: codeColWidth, type: WidthType.DXA }, shading: { fill: COLORS.BG_CODE }, children: [] }));

  const paddingRow = new TableRow({
    height: { value: 120, rule: "exact" }, // 約 6pt 高度
    children: paddingRowCells
  });

  return new Table({
    rows: [paddingRow, ...rows, paddingRow], // 插入首尾 Padding
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
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });
};