# MD2DOC-Evolution | v2.0.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/eric861129/MD2DOC-Evolution)
[![CI](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml/badge.svg)](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml)

[中文](README.md) | [English](README_EN.md)

MD2DOC-Evolution 是開源的 Markdown → Word DOCX 出版工作台，為技術書作者、工程師與內容團隊而設計。它把熟悉的 Markdown 寫作流程，轉成可交給編輯、出版社或客戶修訂的 Word 書稿。

線上試用：[https://huangchiyu.com/MD2DOC-Evolution/](https://huangchiyu.com/MD2DOC-Evolution/)

> 專業工具台 UI 的右側採連續白底預覽，適合檢查內容結構與樣式；最終 Word 分頁仍以實際 DOCX、字型與 Word 版本為準。

## v2.0.0 重點

- 出版版型：17.6 × 23.6 cm、A4、A5、B5、自訂紙張與自訂邊界。
- 常用邊界：1.27、1.50、2.00、2.54 cm、出版社精確邊界與鏡像裝訂。
- 三種新版 Profile：`publisher-exact`（預設）、`publisher-narrow`、`publisher-binding`。
- 出版社排版：角色名稱與內容分行、段落間距優化、待辦清單使用 `☐／☒`。
- 黑點治理：只有真正的無序清單會輸出 Word 項目符號；清單、對話與一般段落的語意分離。
- 連續預覽：右側使用單一白底內容流，不在瀏覽器假裝切 Word 頁面。
- 完整編輯工具：分組工具列、手機／桌機共用「插入」選單、Markdown 與圖片點選匯入。
- 雙語範例：中文／英文快速範例與完整功能稿，共用 Parser、Preview、DOCX 覆蓋契約。
- AI Prompt v2：提供「轉換既有稿件」與「建立新稿初稿」兩種模式。
- 教學中心：站內搜尋、章節導覽、Word 換頁專章，以及完整範例 Markdown／DOCX 下載。
- DOCX QA：檢查 package、relationship、media、content type、TOC、bookmark 與版面幾何。
- 安全邊界：遠端圖片需由使用者確認後才載入；Mermaid SVG、Canvas 與 YAML metadata 都有防護。

## 快速使用

1. 貼上 Markdown，或按「匯入」選擇 `.md`／圖片。
2. 從「範例稿件」載入快速或完整功能稿。
3. 按「版面設定」選擇 Profile、紙張與邊界。
4. 在連續預覽確認內容結構。
5. 下載 Markdown 備份與 DOCX。
6. 在 Word 按 `Ctrl + A`、`F9` 更新目錄與欄位，再完成最後換頁。

完整操作請看 [完整使用教學](docs/USER_GUIDE.md)；網站 Header 也有「使用教學」按鈕。

## 文件 Profile 與邊界

| Profile | 主要用途 | 17.6 × 23.6 cm 預設 |
| :--- | :--- | :--- |
| `publisher-exact` | 預設；對齊目前出版社幾何 | 上下 2.10、左右 2.30 cm |
| `publisher-narrow` | 增加內容寬度 | 四邊 1.27 cm |
| `publisher-binding` | 雙面印刷與裝訂 | 鏡像內外側 + 0.50 cm gutter |

不同 Profile 的內容寬度不同，因此不保證頁碼相同。詳細契約請看 [Publisher Profile](docs/PUBLISHER_PROFILE.md)。

## Supported Syntax

| 功能 | 語法 | 輸出行為 |
| :--- | :--- | :--- |
| Frontmatter | `---` YAML block | `title`、`author`、`header`、`footer` 等 metadata |
| 目錄 | `[TOC]` | Publisher Profile 產生 Word TOC field |
| 章首頁 | `[CHAPTER]` YAML block | 章號、標題、摘要、圖片與目標 |
| 標題 | `#` 到 `###` | H1 到 H3 |
| 無序／編號清單 | `- item` / `1. item` | Word 原生項目符號或編號 |
| 待辦清單 | `- [ ]` / `- [x]` | `☐／☒`，不產生清單黑點 |
| 引用／分隔線 | `> quote` / `---` | 引用段落與水平線 |
| 程式碼 | <code>```ts:ln</code> / <code>```json:no-ln</code> | 語言標籤與行號開關 |
| Mermaid | <code>```mermaid</code> | Preview 與 DOCX 轉成圖 |
| Callout | `NOTE` / `TIP` / `WARNING` / `IMPORTANT` / `CAUTION` | 五種出版提示區塊 |
| 對話 | `角色 "::` / `角色 ::"` / `角色 :":` | 左、右、置中；角色名稱獨立一行 |
| 表格 | Markdown table | Word 固定幾何表格 |
| 圖片 | `![alt](image-id-or-url)` | 匯入圖片或 Markdown 圖片 |
| 連結 | `[text](url)` | 保持一般 hyperlink |
| 明確 QR | `[QR:標籤](URL)` | 只對重要紙本入口產生 QR |
| 行內格式 | `**粗體**`、`*斜體*`、`<u>底線</u>`、行內 code、`[Ctrl]` | 出版用行內樣式 |

語法、Slash command、快捷工具、AI、範例與文件覆蓋由 [單一語法規格](services/syntaxSpec.ts) 管理。

## 範例稿件

四份網站範例的來源都放在 [`content/examples`](content/examples)：

- [中文快速範例](content/examples/quick.zh.md)
- [中文完整功能稿](content/examples/complete.zh.md)
- [English quick example](content/examples/quick.en.md)
- [English complete manuscript](content/examples/complete.en.md)

公開 DOCX fixture 由中文完整功能稿產生，不再維護第二份容易漂移的測試稿。

## AI Assisted Generation

Header 的「AI 轉稿提示」提供兩種 Prompt v2：

- 轉換既有稿件：保留來源事實、程式碼與引用，只調整結構。
- 建立新稿初稿：依主題、讀者與可信素材建立初稿，未知資訊標示「待補」。

兩種 prompt 都涵蓋章首頁、五種 callout、明確 QR、Profile 與換頁邊界；只對重要紙本連結使用 QR，一般 Markdown 連結保持 hyperlink。AI 只整理內容，不決定紙張、邊界、頁碼或最終換頁。

完整契約：[AI Generation Guide](docs/AI_GENERATION_GUIDE.md)

## Documentation

- [完整使用教學](docs/USER_GUIDE.md)：網站操作、語法、版型、Word 後製與交付檢查。
- [Project Overview](docs/PROJECT_OVERVIEW.md)：定位、工作流與能力邊界。
- [AI Generation Guide](docs/AI_GENERATION_GUIDE.md)：AI Prompt v2 轉稿規則。
- [Publisher Profile](docs/PUBLISHER_PROFILE.md)：紙張、邊界、裝訂、樣式與 Word 契約。
- [Customization](docs/CUSTOMIZATION.md)：新增 Profile、紙張、邊界與樣式的安全做法。
- [Architecture](docs/ARCHITECTURE.md)：Parser、Preview、DOCX 與 QA 架構。
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)：本機環境、測試與驗收。

## 現有圖片說明

![歷史角色對話功能示意](docs/images/MD2DOC-角色對話-GIF.gif)

上方 GIF 與 `docs/images/1.jpg`～`8.jpg` 是早期功能示意，保留作為歷史視覺紀錄；目前版面、連續預覽、Profile 與教學中心請以[線上站台](https://huangchiyu.com/MD2DOC-Evolution/)為準。

最新公開範例 DOCX：[samples/範例Word.docx](samples/範例Word.docx)

## 能力邊界與隱私

- 轉換主要在瀏覽器本機完成，專案沒有書稿上傳 API。
- 遠端圖片 URL 只有在使用者按下「載入遠端圖片」後才會發出請求，並使用 `no-referrer`；字型、部署平台或使用者另外使用的 AI 服務仍可能產生第三方網路請求。
- 右側不是 Word 分頁模擬器；頁數會受 Word、字型、印表機與圖片影響。
- TOC 欄位、奇偶頁分節、跨頁表格、索引、腳註與出版社巨集可能需要 Word 後製。
- 使用 AI 前請移除機密、個資與未公開商業內容。

## Local Development

需求：

- Node.js 20.19+（20.x）、22.12+（22.x），或 24.0+
- npm

```bash
git clone https://github.com/eric861129/MD2DOC-Evolution.git
cd MD2DOC-Evolution
npm install
npm run dev
```

本機站台：

```text
http://localhost:3000/MD2DOC-Evolution/
```

## Verification

```bash
npm run verify
npm run qa:acceptance
npm run qa:word
```

`npm run verify` 依序執行 TypeScript、Vitest 與 production build。`qa:acceptance` 由完整公開範例產生三種出版社版型並檢查 OOXML；`qa:word` 以隔離 Word 365 worker 更新欄位、檢查清單與黑點標記並匯出 PDF。LibreOffice 視覺回歸需要另外確認本機安裝環境，不能取代 Word 365 最終檢查。

## Tech Stack

- React 19、TypeScript、Vite 6
- Tailwind CSS
- `marked`、`docx`、Mermaid、QR Code
- Vitest、Testing Library、JSZip

## Contributing

歡迎 issue、建議與 PR。送出前請執行：

```bash
npm run verify
```

本次開發經使用者明確要求直接在 `main` 完成；一般貢獻仍應依儲存庫實際 branch protection 與 PR 規則執行。

## License

MIT License. See [LICENSE](LICENSE).
