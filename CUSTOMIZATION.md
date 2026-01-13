# 客製化指南 (Customization Guide)

感謝您使用 **MD2DOC-Evolution**！本專案採用高度模組化的架構，您可以輕鬆調整樣式、新增語法或修改 Word 輸出格式。

## 🎯 目錄

1. [修改設計系統 (字體、大小與間距)](#1-修改設計系統-字體大小與間距)
2. [調整 Word 輸出樣式](#2-調整-word-輸出樣式)
3. [新增 Markdown 語法](#3-新增-markdown-語法)
4. [修改預覽介面 (Preview UI)](#4-修改預覽介面-preview-ui)

---

## 1. 修改設計系統 (字體、大小與間距)

專案中所有的核心視覺設定都集中在 `constants/theme.ts`。這是最推薦的客製化起點，因為修改這裡會同時影響 Word 輸出的多個部分。

**檔案路徑**: `constants/theme.ts`

### 修改字體與大小
```typescript
export const FONT_SIZES = {
  BODY: 22,    // 內文字體 (11pt)
  H1: 32,      // 一級標題 (16pt)
  CODE: 18,    // 程式碼 (9pt)
  // ...
};
```

### 修改間距與佈局
您可以輕鬆調整標題前後段距或是區塊縮排：
```typescript
export const SPACING = {
  H1: { BEFORE: 480, AFTER: 240 },
  PARAGRAPH: { BEFORE: 200, AFTER: 200 },
};

export const LAYOUT = {
  INDENT: {
    CODE: 400, // 程式碼區塊左縮排
  },
  BORDER: {
    CODE: 6,   // 程式碼邊框粗細
  }
};
```

---

## 2. 調整 Word 輸出樣式

Word 的生成邏輯已經過函式化重構，每個 Markdown 區塊都有對應的 `createXXXX` 函式。

**檔案路徑**: `services/docxGenerator.ts`

如果您想修改特定區塊的細節（例如改變 Callout 的內距），只需修改對應的 Builder 函式：

```typescript
const createCallout = (content: string, type: BlockType): Paragraph => {
  // 修改這裡的樣式定義...
  return new Paragraph({
    children,
    shading: { fill: config.bg },
    border: { /* ... */ }
  });
};
```

---

## 3. 新增 Markdown 語法

如果您需要支援新的語法（例如：螢光筆標記 `==text==`），需要修改三個核心位置：

### 步驟 1: 定義樣式類型
在 `utils/styleParser.ts` 中新增類型與 Regex。

### 步驟 2: 實作 Word 輸出邏輯
在 `services/docxGenerator.ts` 的 `parseInlineStyles` 函數中加入 `InlineStyleType.HIGHLIGHT` 的處理邏輯。

### 步驟 3: 實作網頁預覽邏輯
**檔案路徑**: `components/editor/PreviewRenderers.tsx`

在 `RenderRichText` 元件中加入 React 渲染邏輯：
```typescript
case InlineStyleType.HIGHLIGHT:
  return <span key={i} className="bg-yellow-200">{segment.content}</span>;
```

---

## 4. 修改預覽介面 (Preview UI)

預覽區域的元件已拆分至 `components/editor/` 目錄下：

- **`EditorHeader.tsx`**: 頂部工具列。
- **`EditorPane.tsx`**: 左側編輯器。
- **`PreviewPane.tsx`**: 右側預覽容器。
- **`PreviewRenderers.tsx`**: 具體的區塊渲染邏輯（標題、程式碼、表格等）。

預覽介面主要使用 **Tailwind CSS**。若要修改預覽效果，請編輯 `PreviewRenderers.tsx`。

---

## ❓ 常見問題

**Q: 為什麼修改了 `theme.ts` 的顏色，網頁預覽沒有變？**
A: `theme.ts` 主要控制 **Word 匯出** 的視覺數值。網頁預覽主要依賴 `PreviewRenderers.tsx` 中的 Tailwind CSS class。若要追求完全的 WYSIWYG，建議兩者同步修改。

**Q: 如何新增自定義的頁面尺寸？**
A: 請修改 `hooks/useMarkdownEditor.ts` 中的 `PAGE_SIZES` 常數。

---

Happy Writing & Coding! 🚀