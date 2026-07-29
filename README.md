# MD2DOC-Evolution | v1.5.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/eric861129/MD2DOC-Evolution)
[![CI](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml/badge.svg)](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml)

[中文](README.md) | [English](README_EN.md)

![功能演示](docs/images/MD2DOC-角色對話-GIF.gif)

MD2DOC-Evolution 是一個開源的 Markdown 到 Word DOCX 技術書稿工作台，專為技術書作者、工程師與內容創作者設計。它把工程師熟悉的 Markdown 寫作流程，轉成出版社、審稿或交付常用的 Word 書稿格式。

線上試用：[https://huangchiyu.com/MD2DOC-Evolution/](https://huangchiyu.com/MD2DOC-Evolution/)

## v1.5.0 Highlights

- 紙張與邊界：支援 17.6 × 23.6 cm、A4、A5、B5、自訂紙張，以及常用／自訂邊界。
- 出版社 Profile：`publisher-exact` 對齊 17.6 × 23.6 cm、第七輪上下 2.10／左右 2.30 cm 契約，並提供 `publisher-narrow`、`publisher-binding`；預設仍為相容既有文件的 `technical-legacy`。
- 書稿級排版：出版社 Profile 的角色名稱與對話內容分行、清單符號嚴格隔離，並移除 Word 非列印分頁黑方塊標記。
- 雙面裝訂：支援鏡像邊界、內外側邊界與 gutter。
- 出版語法：新增 `[CHAPTER]` 章首頁、`[QR:標籤](URL)` 明確 QR，以及 `IMPORTANT`、`CAUTION` Callout。
- Word 結構：Publisher Profile 使用命名樣式、固定表格幾何、可更新 TOC 與章節 bookmark。
- OOXML QA：匯出前檢查 DOCX package、relationship、media 與 content type；公開 fixture 可在固定 LibreOffice／Poppler 環境進行 PNG 回歸。

既有的專業工具台 UI、共用 command model、AI Agent Prompt 與行動版 editor／preview 流程均維持相容。

## Supported Syntax

| 功能 | 語法 | 說明 |
| :--- | :--- | :--- |
| Frontmatter | `---` YAML block | 支援 `title`、`author`、`header`、`footer` 等 metadata |
| 目錄 | `[TOC]` | 可產生 Word 目錄區塊 |
| 章首頁 | `[CHAPTER]` YAML block | 支援章號、標題、摘要、圖片與本章目標 |
| 標題 | `#` 到 `###` | 對應 H1 到 H3 |
| 程式碼 | <code>```ts:ln</code> / <code>```json:no-ln</code> | 支援語言標籤與行號開關 |
| Mermaid | <code>```mermaid</code> | Preview 與 DOCX 匯出支援圖表 |
| Callout | `NOTE` / `TIP` / `WARNING` / `IMPORTANT` / `CAUTION` | 五種出版提示區塊 |
| 對話 | `User "::` / `AI ::"` / `System :":` | 支援左、右、置中對話泡泡 |
| 表格 | Markdown table | 匯出成 Word 表格 |
| 圖片 | `![alt](image-id-or-url)` | 支援拖放圖片與 Markdown 圖片語法 |
| 連結 | `[text](url)` | 保持一般 hyperlink |
| 明確 QR | `[QR:標籤](URL)` | 只對重要紙本入口產生 QR 區塊 |

## AI Assisted Generation

如果你要把既有筆記、逐字稿或草稿轉成 MD2DOC-Evolution 格式，可以點擊 Header 的 AI Prompt 按鈕，複製內建提示詞給 ChatGPT、Claude 或其他 AI Agent。

內建 prompt 會提供：

- GitHub repo 參考連結：`https://github.com/eric861129/MD2DOC-Evolution`
- Frontmatter、TOC、章首頁、標題、code block、五種 callout、table、dialogue 與明確 QR 的格式要求
- 只對重要連結使用 QR，一般 Markdown 連結保持 hyperlink
- 「只輸出 Markdown 原稿」的輸出契約
- 轉換前的 silent quality check

完整規格可參考：[AI Generation Guide](docs/AI_GENERATION_GUIDE.md)

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)：設計哲學與核心功能。
- [AI Generation Guide](docs/AI_GENERATION_GUIDE.md)：給 AI Agent 與使用者的格式轉換規則。
- [Publisher Profile](docs/PUBLISHER_PROFILE.md)：紙張、邊界、裝訂、出版社版型與出版語法。
- [Architecture](docs/ARCHITECTURE.md)：技術棧、目錄結構與核心工作流。
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)：開發環境、測試與除錯技巧。
- [Customization](CUSTOMIZATION.md)：版面、樣式與輸出格式調整方式。

## Sample Output

範例 Word 文件：

- [下載範例文件](samples/範例Word.docx)

<div align="center">
  <img src="docs/images/1.jpg" width="48%" alt="Cover and header" />
  <img src="docs/images/2.jpg" width="48%" alt="Chat dialogues" />
  <br/>
  <img src="docs/images/3.jpg" width="48%" alt="Callouts and styles" />
  <img src="docs/images/4.jpg" width="48%" alt="Code blocks" />
  <br/>
  <img src="docs/images/5.jpg" width="48%" alt="Tables and lists" />
  <img src="docs/images/6.jpg" width="48%" alt="Tables and lists" />
</div>

## Getting Started

### Requirements

- Node.js 20.19+（20.x）、22.12+（22.x），或 24.0+
- npm

### Local Development

```bash
git clone https://github.com/eric861129/MD2DOC-Evolution.git
cd MD2DOC-Evolution
npm install
npm run dev
```

本機開發站台：

```text
http://localhost:3000/MD2DOC-Evolution/
```

## Verification

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify
```

`npm run verify` 會依序執行 typecheck、unit/component tests 與 production build，GitHub Actions 也使用同一組驗證流程。

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS via `@tailwindcss/vite`
- docx
- Mermaid
- Vitest + Testing Library

## Contributing

歡迎 issue、建議與 PR。此專案目前保留 branch flow 規則：

- `main` 只接受 `dev` 或 `hotfix/*`
- `dev` 接受 `dev_feature_*`、`dev_refactor_*`、`dev_hotfix_*` 或 `hotfix/*`

送出 PR 前請先執行：

```bash
npm run verify
```

## License

MIT License. See [LICENSE](LICENSE) for details.
