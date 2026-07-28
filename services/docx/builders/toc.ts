import { Paragraph, TextRun, AlignmentType, TabStopType, LeaderType } from "docx";
import { WORD_THEME, LINE_HEIGHT } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

const { FONT_SIZES, SPACING } = WORD_THEME;

export const createManualTOC = (content: string, pageConfig: DocxConfig): Paragraph[] => {
  const lines = content.split('\n');
  const tocParagraphs: Paragraph[] = [];

  // 目錄標題
  tocParagraphs.push(new Paragraph({
    children: [new TextRun({ text: "目 錄", bold: true, size: FONT_SIZES.H1, font: FONT_CONFIG_NORMAL })],
    alignment: AlignmentType.CENTER,
    spacing: { before: LINE_HEIGHT.DOUBLE, after: LINE_HEIGHT.DOUBLE }
  }));

  // 共用版面解析器的精確內容寬度，支援非對稱與鏡像邊界
  const rightPos = pageConfig.layout.content.widthTwips;

  lines.forEach(line => {
    // 移除列表符號
    const cleanLine = line.replace(/^[-*\d\.]+\s*/, '').trim();
    if (!cleanLine) return;

    // 嘗試分離標題與頁碼 (匹配結尾的數字)
    const match = cleanLine.match(/^(.*?)\s+(\d+)$/);
    
    let title = cleanLine;
    let pageNum = "";

    if (match) {
      title = match[1];
      pageNum = match[2];
    }

    tocParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: title, font: FONT_CONFIG_NORMAL }),
        new TextRun({ children: ["\t"], font: FONT_CONFIG_NORMAL }), // 引導點 Tab
        new TextRun({ text: pageNum, font: FONT_CONFIG_NORMAL })     // 頁碼 (如果有)
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: rightPos,
          leader: LeaderType.DOT, // 引導點樣式
        }
      ],
      spacing: SPACING.LIST
    }));
  });

  return tocParagraphs;
};
