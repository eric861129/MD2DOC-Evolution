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
    CODE_BORDER: "BFBFBF"
  },

  SPACING: {
    PARAGRAPH: { before: 200, after: 200 },
    H1: { before: 480, after: 240 },
    H2: { before: 400, after: 200 },
    H3: { before: 300, after: 150 },
    CODE_BLOCK: { before: 600, after: 600, line: 300 }, // ~1.25 lines
    CHAT: { before: 400, after: 400, line: LINE_HEIGHT.ONE_POINT_TWO },
    CALLOUT: { before: 600, after: 600, line: LINE_HEIGHT.ONE_POINT_FIVE },
    LIST: { before: 120, after: 120 },
    TABLE_AFTER: 240,
    HR: { before: 240, after: 240 }
  },

  LAYOUT: {
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

// --- UI Theme Configuration (For React Components) ---

export const UI_THEME = {
  FONTS: {
    PREVIEW: `"${WORD_THEME.FONTS.LATIN}", "${WORD_THEME.FONTS.CJK}", sans-serif`
  }
};

// --- Utilities ---
export const SIZES = {
  CM_TO_TWIPS: TWIPS_PER_CM,
};
