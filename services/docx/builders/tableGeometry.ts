const PUBLISHER_BASE_TABLE_WIDTH_TWIPS = 6638;
const SHORT_FIRST_COLUMN_MAX_LENGTH = 8;

const columnCountFor = (rows: string[][]): number =>
  Math.max(1, ...rows.map((row) => row.length));

const scaleWidths = (
  weights: number[],
  tableWidthTwips: number,
): number[] => {
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  const widths = weights.map((weight) =>
    Math.floor(tableWidthTwips * weight / totalWeight)
  );
  widths[widths.length - 1] += tableWidthTwips
    - widths.reduce((total, width) => total + width, 0);
  return widths;
};

const firstColumnMaximumLength = (rows: string[][]): number =>
  Math.max(
    0,
    ...rows.map((row) => Array.from(row[0] ?? '').length),
  );

/**
 * 依權威出版社比例計算欄寬，並讓最後一欄吸收整數除法誤差。
 * 長度判斷沿用 Python 規則，以原始儲存格的 Unicode code point 數量為準。
 */
export const columnWidthsFor = (
  rows: string[][],
  tableWidthTwips: number,
): number[] => {
  const columnCount = columnCountFor(rows);
  if (columnCount === 1) {
    return [tableWidthTwips];
  }
  if (columnCount === 2) {
    const firstColumnWidth = firstColumnMaximumLength(rows)
      <= SHORT_FIRST_COLUMN_MAX_LENGTH
      ? 1700
      : 2700;
    return scaleWidths(
      [
        firstColumnWidth,
        PUBLISHER_BASE_TABLE_WIDTH_TWIPS - firstColumnWidth,
      ],
      tableWidthTwips,
    );
  }
  if (columnCount === 3) {
    return scaleWidths([2160, 3600, 3600], tableWidthTwips);
  }
  if (columnCount === 4) {
    return scaleWidths([1600, 2500, 2500, 2760], tableWidthTwips);
  }

  return scaleWidths(Array(columnCount).fill(1), tableWidthTwips);
};
