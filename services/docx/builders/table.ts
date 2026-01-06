import { Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";

const { COLORS } = WORD_THEME;

export const createTable = async (rows: string[][], config?: DocxConfig): Promise<Table> => {
  const tableRows = await Promise.all(rows.map(async (row) => 
    new TableRow({
      children: await Promise.all(row.map(async (cellText) => 
        new TableCell({
          children: [new Paragraph({ children: await parseInlineStyles(cellText, config) })],
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
      ))
    })
  ));

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};