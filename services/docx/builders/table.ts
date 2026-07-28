import {
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  VerticalAlignTable,
  WidthType,
  XmlAttributeComponent,
  XmlComponent,
} from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { parseInlineStyles } from "./common";
import { DocxConfig } from "../types";
import { columnWidthsFor } from "./tableGeometry";

const { COLORS } = WORD_THEME;

interface TableMarginAttributes {
  width: number;
  type: string;
}

class TableMarginXmlAttributes
  extends XmlAttributeComponent<TableMarginAttributes> {
  protected readonly xmlKeys = {
    width: 'w:w',
    type: 'w:type',
  };
}

class TableMarginXmlElement extends XmlComponent {
  public constructor(name: 'top' | 'bottom' | 'start' | 'end', width: number) {
    super(`w:${name}`);
    this.root.push(new TableMarginXmlAttributes({
      width,
      type: WidthType.DXA,
    }));
  }
}

class LogicalTableCellMargins extends XmlComponent {
  public constructor(
    margins: { top: number; bottom: number; start: number; end: number },
  ) {
    super('w:tblCellMar');
    this.root.push(
      new TableMarginXmlElement('top', margins.top),
      new TableMarginXmlElement('bottom', margins.bottom),
      new TableMarginXmlElement('start', margins.start),
      new TableMarginXmlElement('end', margins.end),
    );
  }
}

class TableXmlAccessor extends XmlComponent {
  private constructor() {
    super('w:tbl');
  }

  public static replaceCellMargins(
    table: Table,
    margins: { top: number; bottom: number; start: number; end: number },
  ): void {
    const tableProperties = (
      (table as TableXmlAccessor).root[0] as TableXmlAccessor
    );
    const marginIndex = tableProperties.root.findIndex(
      (component) => TableXmlAccessor.rootKeyOf(component) === 'w:tblCellMar',
    );
    if (marginIndex < 0) {
      throw new Error('DOCX 表格缺少儲存格邊界節點');
    }

    tableProperties.root.splice(
      marginIndex,
      1,
      new LogicalTableCellMargins(margins),
    );
  }

  private static rootKeyOf(component: unknown): string | undefined {
    return component instanceof XmlComponent
      ? (component as TableXmlAccessor).rootKey
      : undefined;
  }
}

const columnCountFor = (rows: string[][]): number =>
  Math.max(1, ...rows.map((row) => row.length));

const normalizedRows = (
  rows: string[][],
  columnCount: number,
): string[][] => {
  const sourceRows = rows.length > 0 ? rows : [[]];
  return sourceRows.map((row) => [
    ...row,
    ...Array(Math.max(0, columnCount - row.length)).fill(''),
  ]);
};

const createLegacyTable = async (
  rows: string[][],
  config?: DocxConfig,
): Promise<Table> => {
  const columnCount = columnCountFor(rows);
  const contentRows = normalizedRows(rows, columnCount);
  const tableRows = await Promise.all(contentRows.map(async (row) =>
    new TableRow({
      children: await Promise.all(row.map(async (cellText) =>
        new TableCell({
          children: [
            new Paragraph({
              children: await parseInlineStyles(cellText, config),
            }),
          ],
          width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
          },
          shading: { fill: COLORS.WHITE },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        })
      )),
    })
  ));

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: Array(columnCount).fill(100),
  });
};

/** 建立保留 legacy 相容性，並讓出版社版型採固定 DXA 幾何的表格。 */
export const createTable = async (
  rows: string[][],
  config?: DocxConfig,
): Promise<Table> => {
  if (!config || config.profile.id === 'technical-legacy') {
    return createLegacyTable(rows, config);
  }

  const indentTwips = config.profile.table.indentTwips;
  const tableWidthTwips = config.layout.content.widthTwips - indentTwips;
  const columnWidths = columnWidthsFor(rows, tableWidthTwips);
  const contentRows = normalizedRows(rows, columnWidths.length);
  const tableRows = await Promise.all(contentRows.map(async (row, rowIndex) =>
    new TableRow({
      tableHeader: rowIndex === 0,
      children: await Promise.all(row.map(async (cellText, columnIndex) =>
        new TableCell({
          children: [
            new Paragraph({
              children: await parseInlineStyles(cellText, config),
              spacing: {
                after: config.profile.table.paragraphAfterTwips,
                line: config.profile.table.lineTwips,
              },
            }),
          ],
          width: {
            size: columnWidths[columnIndex],
            type: WidthType.DXA,
          },
          verticalAlign: VerticalAlignTable.CENTER,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
            right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.BLACK },
          },
          shading: {
            fill: rowIndex === 0
              ? config.profile.table.headerFill
              : COLORS.WHITE,
          },
        })
      )),
    })
  ));
  const margins = config.profile.table.cellMarginsTwips;
  const table = new Table({
    rows: tableRows,
    width: { size: tableWidthTwips, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    indent: { size: indentTwips, type: WidthType.DXA },
    margins: {
      marginUnitType: WidthType.DXA,
      top: margins.top,
      bottom: margins.bottom,
      left: margins.start,
      right: margins.end,
    },
    style: config.profile.table.styleId,
  });

  TableXmlAccessor.replaceCellMargins(table, margins);
  return table;
};
