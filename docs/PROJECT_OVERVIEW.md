# MD2DOC-Evolution 專案概觀

## 產品定位

MD2DOC-Evolution 是面向技術書作者、工程師與內容團隊的 Markdown → Word DOCX 出版工作台。它的目標不是取代 Word 排版軟體，而是把「可版本控制的內容來源」穩定轉成「可由編輯繼續修訂的出版級 Word 書稿」。

核心價值：

1. 作者用 Markdown 專注內容與結構。
2. Profile 集中管理紙張、邊界、裝訂與樣式。
3. Parser、Preview、DOCX 與文件使用同一份語法契約。
4. 匯出後保留 Word 的可編輯性、目錄欄位與出版社後製空間。
5. 透過 OOXML 自動測試與 Word 人工驗收，降低格式回歸。

## 解決的問題

- 工程師使用 Markdown，出版社通常以 Word 進行審稿與修訂。
- 程式碼、Mermaid、Callout、表格、QR 與角色對話很難靠複製貼上維持一致。
- 紙張、邊界、裝訂與字型不同時，單純的 HTML 預覽無法代表 Word 分頁。
- Word 的清單屬性若誤套在一般段落，開啟格式標記時可能看見無效黑點或黑方塊。
- 範例、AI prompt、網站按鈕與 GitHub 文件若分開維護，語法很容易漂移。

## 現行工作流

```text
Markdown / images
  → AST Parser
  → ParsedBlock
  → continuous Preview
  → Layout + Profile
  → DOCX builders
  → OOXML post-process
  → package inspection
  → editable Word manuscript
  → human pagination pass
```

## 主要能力

### 出版版型

- 17.6 × 23.6 cm 技術書、A4、A5、B5 與自訂尺寸。
- 1.27、1.50、2.00、2.54 cm 常用邊界。
- 出版社精確邊界：上下 2.10、左右 2.30 cm。
- 鏡像內外側邊界與 gutter。
- `publisher-exact`（預設）、`publisher-narrow`、`publisher-binding` 三種新版 Profile。

### 出版內容

- Frontmatter、Word TOC field、章首頁與 H1～H3。
- 無序、編號、待辦清單、引用與水平分隔線。
- 程式碼行號、語言標籤、Mermaid、表格、圖片與明確 QR。
- NOTE、TIP、WARNING、IMPORTANT、CAUTION。
- 左側、右側、置中角色對話；角色名稱與內容在 Word 中分行。
- 一般連結保持 hyperlink，只有 `[QR:標籤](URL)` 產生 QR。

### 作者工作台

- 連續白底預覽，不在瀏覽器切假頁。
- 分組桌機工具列與跨裝置「插入」選單。
- 點選或拖放 Markdown／圖片。
- 中文與英文快速範例、完整功能稿。
- AI Prompt v2 兩種使用情境。
- 站內教學中心、搜尋、章節導覽與範例下載。

### 品質門檻

- 語法覆蓋矩陣檢查 Slash command、快捷操作、AI、範例與文件。
- Parser、Preview、DOCX component、OOXML package 與大稿效能測試。
- relationship、media、content type、TOC、bookmark 與版面幾何檢查。
- 公開星圖工坊 fixture，不使用作者私稿作為公開測試資料。

## 設計原則

### 單一語法來源

`services/syntaxSpec.ts` 宣告每項功能的狀態與覆蓋。編輯器命令、AI prompt、範例測試與文件測試都應從此契約驗證，不自行發明第二套語法。

### 內容結構與最終分頁分離

Markdown 描述章節、段落、清單與媒體。紙張和邊界由 Layout/Profile 決定；最終頁碼、奇偶頁分節與少數換頁點由 Word 後製決定。這條界線能避免 AI 或作者用大量空行推版。

### 只有真正清單才有黑點

無序清單才套 Word bullet numbering。待辦清單輸出 `☐／☒`，對話、標題、一般段落與 Callout 不使用清單屬性。

### 可編輯輸出優先

DOCX 不是 PDF 截圖容器。標題、清單、表格、TOC、超連結與段落盡可能保留為 Word 可編輯結構；Mermaid、QR 與圖片才使用媒體。

## 能力邊界

- 連續 Preview 只能驗證比例與設計語言，不能保證 Word 精確分頁。
- 不同 Word、字型、印表機與圖片尺寸可能產生不同頁數。
- Word 原生目錄必須更新欄位後才得到正確頁碼。
- 複雜索引、交叉引用、腳註、出版社巨集與進階跨頁表格仍需 Word 後製。
- LibreOffice 適合固定環境回歸，但不能替代出版社以 Word 365 進行最終檢查。

## 隱私模型

本專案沒有書稿上傳 API，主要轉換在瀏覽器本機完成。不過外部圖片 URL、網頁字型、部署平台或使用者自行選擇的 AI 服務，仍可能產生第三方請求。機密、個資或未公開內容在送往 AI 之前必須先移除或依組織政策處理。

## 文件入口

- [完整使用教學](USER_GUIDE.md)
- [出版社 Profile](PUBLISHER_PROFILE.md)
- [AI 轉稿規格](AI_GENERATION_GUIDE.md)
- [客製化指南](CUSTOMIZATION.md)
- [架構說明](ARCHITECTURE.md)
- [開發指南](DEVELOPMENT_GUIDE.md)
