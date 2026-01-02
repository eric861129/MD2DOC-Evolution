import { Paragraph, TextRun, AlignmentType, TabStopType } from "docx";
import { FONT_SIZES, SIZES } from "../../../constants/theme";
import { FONT_CONFIG_NORMAL } from "./common";
import { DocxConfig } from "../types";

export const createManualTOC = (content: string, pageConfig: DocxConfig): Paragraph[] => {
  const lines = content.split('\n');
  const tocParagraphs: Paragraph[] = [];

  // 目錄標題
  tocParagraphs.push(new Paragraph({
    children: [new TextRun({ text: "目 錄", bold: true, size: FONT_SIZES.H1, font: FONT_CONFIG_NORMAL })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 480 }
  }));

  // 計算右側定位點位置 (總寬度減去邊距)
  // 假設兩邊邊距各為 1440 twips (1 inch)
  // 1 cm = 567 twips
  const rightPos = (pageConfig.widthCm * SIZES.CM_TO_TWIPS) - 2880;

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
          leader: TabStopType.DOT, // 引導點樣式
        }
      ],
      spacing: { before: 120, after: 120 }
    }));
  });

  return tocParagraphs;
};
