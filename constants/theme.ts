/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { LineChart } from "lucide-react";
import { after, before } from "node:test";

// 字體設定
export const FONTS = {
  CJK: "Microsoft JhengHei", // 微軟正黑體
  LATIN: "Consolas",
};

// 字體大小 (Word 單位: half-points, e.g., 24 = 12pt)
export const FONT_SIZES = {
  BODY: 22,
  CODE: 18,
  LABEL: 18,
  SHORTCUT: 20,
  H1: 32,
  H2: 28,
  H3: 24,
};

// 顏色設定
export const COLORS = {
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
};

// 間距設定 (Word 單位: twips, 1pt = 20 twips)
export const SPACING = {
  PARAGRAPH: { before: 200, after: 200 },
  H1: { before: 480, after: 240 },
  H2: { before: 400, after: 200 },
  H3: { before: 300, after: 150 },
  CODE_BLOCK: { before: 400, after: 400, line: 240 },
  CHAT: { before: 300, after: 300 },
  CALLOUT: { before: 400, after: 400, Line: 360 },
  LIST: { before: 120, after: 120 },
  TABLE_AFTER: 240,
  HR: { before: 240, after: 240 }
};

// 佈局設定 (縮排、邊框粗細等)
export const LAYOUT = {
  INDENT: {
    CODE: 400,
    CHAT: 1440,
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
    NORMAL: 1440 // 1 inch = 1440 twips
  }
};

// 單位與尺寸
export const SIZES = {
  CM_TO_TWIPS: 567,
};