# 開發指南 (Development Guide)

本指南旨在協助開發者快速上手 **MD2DOC-Evolution** 的開發環境，並理解日常開發流程。

## ⚙️ 環境建置 (Setup)

### 系統需求
- **Node.js**: v18.0.0 或更高版本 (建議使用 LTS)
- **套件管理器**: npm (預設) 或 yarn/pnpm

### 初次安裝
```bash
# Clone 專案
git clone MD2DOC-Evolution.git
cd BookPublisher_MD2Doc

# 安裝依賴
npm install
```

---

## 📜 可用腳本 (Scripts)

在 `package.json` 中定義了以下常用指令：

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev` | 啟動開發伺服器 (Vite)，預設 port 為 5173。支援 HMR (熱重載)。 |
| `npm run build` | 建置生產環境版本，產物位於 `dist/` 目錄。 |
| `npm run preview` | 在本地預覽 `dist/` 中的建置結果。 |
| `npm run test` | 執行單元測試 (Vitest)。 |
| `npm run verify` | 依序執行 typecheck、完整測試與 production build。 |
| `npm run qa:fixture` | 由公開「星圖工坊」Markdown 產生 publisher-exact DOCX。 |
| `npm run qa:render` | 以 LibreOffice 與 Poppler 產生 timestamp PDF／PNG。 |
| `npm run qa:baseline` | 經人工審查後逐檔更新視覺 baseline。 |
| `npm run qa:compare` | 比較最新 render 與 baseline，門檻為 1.5%。 |

---

## 🐛 除錯技巧 (Debugging)

### 1. Markdown 解析除錯
若發現轉檔結果不如預期，可以先檢查 Parser 的輸出。
在 `services/docxGenerator.ts` 中，可以加入 `console.log(blocks)` 來查看解析後的 AST 結構，確認是否在解析階段就發生錯誤。

### 2. Word 樣式除錯
Word 的樣式除錯較為困難。建議使用 `constants/theme.ts` 中的顏色變數進行視覺化除錯。例如，暫時將某個邊框設為紅色，以確認該樣式是否正確套用到目標元素上。

### 3. Mermaid 圖表問題
Mermaid 渲染失敗通常是因為語法錯誤或 SVG 轉換問題。
- 確認瀏覽器 Console 是否有 Mermaid 相關報錯。
- 檢查 `services/docx/builders/mermaid.ts` 中的 Canvas 繪製邏輯。

---

## 🧪 測試撰寫 (Testing)

我們使用 **Vitest** 進行測試。新增功能時，請務必新增對應的測試案例。

### 測試檔案位置
所有測試位於 `tests/` 目錄下：
- `tests/markdownParser.test.ts`: 測試解析邏輯。
- `tests/docxGenerator.test.ts`: 測試 Word 生成邏輯 (Snapshot Testing)。

### 執行特定測試
```bash
npx vitest tests/markdownParser.test.ts
```

### Publisher DOCX 視覺回歸

視覺 baseline 的固定環境如下：

- Windows 11
- LibreOffice 26.2.4.2
- Poppler 26.05.0
- Noto Sans TC 已安裝
- 110 DPI

渲染腳本只接受環境變數指定的明確執行檔，不會從模糊的 PATH 猜測工具：

```powershell
$env:SOFFICE_PATH = 'C:\Program Files\LibreOffice\program\soffice.exe'
$env:PDFTOPPM_PATH = 'C:\path\to\poppler\Library\bin\pdftoppm.exe'

npm run qa:fixture
npm run qa:render
```

`qa:fixture` 會明確建立 Node 所需的 XML／Blob runtime，並以本機 headless
Edge 或 Chrome 把 Mermaid 實際渲染成 PNG；如需指定瀏覽器，可設定
`MERMAID_BROWSER_PATH` 為明確的 `msedge.exe` 或 `chrome.exe`。

每次 `qa:render` 都會建立
`artifacts/docx-qa/renders/<timestamp>/`，使用獨立 LibreOffice
`UserInstallation`，先透過 UNO 更新 TOC／fields，再輸出 PDF 與 110 DPI
PNG。`artifacts/docx-qa/latest-render.json` 是 compare 使用的穩定最新輸入
契約；每次 render 的 `render-metadata.json` 會記錄版本、DPI 與字型假設。

產出後必須人工逐頁檢查 TOC、章首頁、頁尾、1–6 欄表格、Callout、對話、
程式碼、圖片、QR 與 Mermaid。只有審查通過後才能執行：

```powershell
npm run qa:baseline
npm run qa:compare
```

正常 `qa:compare` 對 baseline 完全唯讀，並將每頁 mismatch ratio 寫入最新
render 的 `comparison.json`；任一頁超過 `0.015`、尺寸不同或頁面檔名集合
不同都會失敗。`qa:baseline` 只新增或覆寫同名 PNG，不會刪除舊 baseline。

不可在不同 Windows、LibreOffice、Poppler、字型或 DPI 環境中隨意更新
baseline。若環境不同，請保留比較失敗並由維護者重新審查，而不是直接接受
新圖片。

---

## 📦 發布流程 (Release Workflow)

1. 完成功能開發並通過測試。
2. 更新 `package.json` 中的版本號。
3. 更新 `CHANGELOG.md` 記錄變更。
4. 提交 PR 至 `main` 分支。

---

若有任何疑問，歡迎在 Issue 中提出討論。
