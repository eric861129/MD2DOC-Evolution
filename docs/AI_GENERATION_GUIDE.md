# MD2DOC-Evolution AI Generation Guide v2

這份文件定義 AI 將內容整理成 MD2DOC-Evolution Markdown 的公開契約。網站 Header 的「AI 轉稿提示」會從 `services/syntaxSpec.ts` 動態產生相同規則，並由 golden test 鎖定章節順序與關鍵約束。

## 兩種模式

### 轉換既有稿件

- 保留原始事實、原意、程式碼、引用與來源連結。
- 可重整標題、清單、表格、Callout 與對話，但不能把推測寫成事實。
- 缺少資料時標示「待補」。

### 建立新稿初稿

- 輸入書稿主題、目標讀者、章節構想與可信素材。
- 未提供的事實必須標示「待補」。
- 不得假造作者經驗、數字、引用、研究結果或產品能力。

## 不可違反的輸出契約

1. 只輸出「轉換後的 Markdown 原稿」。
2. 不輸出分析、前言、結語或 Markdown 外層包裝。
3. 不把整份答案放進 ` ```markdown ` code fence。
4. 使用繁體中文；保留必要英文術語、API、程式碼、檔名、指令與來源。
5. 不捏造事實。
6. 不輸出頁碼、空白頁、分節符號，或用大量空行預測 Word 分頁。

## 文件順序

```markdown:no-ln
---
title: "書稿標題"
author: "作者"
header: true
footer: true
---

[TOC]

[CHAPTER]
number: "01"
title: "章節標題"
summary: "本章摘要。"
goals:
  - "本章目標。"
[/CHAPTER]

# 文件主標題

## 第一節

正文。
```

順序固定為 Frontmatter、`[TOC]`、`[CHAPTER]`、H1、H2/H3 與正文。只使用 H1～H3。

## Profile 與換頁責任

- AI 只整理內容，不在 Frontmatter 偽造 Profile。
- `technical-legacy`、`publisher-exact`、`publisher-narrow`、`publisher-binding` 由使用者匯出前選擇。
- `[CHAPTER]` 是章首頁語意，不代表 AI 能預測 Word 的實際頁面。
- 目錄是 Word 欄位，匯出後由使用者更新。
- 不自行插入手動換頁。精準齊頁在 Word 使用「與下段同頁」、「段中不分頁」、「段前分頁」或必要分節設定。

## 正式支援語法

### 文件與標題

- Frontmatter：`title`、`author`、`header`、`footer`。
- 目錄：`[TOC]`。
- 章首頁：`[CHAPTER]` YAML block。
- 標題：`#`、`##`、`###`。

### 清單與段落

- 無序清單：`- 項目`。
- 編號清單：`1. 步驟`。
- 待辦清單：`- [ ]`、`- [x]`；DOCX 顯示 `☐／☒`，不使用黑點。
- 引用：`> 引用內容`。
- 分隔線：`---`。

### 程式碼與圖表

- 程式碼：三個反引號加語言，可加 `:ln` 或 `:no-ln`。
- Mermaid：` ```mermaid `。
- 表格：GitHub Flavored Markdown table。

### Callout

只支援：

```markdown:no-ln
> [!NOTE]
> 補充資訊

> [!TIP]
> 實作技巧

> [!WARNING]
> 可能失敗

> [!IMPORTANT]
> 關鍵要求

> [!CAUTION]
> 資料或實體風險
```

不要自行發明新標籤，也不要嵌套 Callout。

### 角色對話

```markdown:no-ln
角色 ":: 左側對話
角色 ::" 右側對話
角色 :": 置中系統訊息
```

角色名稱與內容會在 Word 分行顯示。不要加 `-` 模擬角色，否則會變成真正的清單。

### 圖片、連結與 QR

- 圖片：`![說明](image-id-or-url)`。
- 一般連結：`[公開文件](https://example.com/docs)`，保持 hyperlink。
- 紙本重要入口：`[QR:公開下載頁](https://example.com/download)`，必須獨占一行。
- 不得把所有 hyperlink 批次轉成 QR。

### 行內樣式

- 粗體：`**重點**`
- 斜體：`*術語*`
- 底線：`<u>人工確認</u>`
- 行內 code：反引號包覆
- 實體按鍵：`[Ctrl]`、`[Enter]`

`<u>` 是唯一正式支援的 HTML-like inline 語法。不要輸出 `<br>`、`<div>`、`<span>`、`<table>` 或其他 HTML。

## 內容重整規則

1. 不改變原意，不刪除限制與失敗條件。
2. 不確定資料標示「待補」。
3. 程式碼、CLI、API、檔名與設定值保留原文。
4. 比較、欄位與規格可改成 Markdown table。
5. 只有真正項目使用 `-`，步驟使用 `1.`，待辦使用 `- [ ]`。
6. 一般連結保持 hyperlink，QR 只用於紙本掃描。
7. 中文標點、專有名詞與中英文空格全文一致。

## Silent quality check

AI 回答前應自行確認：

- 只有 Markdown 原稿，沒有外層 code fence。
- Frontmatter 位於第一行且至少有 title、author、header、footer。
- `[TOC]`、`[CHAPTER]`、H1、正文順序正確。
- 沒有 H4～H6。
- 程式碼有語言與適合的 `:ln`／`:no-ln`。
- Callout 只使用五種正式標籤。
- Mermaid 與表格語法完整。
- 只有真正清單使用清單符號。
- 沒有虛構 Profile、頁碼、空白頁或手動換頁。
- 一般連結保持 hyperlink，QR 只用於重要紙本入口。
- 沒有字面上的反斜線加 n。

## 與網站一致性

- 單一語法規格：[`services/syntaxSpec.ts`](../services/syntaxSpec.ts)
- AI Prompt 產生器：[`services/aiPrompt.ts`](../services/aiPrompt.ts)
- Prompt golden contract：[`tests/golden/ai-prompt-v2.json`](../tests/golden/ai-prompt-v2.json)
- 完整中文範例：[`content/examples/complete.zh.md`](../content/examples/complete.zh.md)
- 完整英文範例：[`content/examples/complete.en.md`](../content/examples/complete.en.md)
- Word 後製與換頁：[完整使用教學](USER_GUIDE.md)
