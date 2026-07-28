import { beforeAll, describe, expect, it } from 'vitest';
import { generateDocx } from '../../services/docxGenerator';
import { columnWidthsFor } from '../../services/docx/builders/tableGeometry';
import { resolvePageLayout } from '../../services/docx/layout/resolve';
import type { ExportSettings } from '../../services/docx/layout/types';
import { BlockType } from '../../services/types';
import { readDocxXml } from '../helpers/readDocx';

const publisherExactSettings = {
  profileId: 'publisher-exact' as const,
  pageSizeId: 'tech' as const,
  marginPresetId: 'publisher-exact' as const,
};

const legacySettings = {
  profileId: 'technical-legacy' as const,
  pageSizeId: 'tech' as const,
  marginPresetId: 'publisher-exact' as const,
};

const parseXml = (xml: string): Document =>
  new DOMParser().parseFromString(xml, 'application/xml');

const elementsByName = (
  parent: Document | Element,
  name: string,
): Element[] => Array.from(parent.getElementsByTagName(`w:${name}`));

const directChild = (
  parent: Document | Element,
  name: string,
): Element | undefined =>
  Array.from(parent.children).find((element) => element.localName === name);

const wordAttribute = (element: Element, name: string): string | null =>
  element.getAttribute(`w:${name}`) ?? element.getAttribute(name);

const createTableDocument = async (
  rows: string[][],
  exportSettings: ExportSettings = publisherExactSettings,
): Promise<Document> => {
  const blob = await generateDocx([{
    type: BlockType.TABLE,
    content: '',
    tableRows: rows,
  }], {
    exportSettings,
    showLineNumbers: false,
  });

  return parseXml(await readDocxXml(blob, 'word/document.xml'));
};

beforeAll(() => {
  if (typeof Blob.prototype.arrayBuffer === 'function') {
    return;
  }

  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
  });
});

describe('columnWidthsFor', () => {
  it.each([
    {
      label: '空表回退為單欄',
      rows: [],
      width: 6638,
      expected: [6638],
    },
    {
      label: '單欄填滿可用表格寬度',
      rows: [['內容']],
      width: 6638,
      expected: [6638],
    },
    {
      label: '兩欄短標籤採 1700/6638 比例',
      rows: [['方法', '說明'], ['GET', '取得資料']],
      width: 6638,
      expected: [1700, 4938],
    },
    {
      label: '兩欄長首欄採 2700/6638 比例',
      rows: [['這是超過八字的標籤', '說明']],
      width: 6638,
      expected: [2700, 3938],
    },
    {
      label: '三欄依 2160/3600/3600 權重且尾欄吸收誤差',
      rows: [['一', '二', '三']],
      width: 6638,
      expected: [1531, 2553, 2554],
    },
    {
      label: '四欄依 1600/2500/2500/2760 權重且尾欄吸收誤差',
      rows: [['一', '二', '三', '四']],
      width: 6638,
      expected: [1134, 1772, 1772, 1960],
    },
    {
      label: '五欄平均且尾欄吸收誤差',
      rows: [['一', '二', '三', '四', '五']],
      width: 6638,
      expected: [1327, 1327, 1327, 1327, 1330],
    },
    {
      label: '六欄平均且尾欄吸收誤差',
      rows: [['一', '二', '三', '四', '五', '六']],
      width: 6638,
      expected: [1106, 1106, 1106, 1106, 1106, 1108],
    },
  ])('$label', ({ rows, width, expected }) => {
    const widths = columnWidthsFor(rows, width);

    expect(widths).toEqual(expected);
    expect(widths.reduce((total, columnWidth) =>
      total + columnWidth, 0)).toBe(width);
  });

  it('不同內容寬度沿用出版社兩欄比例並讓尾欄吸收 rounding', () => {
    const widths = columnWidthsFor([
      ['方法', '說明'],
      ['GET', '取得資料'],
    ], 8078);

    expect(widths).toEqual([2068, 6010]);
    expect(widths[0] / 8078).toBeCloseTo(1700 / 6638, 3);
    expect(widths.reduce((total, width) => total + width, 0)).toBe(8078);
  });

  it('首欄以 Python Unicode code point 與原始 inline marker 計算長度', () => {
    expect(columnWidthsFor([
      ['😀😀😀😀😀😀😀😀', '八個 Unicode code point'],
    ], 6638)).toEqual([1700, 4938]);
    expect(columnWidthsFor([
      ['**12345**', '原始 marker 使長度超過八'],
    ], 6638)).toEqual([2700, 3938]);
  });
});

describe('出版社固定表格 OOXML', () => {
  it('相鄰表格以空段落隔開，避免 LibreOffice 合併成單一表格', async () => {
    const blob = await generateDocx([
      {
        type: BlockType.TABLE,
        content: '',
        tableRows: [['一欄'], ['星點']],
      },
      {
        type: BlockType.TABLE,
        content: '',
        tableRows: [['編號', '星名'], ['S-01', '晨光']],
      },
    ], {
      exportSettings: publisherExactSettings,
      showLineNumbers: false,
    });
    const document = parseXml(
      await readDocxXml(blob, 'word/document.xml'),
    );
    const body = elementsByName(document, 'body')[0];

    expect(Array.from(body.children).map((child) => child.localName))
      .toEqual(['tbl', 'p', 'tbl', 'sectPr']);
    expect(elementsByName(body.children[1], 't')).toHaveLength(0);
  });

  it('出版社表格每一列都禁止跨頁拆分', async () => {
    const document = await createTableDocument([
      ['編號', '備註'],
      ['S-05', '虛構資料'],
    ]);
    const rows = elementsByName(elementsByName(document, 'tbl')[0], 'tr');

    expect(rows.map((row) => {
      const rowProperties = directChild(row, 'trPr');
      return Boolean(
        rowProperties && directChild(rowProperties, 'cantSplit'),
      );
    })).toEqual([true, true]);
  });

  it('tblCellMar 依 Office 2010 schema 順序輸出 top、start、bottom、end', async () => {
    const document = await createTableDocument([
      ['方法', '說明'],
      ['GET', '取得資料'],
    ]);
    const tableProperties = elementsByName(document, 'tblPr')[0];
    const tableMargins = directChild(tableProperties, 'tblCellMar')!;

    expect(Array.from(tableMargins.children)
      .map((margin) => margin.localName))
      .toEqual(['top', 'start', 'bottom', 'end']);
  });

  it('只有第一列輸出 tblHeader，其他列完全省略此 schema 節點', async () => {
    const document = await createTableDocument([
      ['方法', '說明'],
      ['GET', '取得資料'],
      ['POST', '新增資料'],
    ]);
    const rows = elementsByName(elementsByName(document, 'tbl')[0], 'tr');
    const tableHeaders = rows.map((row) => {
      const rowProperties = directChild(row, 'trPr');
      return rowProperties
        ? directChild(rowProperties, 'tblHeader')
        : undefined;
    });

    expect(tableHeaders[0]).toBeDefined();
    expect(tableHeaders.slice(1)).toEqual([undefined, undefined]);
  });

  it('輸出不溢出內容區的固定 DXA 幾何與可重複表頭', async () => {
    const document = await createTableDocument([
      ['方法', '說明'],
      ['GET', '取得資料'],
    ]);
    const table = elementsByName(document, 'tbl')[0];
    const tableProperties = directChild(table, 'tblPr')!;
    const tableWidth = directChild(tableProperties, 'tblW')!;
    const tableIndent = directChild(tableProperties, 'tblInd')!;
    const tableLayout = directChild(tableProperties, 'tblLayout')!;

    expect(wordAttribute(tableWidth, 'type')).toBe('dxa');
    expect(wordAttribute(tableWidth, 'w')).toBe('6638');
    expect(wordAttribute(tableIndent, 'type')).toBe('dxa');
    expect(wordAttribute(tableIndent, 'w')).toBe('120');
    expect(wordAttribute(tableLayout, 'type')).toBe('fixed');

    const gridWidths = elementsByName(directChild(table, 'tblGrid')!, 'gridCol')
      .map((column) => wordAttribute(column, 'w'));
    expect(gridWidths).toEqual(['1700', '4938']);

    const rows = elementsByName(table, 'tr');
    expect(directChild(directChild(rows[0], 'trPr')!, 'tblHeader'))
      .toBeDefined();
    for (const row of rows) {
      expect(elementsByName(row, 'tcW').map((cellWidth) => ({
        type: wordAttribute(cellWidth, 'type'),
        width: wordAttribute(cellWidth, 'w'),
      }))).toEqual([
        { type: 'dxa', width: '1700' },
        { type: 'dxa', width: '4938' },
      ]);
    }

    expect(elementsByName(rows[0], 'shd')
      .map((shading) => wordAttribute(shading, 'fill')))
      .toEqual(['E8EEF5', 'E8EEF5']);

    const tableMargins = directChild(tableProperties, 'tblCellMar')!;
    expect(['top', 'bottom', 'start', 'end'].map((name) => {
      const margin = directChild(tableMargins, name)!;
      return {
        name,
        type: wordAttribute(margin, 'type'),
        width: wordAttribute(margin, 'w'),
      };
    })).toEqual([
      { name: 'top', type: 'dxa', width: '80' },
      { name: 'bottom', type: 'dxa', width: '80' },
      { name: 'start', type: 'dxa', width: '120' },
      { name: 'end', type: 'dxa', width: '120' },
    ]);

    const body = elementsByName(document, 'body')[0];
    const tableIndex = Array.from(body.children).indexOf(table);
    expect(body.children[tableIndex + 1]?.localName).toBe('sectPr');
  });

  it.each([
    ['窄邊界', {
      profileId: 'publisher-narrow' as const,
      pageSizeId: 'tech' as const,
      marginPresetId: 'narrow' as const,
    }],
    ['裝訂版', {
      profileId: 'publisher-binding' as const,
      pageSizeId: 'tech' as const,
      marginPresetId: 'publisher-binding' as const,
    }],
  ])('%s的 table width 加 indent 精確填滿 resolved content width', async (
    _label,
    exportSettings,
  ) => {
    const document = await createTableDocument([
      ['方法', '說明'],
      ['GET', '取得資料'],
    ], exportSettings);
    const tableProperties = elementsByName(document, 'tblPr')[0];
    const tableWidth = Number(wordAttribute(
      directChild(tableProperties, 'tblW')!,
      'w',
    ));
    const tableIndent = Number(wordAttribute(
      directChild(tableProperties, 'tblInd')!,
      'w',
    ));
    const layout = resolvePageLayout(exportSettings);

    expect(tableWidth + tableIndent).toBe(layout.content.widthTwips);
    expect(elementsByName(document, 'gridCol')
      .reduce((total, column) =>
        total + Number(wordAttribute(column, 'w')), 0))
      .toBe(tableWidth);
  });

  it('多列不等欄時補齊到最大欄數且每列 tcW 對齊 tblGrid', async () => {
    const document = await createTableDocument([
      ['欄一', '欄二', '欄三'],
      ['只有一格'],
      ['兩格', '資料'],
    ]);
    const table = elementsByName(document, 'tbl')[0];
    const gridWidths = elementsByName(directChild(table, 'tblGrid')!, 'gridCol')
      .map((column) => wordAttribute(column, 'w'));

    expect(gridWidths).toEqual(['1531', '2553', '2554']);
    for (const row of elementsByName(table, 'tr')) {
      expect(elementsByName(row, 'tc')).toHaveLength(3);
      expect(elementsByName(row, 'tcW')
        .map((cellWidth) => wordAttribute(cellWidth, 'w')))
        .toEqual(gridWidths);
    }
  });

  it('空表與空儲存格可由真實 Packer 輸出', async () => {
    const emptyTable = await createTableDocument([]);
    const emptyCell = await createTableDocument([['']]);

    expect(elementsByName(emptyTable, 'tbl')).toHaveLength(1);
    expect(elementsByName(emptyTable, 'tc')).toHaveLength(1);
    expect(elementsByName(emptyCell, 'tc')).toHaveLength(1);
  });

  it('technical-legacy 保留既有百分比平均欄寬', async () => {
    const document = await createTableDocument([
      ['欄一', '欄二'],
      ['內容一', '內容二'],
    ], legacySettings);
    const table = elementsByName(document, 'tbl')[0];
    const tableProperties = directChild(table, 'tblPr')!;

    expect(wordAttribute(directChild(tableProperties, 'tblW')!, 'type'))
      .toBe('pct');
    expect(directChild(tableProperties, 'tblLayout')).toBeUndefined();
    expect(directChild(tableProperties, 'tblInd')).toBeUndefined();
    const cellWidths = elementsByName(table, 'tcW');
    expect(cellWidths.every((width) =>
      wordAttribute(width, 'type') === 'pct'
    )).toBe(true);
    expect(new Set(cellWidths.map((width) => wordAttribute(width, 'w'))).size)
      .toBe(1);
  });
});
