# 專案架構說明 (Architecture Guide)

## 🏗️ 系統概觀

**MD2DOC-Evolution** 是一個基於瀏覽器的單頁應用程式 (SPA)，完全在客戶端運行。它不依賴後端伺服器進行檔案轉換，確保了資料的隱私性與處理速度。

### 技術棧 (Tech Stack)
- **核心框架**: React 19, TypeScript
- **建置工具**: Vite 6
- **Markdown 解析**: regex-based (舊版) / AST-based (新版, migrating to `marked`)
- **Word 生成**: `docx` library
- **圖表渲染**: `mermaid`
- **樣式管理**: Tailwind CSS + 集中式 Word Theme/Profile tokens

---

## 📂 目錄結構 (Directory Structure)

```text
/
├── components/          # React UI 元件
│   ├── editor/          # 編輯器核心元件 (輸入區、預覽區、Mermaid 渲染)
│   └── ui/              # 通用 UI 元件 (按鈕、下拉選單)
├── constants/           # 全域常數設定
│   └── theme.ts         # Word 樣式定義 (字體、顏色、間距)
├── contexts/            # React Context (EditorContext)
├── hooks/               # Custom Hooks (useMarkdownEditor, useDarkMode)
├── services/            # 核心邏輯層
│   ├── docx/            # Word 生成邏輯
│   │   ├── builders/    # 各種 Markdown 元素的 Word 建構器 (Paragraph, Table...)
│   │   ├── layout/      # 紙張、邊界、鏡像與內容區幾何
│   │   ├── profiles/    # technical-legacy 與 publisher 樣式
│   │   ├── postprocess.ts # OOXML 後處理
│   │   ├── quality.ts   # DOCX package inspection
│   │   └── registry.ts  # Builder 註冊表
│   ├── parser/          # Markdown 解析器 (AST)
│   ├── docxGenerator.ts # Word 生成入口
│   └── markdownParser.ts# 舊版 Regex 解析器 (維護中)
├── scripts/qa/          # 公開 fixture、LibreOffice render 與視覺比較
├── tests/visual/        # 固定環境審查後的 PNG baseline
├── utils/               # 工具函式
└── samples/             # 範例檔案
```

---

## 🔄 核心工作流 (Core Workflows)

### 1. Markdown 解析流程 (Parsing)

目前系統處於從 Regex 解析過渡到 AST (Abstract Syntax Tree) 解析的階段。

- **輸入**: 使用者在編輯器輸入的 Markdown 字串。
- **處理**: 
    1. `services/markdownParser.ts` (Legacy): 使用正則表達式逐行掃描，識別標題、列表、程式碼區塊。優點是容錯率高，缺點是難以處理複雜巢狀結構。
    2. `services/parser/ast.ts` (Modern): 基於 `marked` 庫將 Markdown 轉換為 Token Stream，再轉換為專案內部的 `ParsedBlock` 結構。
- **輸出**: `ParsedBlock[]` 陣列，每個 Block 代表一個文檔節點（如段落、表格、圖片）。

### 2. Word 文件生成流程 (Generation)

文件生成採用 **Registry Pattern** 與 **Builder Pattern**，以保持程式碼的模組化與可擴充性。

完整管線是：

```text
Markdown → ParsedBlock → Layout/Profile → DOCX Builders → Packer
→ OOXML Post-process → Package Inspection → Download
```

1. `services/markdownParser.ts` 產生 `ParsedBlock[]` 與 Frontmatter metadata。
2. `services/docx/layout/resolve.ts` 把紙張、邊界、gutter 與 Profile 選擇解析成共用幾何；Preview 與 DOCX 使用同一份結果。
3. `services/docx/profiles/` 提供樣式 token。`technical-legacy` 保留既有行為，三種 publisher Profile 共用出版社樣式。
4. `services/docx/registry.ts` 依 Block 類型把內容交給 `services/docx/builders/`，建立段落、章首頁、TOC、表格、Callout、對話、圖片與明確 QR 等 DOCX 節點。
5. `docx` 的 `Packer` 先產生 OPC package。
6. `services/docx/postprocess.ts` 以 deterministic OOXML 後處理補上鏡像邊界、gutter 與必要的 package 設定；出版社 Profile 另把段落另起頁轉成顯式分頁符，並移除會顯示黑方塊的非列印分頁屬性。
7. `services/docx/quality.ts` 檢查 relationship、content type、媒體、副檔名與必要部件。任何 error 都會阻止下載；warning 會回報給匯出流程。
8. 只有通過 inspection 的 Blob 才交由瀏覽器下載。

版型與語法細節請見 [出版社版型與語法指南](PUBLISHER_PROFILE.md)。

### 3. Mermaid 圖表處理

Mermaid 圖表的轉換是本專案的技術難點之一，因為 Word 不支援直接渲染 Mermaid 代碼。

- **預覽階段**: 使用 `mermaid.js` 在瀏覽器 DOM 中即時渲染 SVG。
- **匯出階段**:
    1. 系統會在背景建立一個隱藏的 Canvas。
    2. 將 Mermaid 生成的 SVG 繪製到 Canvas 上。
    3. 將 Canvas 轉換為 Base64 PNG 圖片數據。
    4. 將圖片數據嵌入到 Word 文件中。

---

## 🧩 擴充性設計 (Extensibility)

### 新增語法支援
若要支援新的 Markdown 語法（例如：數學公式）：

1. **Parser 層**: 在 `services/parser/ast.ts` 中擴充 Token 解析邏輯，識別新語法並生成對應的 `ParsedBlock`。
2. **Builder 層**: 在 `services/docx/builders/` 下建立新的 Builder (如 `MathBuilder.ts`)，實作轉換為 Word 物件的邏輯。
3. **註冊**: 在 `services/docx/builders/index.ts` 中註冊新的 Builder。

### 修改樣式
Word 輸出基礎 token 集中於 `constants/theme.ts`，Profile 映射位於 `services/docx/profiles/`。版面幾何屬於 `services/docx/layout/`，不要在 Builder 內加入新的紙張或邊界魔術數字。

---

## 🧪 測試策略

專案使用 `vitest` 進行單元測試。

- **Parser 測試**: 驗證 Markdown 字串是否正確轉換為 JSON 結構。
- **Generator／package 測試**: 解開 DOCX 後驗證實際 OOXML、樣式、relationship、媒體與幾何。
- **視覺回歸**: 公開 fixture 在固定 LibreOffice／Poppler／字型環境渲染成 PNG，再以唯讀 baseline 比較。

```bash
npm run test
```
