import { TextRun, ShadingType, UnderlineType, ImageRun } from "docx";
import { parseInlineElements, InlineStyleType } from "../../../utils/styleParser";
import { WORD_THEME } from "../../../constants/theme";
import { DocxConfig } from "../types";
import { generateQRCode } from "../../qrCodeService";

const { FONTS, COLORS, FONT_SIZES } = WORD_THEME;

// --- 字型配置 ---
export const FONT_CONFIG_NORMAL = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN
};

// --- Helper: 行內樣式解析 ---
export const parseInlineStyles = async (text: string, config?: DocxConfig): Promise<(TextRun | ImageRun)[]> => {
  const segments = parseInlineElements(text);
  const runs: (TextRun | ImageRun)[] = [];

  for (const segment of segments) {
    const baseConfig = { text: segment.content, font: FONT_CONFIG_NORMAL };
    
    switch (segment.type) {
      case InlineStyleType.BOLD:
        runs.push(new TextRun({ ...baseConfig, bold: true }));
        break;
      case InlineStyleType.ITALIC:
        runs.push(new TextRun({ ...baseConfig, italics: true, color: COLORS.PRIMARY_BLUE }));
        break;
      case InlineStyleType.UNDERLINE:
        runs.push(new TextRun({
          ...baseConfig, 
          color: COLORS.LINK_BLUE, 
          underline: { type: UnderlineType.SINGLE, color: COLORS.LINK_BLUE } 
        }));
        break;
      case InlineStyleType.LINK:
        // 1. Link Text (藍色底線)
        runs.push(new TextRun({
          ...baseConfig,
          color: COLORS.LINK_BLUE,
          underline: { type: UnderlineType.SINGLE, color: COLORS.LINK_BLUE }
        }));
        // 2. QR Code Generation (Async)
        if (segment.url) {
          try {
            const qrBuffer = await generateQRCode(segment.url);
            if (qrBuffer.byteLength > 0) {
              // 前後加個小空格避免貼太近
              runs.push(new TextRun({ text: " ", font: FONT_CONFIG_NORMAL, size: 4 })); 
              runs.push(new ImageRun({
                data: qrBuffer,
                transformation: { width: 45, height: 45 }, // 約 1.5cm
                type: "png"
              }));
              runs.push(new TextRun({ text: " ", font: FONT_CONFIG_NORMAL, size: 4 })); 
            }
          } catch (e) {
            console.warn(`Failed to generate QR for ${segment.url}`, e);
          }
        }
        break;
      case InlineStyleType.IMAGE:
        if (segment.url) {
          try {
            const realSrc = (config?.imageRegistry && config.imageRegistry[segment.url]) 
              ? config.imageRegistry[segment.url] 
              : segment.url;
            
            if (realSrc.startsWith('data:image/')) {
              const base64Data = realSrc.split(',')[1];
              const binaryData = atob(base64Data);
              const buffer = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                buffer[i] = binaryData.charCodeAt(i);
              }
              
              runs.push(new ImageRun({
                data: buffer,
                transformation: { width: 100, height: 100 }, // Default size for inline
                type: "png"
              }));
            }
          } catch (e) {
            console.warn("Failed to render inline image", e);
          }
        }
        break;
      case InlineStyleType.CODE:
        runs.push(new TextRun({
          ...baseConfig, 
          shading: { fill: COLORS.BG_CODE, type: ShadingType.CLEAR, color: "auto" } 
        }));
        break;
      case InlineStyleType.UI_BUTTON:
        runs.push(new TextRun({
          ...baseConfig, 
          bold: true, 
          shading: { fill: COLORS.BG_BUTTON, type: ShadingType.CLEAR, color: "auto" } 
        }));
        break;
      case InlineStyleType.SHORTCUT:
        runs.push(new TextRun({
          ...baseConfig, 
          size: FONT_SIZES.SHORTCUT, 
          shading: { fill: COLORS.BG_SHORTCUT, type: ShadingType.CLEAR, color: "auto" } 
        }));
        break;
      case InlineStyleType.BOOK:
        runs.push(new TextRun({ ...baseConfig, bold: true }));
        break;
      default:
        runs.push(new TextRun(baseConfig));
        break;
    }
  }

  return runs;
};