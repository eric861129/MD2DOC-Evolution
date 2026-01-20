/**
 * MD2DOC-Evolution MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

// Use a variable for backticks to avoid escaping hell in template literals
const BT = "`";

export const INITIAL_CONTENT_ZH = `---
title: "MD2DOC-Evolution 使用手冊"
author: "MD2DOC-Evolution Team"
header: true
footer: true
---
# 技術書稿排版範例樣式表

[TOC]
- 第一章 基礎文字與段落樣式 1
- 第二章 特殊文字樣式展示 2
- 第三章 角色對話框展示 3
- 第四章 程式碼區塊樣式 4
- 第五章 特殊提醒與警告 5
- 第六章 表格與圖片支援 6
- 第七章 Mermaid 圖表支援 7


## 1. 基礎文字與段落樣式

這是一段標準的正文。我們支援多種行內樣式，例如 **粗體強調** 以吸引讀者注意。當提到程式碼變數時，可以使用 ${BT}inline code${BT} 樣式。

> [!TIP]
> **新功能：斜線指令**
> 現在您可以直接輸入 ${BT}/來選取指令，例如: ${BT}/table${BT} 插入表格，或 ${BT}/chat${BT} 插入對話框！

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
- **智慧連結 (Smart Links)**：[GitHub專案](https://github.com/eric861129/MD2DOC-Evolution) 會自動在 Word 中生成 QR Code。
- UI 按鈕：請點擊 【設定】 > 【進階選項】 進行調整。
- 快捷鍵：按下 [Ctrl] + [S] 可以儲存檔案，或使用 [Cmd] + [P] 列印。
- 書籍/專案：參考『Clean Code』一書中的概念，或是『MD2DOC-Evolution』專案。

---

## 3. 角色對話框展示 (多元對齊效果)

系統 :": 這是一個「置中」的對話框，適合用來顯示系統訊息或旁白說明。

Gemini ":: 嘿！我是 Gemini。這是一個「左側」對話框，我使用了 ${BT}"::${BT} 語法。你可以自定義任何角色名稱！

讀者 ::" 哇！這看起來很棒。我使用的是 ${BT}::"${BT} 語法，所以我的對話會靠右對齊。

---

## 4. 程式碼區塊樣式

### 4.1 預設樣式 (顯示行號)
這是最常用的形式，適合講解多行程式碼，右上角會自動顯示語言名稱：

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

### 4.2 強制隱藏行號 (純文字模式)
使用 ${BT}json:no-ln${BT} 或 ${BT}:plain${BT} 語法，適合短小的設定檔或不需要參照行號的範例：
${BT}${BT}${BT}json:no-ln
{
  "name": "md2doc-evolution",
  "version": "1.2.10",
  "private": true
}
${BT}${BT}${BT}

### 4.3 強制顯示行號
使用 ${BT}:ln${BT} 語法可強制開啟行號：

${BT}${BT}${BT}bash:ln
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
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
> **圖片匯出注意**：由於瀏覽器安全性限制 (CORS) ，直接匯出包含網路圖片的 Word 檔可能會失敗或無法顯示。
> 建議在 Markdown 中僅標示圖片位置，匯出 Word 後再手動置入高畫質圖片以確保最佳印刷品質。

## 7. Mermaid 圖表支援

我們支援直接使用 Mermaid 語法繪製圖表，並自動轉換為 Word 圖片：

${BT}${BT}${BT}mermaid
graph TD
    A[開始] --> B{是否有 Bug?}
    B -- Yes --> C[修復 Bug]
    C --> D[測試]
    D --> B
    B -- No --> E[發布 v1.2.10]
${BT}${BT}${BT}
`;

export const INITIAL_CONTENT_EN = `---
title: "MD2DOC-Evolution Guide"
author: "MD2DOC-Evolution Team"
header: true
footer: true
---
# Technical Manuscript Style Guide

[TOC]
- Chapter 1: Basic Text & Paragraphs 1
- Chapter 2: Special Text Styles 2
- Chapter 3: Chat Dialogues 3
- Chapter 4: Code Blocks 4
- Chapter 5: Callouts (Tips & Warnings) 5
- Chapter 6: Tables & Images 6
- Chapter 7: Mermaid Charts 7

## 1. Basic Text & Paragraphs

This is a standard paragraph. We support various inline styles, such as **Bold Emphasis** to attract the reader's attention. When referring to code variables, you can use the ${BT}inline code${BT} style.

> [!TIP]
> **New Feature: Slash Commands**
> You can now type ${BT}/${BT} to bring up the quick menu!
> Try typing ${BT}/table${BT} to insert a table or ${BT}/chat${BT} to insert a dialogue box.

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
- **Smart Links**: [GitHub Repo](https://github.com/eric861129/MD2DOC-Evolution) will automatically generate a QR Code in Word.
- UI Button: Please click 【Settings】 > 【Advanced Options】 to adjust.
- Shortcut: Press [Ctrl] + [S] can save the file, or use [Cmd] + [P] to print.
- Books/Projects: Refer to the concept in 『Clean Code』 or the 『MD2DOC-Evolution』 project.

---

## 3. Chat Dialogues (Multi-Alignment Support)

System :": This is a "Centered" dialogue box, perfect for system messages or narrations.

Gemini ":: Hey! I'm Gemini. This is a "Left-aligned" dialogue box using ${BT}"::${BT} syntax. You can customize any role name!

Reader ::" Awesome! This looks great. I'm using ${BT}::"${BT} syntax, so my dialogue is aligned to the right.

---

## 4. Code Blocks

### 4.1 Default Style (Line Numbers)
This is the most common format, suitable for multi-line code explanations. The language name appears in the top-right corner:

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

### 4.2 Plain Text Style (Hidden Line Numbers)
Use ${BT}json:no-ln${BT} or ${BT}:plain${BT} syntax. Ideal for short config files or examples where line numbers aren't needed:

${BT}${BT}${BT}json:no-ln
{
  "name": "book-publisher",
  "version": "1.2.10",
  "private": true
}
${BT}${BT}${BT}

### 4.3 Explicit Line Numbers
Although enabled by default, you can use ${BT}:ln${BT} to explicitly require line numbers:

${BT}${BT}${BT}bash:ln
# Install dependencies
npm install

# Run dev server
npm run dev
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

## 7. Mermaid Charts

We support rendering Mermaid charts directly and converting them to images in Word:

${BT}${BT}${BT}mermaid
graph TD
    A[Start] --> B{Is there a Bug?}
    B -- Yes --> C[Fix Bug]
    C --> D[Test]
    D --> B
    B -- No --> E[Release v1.2.10]
${BT}${BT}${BT}
`;
