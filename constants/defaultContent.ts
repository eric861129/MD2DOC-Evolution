/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

// Use a variable for backticks to avoid escaping hell in template literals
const BT = "`";

export const INITIAL_CONTENT_ZH = `# 技術書稿排版範例樣式表

[TOC]
- 第一章 基礎文字與段落樣式 1
- 第二章 特殊文字樣式展示 2
- 第三章 角色對話框展示 3
- 第四章 程式碼區塊樣式 4
- 第五章 特殊提醒與警告 5
- 第六章 表格與圖片支援 6

## 1. 基礎文字與段落樣式

這是一段標準的正文。我們支援多種行內樣式，例如 **粗體強調** 以吸引讀者注意。當提到程式碼變數時，可以使用 ${BT}inline code${BT} 樣式。

對於書籍介面的描述，我們設計了特殊的括號樣式：點擊 【確定】 按鈕後即可完成操作。這在 Word 匯出後也會保持加粗與特殊視覺感。

---

### 1.1 列表測試

- 第一項重點內容
- 第二項重點內容，包含 ${BT}行內程式${BT}
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

${BT}${BT}${BT}typescript
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
${BT}${BT}${BT}

---

## 5. 特殊提醒與警告 (Callouts)

> [!TIP]
> **提示 (Tip)**：通常用於分享小撇步或最佳實踐。在 Word 中會以實線邊框標註。

> [!NOTE]
> **筆記 (Note)**：用於補充背景知識。網頁預覽會呈現斜體效果，Word 中則使用虛線邊框區隔。

> [!WARNING]
> **警告 (Warning)**：非常重要的注意事項。在 Word 中會使用最粗的實線邊框，確保讀者不會遺漏。

---

## 6. 表格與圖片支援

### 6.1 表格範例 (自動識別)

| 功能特姓 | 支援狀況 | 備註說明 |
| --- | --- | --- |
| 粗體樣式 | ✅ 支援 | 使用 ** 星號包覆 |
| 表格排版 | ✅ 支援 | 自動生成格線 |
| 轉檔引擎 | 🚀 快速 | 純前端運算 |

### 6.2 圖片插入指引

目前支援標準 Markdown 圖片語法，但僅供寫作參考：

${BT}![圖片描述](https://example.com/image.jpg)${BT}

> [!NOTE]
> **圖片匯出注意**：由於瀏覽器安全性限制 (CORS)，直接匯出包含網路圖片的 Word 檔可能會失敗或無法顯示。
> 建議在 Markdown 中僅標示圖片位置，匯出 Word 後再手動置入高畫質圖片以確保最佳印刷品質。
`;

export const INITIAL_CONTENT_EN = `# Technical Manuscript Style Guide

[TOC]
- Chapter 1: Basic Text & Paragraphs 1
- Chapter 2: Special Text Styles 2
- Chapter 3: Chat Dialogues 3
- Chapter 4: Code Blocks 4
- Chapter 5: Callouts (Tips & Warnings) 5
- Chapter 6: Tables & Images 6

## 1. Basic Text & Paragraphs

This is a standard paragraph. We support various inline styles, such as **Bold Emphasis** to attract the reader's attention. When referring to code variables, you can use the ${BT}inline code${BT} style.

For describing user interfaces (UI), we have designed special bracket styles: Click the 【Confirm】 button to complete the operation. This will remain bold and visually distinct after exporting to Word.

---

### 1.1 List Testing

- First key point.
- Second key point, containing ${BT}inline code${BT}.
- Third point, testing the alignment of wrapped text.

## 2. Special Text Styles

This tool supports various text formats required for professional publishing. Please refer to the examples below:

- **Bold**: Used for emphasizing keywords, e.g., **Vibe Coding**.
- *Italic*: Used for *definitions* or *technical terms*. It will appear as dark blue italic text in the exported Word doc.
- <u>Underline</u>: Used for <u>hyperlinks</u> or where special underlining is needed.
- UI Button: Please click 【Settings】 > 【Advanced Options】 to adjust.
- Shortcut: Press [Ctrl] + [S] to save the file, or use [Cmd] + [P] to print.
- Books/Projects: Refer to the concept in 『Clean Code』 or the 『BookPublisher』 project.

---

## 3. Chat Dialogues (Side-by-Side Alignment)

User: Hey Gemini, please show me the layout effect of the chat dialogue in this app.

AI: No problem! In this system, User dialogues are displayed on the right with a dashed border, while AI responses are on the left with a dotted border and a light gray background. This layout is perfect for "Scenario Simulations" or Q&A sections in technical books.

User: That's awesome!

---

## 4. Code Blocks

Below is a standard code block. When exported to Word, it will automatically have a thin border, light gray background, and use a monospaced font (Consolas).

${BT}${BT}${BT}typescript
interface BookConfig {
  title: string;
  author: string;
  publishDate: Date;
}

const myBook: BookConfig = {
  title: "Vibe Coding Guide",
  author: "ChiYu",
  publishDate: new Date()
};
${BT}${BT}${BT}

---

## 5. Callouts (Tips & Warnings)

> [!TIP]
> **Tip**: Usually used for sharing tips or best practices. It will be marked with a solid border in Word.

> [!NOTE]
> **Note**: Used for supplementing background knowledge. It appears italicized in the web preview and uses a dashed border in Word.

> [!WARNING]
> **Warning**: Important notices. In Word, it uses the thickest solid border to ensure the reader doesn't miss it.

---

## 6. Tables & Images

### 6.1 Table Example

| Feature | Status | Note |
| --- | --- | --- |
| Bold Style | ✅ Supported | Use ** asterisks |
| Tables | ✅ Supported | Auto grid generation |
| Engine | 🚀 Fast | Pure frontend |

### 6.2 Image Insertion Guide

Standard Markdown image syntax is supported, but primarily for writing reference:

${BT}![Image Description](https://example.com/image.jpg)${BT}

> [!NOTE]
> **Image Export Notice**: Due to browser security restrictions (CORS), directly exporting Word files with web images might fail or not display.
> It is recommended to use placeholders in Markdown and manually insert high-quality images in Word after export for best printing quality.
`;