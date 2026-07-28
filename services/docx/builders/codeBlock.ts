import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle } from "docx";
import { WORD_THEME } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";
import { DOCUMENT_STYLE_IDS } from "../styles";

const { SPACING, COLORS, FONT_SIZES, LAYOUT } = WORD_THEME;

interface CodeBlockMetadata {
  showLineNumbers?: boolean;
  language?: string;
}

const createLegacyCodeBlock = async (
  content: string,
  config: DocxConfig,
  metadata?: CodeBlockMetadata,
): Promise<Table> => {
  const codeLines = content.split('\n');
  
  // 決定是否顯示行號：Metadata 優先，否則使用 Config 設定 (預設為 true)
  let showLineNumbers = config.showLineNumbers !== false;
  if (metadata?.showLineNumbers !== undefined) {
    showLineNumbers = metadata.showLineNumbers;
  }

  const lineNumWidth = showLineNumbers ? LAYOUT.WIDTH.LINE_NUMBER : 0;
  
  // 共用版面解析器的精確內容寬度，避免各區塊重複換算產生誤差
  const usableWidth = config.layout.content.widthTwips;
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
  const paddingCells = [];
  if (showLineNumbers) {
    paddingCells.push(new TableCell({ 
      width: { size: lineNumWidth, type: WidthType.DXA }, 
      shading: { fill: COLORS.BG_CODE }, 
      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 2 })], spacing: { before: 0, after: 0, line: 240 } })] 
    }));
  }
  paddingCells.push(new TableCell({ 
    width: { size: codeColWidth, type: WidthType.DXA }, 
    shading: { fill: COLORS.BG_CODE }, 
    children: [new Paragraph({ children: [new TextRun({ text: " ", size: 2 })], spacing: { before: 0, after: 0, line: 240 } })] 
  }));

  const paddingRow = new TableRow({
    height: { value: 240, rule: "atLeast" },
    children: paddingCells
  });
  
  // 組合所有 Rows
  const tableRows = [paddingRow, ...rows, paddingRow];

  // 如果有語言標籤，新增 Header Row
  if (metadata?.language) {
    tableRows.unshift(new TableRow({
        children: [
          new TableCell({
            columnSpan: showLineNumbers ? 2 : 1,
            shading: { fill: "E2E8F0" }, // 稍微深一點的灰色 (Slate-200)
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ 
                    text: metadata.language.toUpperCase(), 
                    font: WORD_THEME.FONTS.LATIN,
                    size: 16, // 小字體
                    bold: true,
                    color: "64748B" // Slate-500
                  })
                ],
                spacing: { before: 60, after: 60 }
              })
            ]
          })
        ]
    }));
  }

  return new Table({
    rows: tableRows,
    width: { size: usableWidth, type: WidthType.DXA },
    // indent: 移除縮排
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

const createPublisherCodeBlock = (
  content: string,
  config: DocxConfig,
): Paragraph[] => {
  const codeStyle = config.profile.paragraph.code;

  return content.split('\n').map((line) => new Paragraph({
    style: DOCUMENT_STYLE_IDS.codeBlock,
    children: [
      new TextRun({
        text: line || ' ',
        font: config.profile.fonts.code,
      }),
    ],
    shading: {
      fill: codeStyle.shadingFill ?? 'F4F6F9',
    },
    indent: {
      left: codeStyle.leftIndentTwips ?? 230,
      right: codeStyle.rightIndentTwips ?? 230,
    },
  }));
};

/**
 * 出版社 Profile 使用逐行命名段落；舊版 Profile 保留 table renderer 相容性。
 */
export const createCodeBlock = async (
  content: string,
  config: DocxConfig,
  metadata?: CodeBlockMetadata,
): Promise<Table | Paragraph[]> =>
  config.profile.id === 'technical-legacy'
    ? createLegacyCodeBlock(content, config, metadata)
    : createPublisherCodeBlock(content, config);
