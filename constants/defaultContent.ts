/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

export const INITIAL_CONTENT = `# 技術書稿排版範例樣式表

## 1. 基礎文字與段落樣式

這是一段標準的正文。我們支援多種行內樣式，例如 **粗體強調** 以吸引讀者注意。當提到程式碼變數時，可以使用 \`inline code\` 樣式。

對於書籍介面的描述，我們設計了特殊的括號樣式：點擊 【確定】 按鈕後即可完成操作。這在 Word 匯出後也會保持加粗與特殊視覺感。

---

### 1.1 列表測試

- 第一項重點內容
- 第二項重點內容，包含 \`行內程式\`
- 第三項內容，測試自動換行的對齊效果

## 2. 特殊文字樣式展示

本工具支援多種專業出版需要的文字格式，請參考以下範例：

- **粗體 (Bold)**：用於強調關鍵字，例如 **Vibe Coding**。
- *斜體 (Italic)*：用於 *專有名詞定義* 或 *英文術語*。匯出 Word 時會呈現深藍色斜體。
- <u>底線 (Underline)</u>：用於 <u>超連結文字</u> 或需要特別畫線的地方。
- UI 按鈕：請點擊 【設定】 > 【進階選項】 進行調整。
- 快捷鍵：按下 [Ctrl] + [S] 可以儲存檔案，或使用 [Cmd] + [P] 列印。
- 書籍/專案：參考『Clean Code』一書中的概念，或是『BookPublisher』專案。

---

## 3. 角色對話框展示 (左右對齊效果)

User：嘿 Gemini，請幫我示範一下這個 APP 的對話框排版效果。

AI：沒問題！在這個系統中，User 的對話會靠右側顯示，並使用虛線邊框；而 AI 的回覆則會靠左側顯示，搭配點狀邊框與淺灰色背景。這種排版非常適合技術書籍中的「情境模擬」或「問答環節」。

User：原來阿！

---

## 4. 程式碼區塊樣式

下面展示的是標準的程式碼區塊，匯出至 Word 時會自動加上細邊框、淺灰背景，並使用等寬字體 (Consolas)。

\`\`\`typescript
interface BookConfig {
  title: string;
  author: string;
  publishDate: Date;
}

const myBook: BookConfig = {
  title: "Vibe Coding 實戰指南",
  author: "ChiYu",
  publishDate: new Date()
};
\`\`\`

---

## 5. 特殊提醒與警告 (Callouts)

> [!TIP]
> **提示 (Tip)**：通常用於分享小撇步或最佳實踐。在 Word 中會以實線邊框標註。

> [!NOTE]
> **筆記 (Note)**：用於補充背景知識。網頁預覽會呈現斜體效果，Word 中則使用虛線邊框區隔。

> [!WARNING]
> **警告 (Warning)**：非常重要的注意事項。在 Word 中會使用最粗的實線邊框，確保讀者不會遺漏。

---

## 6. 多層級標題測試

### 5.1 三級標題範例
這裡是三級標題下的文字，匯出時會自動加上底部的裝飾線或特定的縮排間距。

## 7. 表格與圖片支援

### 7.1 表格範例 (自動識別)

| 功能特姓 | 支援狀況 | 備註說明 |
| --- | --- | --- |
| 粗體樣式 | ✅ 支援 | 使用 ** 星號包覆 |
| 表格排版 | ✅ 支援 | 自動生成格線 |
| 轉檔引擎 | 🚀 快速 | 純前端運算 |

### 7.2 圖片插入指引

目前支援標準 Markdown 圖片語法，但僅供寫作參考：

\`![圖片描述](https://example.com/image.jpg)\`

> [!NOTE]
> **圖片匯出注意**：由於瀏覽器安全性限制 (CORS)，直接匯出包含網路圖片的 Word 檔可能會失敗或無法顯示。
> 建議在 Markdown 中僅標示圖片位置，匯出 Word 後再手動置入高畫質圖片以確保最佳印刷品質。
`