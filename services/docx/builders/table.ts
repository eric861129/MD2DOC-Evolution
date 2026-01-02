import { Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";

const { COLORS } = WORD_THEME;

export const createTable = (rows: string[][]): Table => {
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