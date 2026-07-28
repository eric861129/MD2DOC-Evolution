/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

// --- Constants (Magic Numbers) ---

export const LINE_HEIGHT = {
  SINGLE: 240,       // 12pt * 20 twips
  ONE_POINT_TWO: 276, // 1.15 ~ 1.2 lines
  ONE_POINT_FIVE: 360,
  DOUBLE: 480,
};

export const TWIPS_PER_INCH = 1440;
export const TWIPS_PER_CM = 567;
export const TWIPS_PER_PT = 20;

// --- Word Theme Configuration ---

export const WORD_THEME = {
  FONTS: {
    CJK: "Microsoft JhengHei", // 微軟正黑體
    LATIN: "Consolas",
  },
  
  FONT_SIZES: {
    BODY: 22,      // 11pt
    CODE: 18,      // 9pt
    LABEL: 18,     // 9pt
    SHORTCUT: 20,  // 10pt
    H1: 32,        // 16pt
    H2: 28,        // 14pt
    H3: 24,        // 12pt
  },

  COLORS: {
    // 基礎色
    BLACK: "000000",
    WHITE: "FFFFFF",
    
    // 語意色
    PRIMARY_BLUE: "1E3A8A", // 深藍色 (斜體用)
    LINK_BLUE: "2563EB",    // 亮藍色 (連結/底線用)
    
    // 背景色 (Word Shading)
    BG_CODE: "F1F5F9",
    BG_BUTTON: "E2E8F0",
    BG_SHORTCUT: "F8FAFC",
    BG_AI_CHAT: "F2F2F2",
    
    // Callout 顏色
    CALLOUT: {
      TIP: { BORDER: "64748B", BG: "F9FAFB" },
      NOTE: { BORDER: "CBD5E1", BG: "FFFFFF" },
      WARNING: { BORDER: "000000", BG: "F1F5F9" }
    },
    
    // 特定邊框顏色
    CHAT_BORDER: "404040",
    CODE_BORDER: "BFBFBF",
    LINE_NUMBER_TEXT: "94A3B8" // 淺灰色
  },

  SPACING: {
    PARAGRAPH: { before: 200, after: 200 },
    H1: { before: 480, after: 240 },
    H2: { before: 400, after: 200 },
    H3: { before: 300, after: 150 },
    CODE_BLOCK: { before: 600, after: 600, line: LINE_HEIGHT.SINGLE }, // Single spacing (IDE style)
    CHAT: { before: 400, after: 400, line: LINE_HEIGHT.ONE_POINT_TWO },
    CALLOUT: { before: 600, after: 600, line: LINE_HEIGHT.ONE_POINT_FIVE },
    LIST: { before: 120, after: 120 },
    TABLE_AFTER: 240,
    HR: { before: 240, after: 240 }
  },

  LAYOUT: {
    WIDTH: {
      LINE_NUMBER: 450, // 約 0.8cm
    },
    INDENT: {
      CODE: 400,
      CHAT: TWIPS_PER_INCH, // 1 inch
      CALLOUT: 400
    },
    BORDER: {
      H1_BOTTOM: 18,
      CODE: 6,
      CALLOUT_TIP: 36,
      CALLOUT_WARNING: 48,
      CALLOUT_NOTE: 24,
      HR: 12
    },
    MARGIN: {
      NORMAL: TWIPS_PER_INCH // 1 inch
    }
  }
};

/**
 * 出版社參考稿的權威 DOCX 樣式數值。
 * 版面幾何由 layout preset 管理，此處只保存跨版型共用的視覺 Token。
 */
export const PUBLISHER_WORD_THEME = {
  FONTS: {
    BODY_LATIN: "Calibri",
    CODE_LATIN: "Consolas",
    CJK: "Noto Sans TC",
  },
  FONT_SIZES: {
    BODY: 22,
    CODE: 18,
    CALLOUT: 21,
    CAPTION: 18,
    H1: 32,
    H2: 26,
    H3: 24,
  },
  COLORS: {
    BODY: "000000",
    HEADING_1: "2E74B5",
    HEADING_2: "2E74B5",
    HEADING_3: "1F4D78",
    INLINE_CODE: "9B1C1C",
    CAPTION: "555555",
    CALLOUT_TEXT: "0B2545",
    CODE_BACKGROUND: "F4F6F9",
    TABLE_HEADER_BACKGROUND: "E8EEF5",
  },
  SPACING: {
    PARAGRAPH: { before: 0, after: 120, line: 300 },
    H1: { before: 360, after: 200 },
    H2: { before: 280, after: 140 },
    H3: { before: 200, after: 100 },
    CODE_BLOCK: { before: 0, after: 0, line: LINE_HEIGHT.SINGLE },
    CALLOUT: { before: 80, after: 120, line: 288 },
    CAPTION: { before: 0, after: 160, line: LINE_HEIGHT.ONE_POINT_TWO },
  },
  CALLOUT_BACKGROUNDS: {
    NOTE: "F4F6F9",
    TIP: "EEF7F0",
    WARNING: "FFF4CC",
    IMPORTANT: "EEF4FB",
    CAUTION: "FDECEC",
  },
  TABLE: {
    INDENT: 120,
    CELL_MARGINS: { top: 80, bottom: 80, start: 120, end: 120 },
    BODY_SIZE: 20,
    PARAGRAPH_AFTER: 60,
    LINE: LINE_HEIGHT.ONE_POINT_TWO,
  },
  IMAGE: {
    MAX_WIDTH_CM: 13,
    CHAPTER_OPENER_WIDTH_CM: 9.8,
    ALLOWED_MARGIN_INTRUSION_CM: 0.55,
  },
  HEADER_FOOTER: {
    DISTANCE_CM: 1.24968,
  },
} as const;

// --- UI Theme Configuration (For React Components) ---

export const UI_THEME = {
  FONTS: {
    PREVIEW: `"Geist Mono", "${WORD_THEME.FONTS.LATIN}", "${WORD_THEME.FONTS.CJK}", monospace`
  }
};

// --- Utilities ---
export const SIZES = {
  CM_TO_TWIPS: TWIPS_PER_CM,
};
