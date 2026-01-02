import { TextRun, ShadingType, UnderlineType } from "docx";
import { parseInlineElements, InlineStyleType } from "../../../utils/styleParser";
import { FONTS, COLORS, FONT_SIZES } from "../../../constants/theme";

// --- 字型配置 ---
export const FONT_CONFIG_NORMAL = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN
};

// --- Helper: 行內樣式解析 ---
export const parseInlineStyles = (text: string): TextRun[] => {
  const segments = parseInlineElements(text);
  return segments.map(segment => {
    const baseConfig = { text: segment.content, font: FONT_CONFIG_NORMAL };
    
    switch (segment.type) {
      case InlineStyleType.BOLD:
        return new TextRun({ ...baseConfig, bold: true });
      case InlineStyleType.ITALIC:
        return new TextRun({ ...baseConfig, italics: true, color: COLORS.PRIMARY_BLUE });
      case InlineStyleType.UNDERLINE:
        return new TextRun({
          ...baseConfig, 
          color: COLORS.LINK_BLUE, 
          underline: { type: UnderlineType.SINGLE, color: COLORS.LINK_BLUE } 
        });
      case InlineStyleType.CODE:
        return new TextRun({
          ...baseConfig, 
          shading: { fill: COLORS.BG_CODE, type: ShadingType.CLEAR, color: "auto" } 
        });
      case InlineStyleType.UI_BUTTON:
        return new TextRun({
          ...baseConfig, 
          bold: true, 
          shading: { fill: COLORS.BG_BUTTON, type: ShadingType.CLEAR, color: "auto" } 
        });
      case InlineStyleType.SHORTCUT:
        return new TextRun({
          ...baseConfig, 
          size: FONT_SIZES.SHORTCUT, 
          shading: { fill: COLORS.BG_SHORTCUT, type: ShadingType.CLEAR, color: "auto" } 
        });
      case InlineStyleType.BOOK:
        return new TextRun({ ...baseConfig, bold: true });
      default:
        return new TextRun(baseConfig);
    }
  });
};
