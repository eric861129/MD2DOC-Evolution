# 開發指南 (Development Guide)

本指南旨在協助開發者快速上手 **MD2DOC-Evolution** 的開發環境，並理解日常開發流程。

## ⚙️ 環境建置 (Setup)

### 系統需求
- **Node.js**: 20.19+（20.x）、22.12+（22.x），或 24.0+（建議使用 LTS）
- **套件管理器**: npm (預設) 或 yarn/pnpm

### 初次安裝
```bash
# Clone 專案
git clone https://github.com/eric861129/MD2DOC-Evolution.git
cd MD2DOC-Evolution

# 安裝依賴
npm install
```

---

## 📜 可用腳本 (Scripts)

在 `package.json` 中定義了以下常用指令：

| 指令 | 說明 |
| :--- | :--- |
| `npm run dev` | 啟動 Vite，網址為 `http://localhost:3000/MD2DOC-Evolution/`，支援 HMR。 |
| `npm run build` | 建置生產環境版本，產物位於 `dist/` 目錄。 |
| `npm run preview` | 在本地預覽 `dist/` 中的建置結果。 |
| `npm run test` | 執行單元測試 (Vitest)。 |
| `npm run verify` | 依序執行 typecheck、完整測試與 production build。 |
| `npm run qa:fixture` | 由公開「星圖工坊」Markdown 產生 publisher-exact DOCX。 |
| `npm run qa:acceptance` | 由完整範例產生 exact／narrow／binding，驗證 package、TOC、書籤、媒體、清單與黑點標記。 |
| `npm run qa:word` | 以隔離 Word 365 worker 更新欄位、逐段檢查並匯出 PDF；每份文件都有逾時與程序清理。 |
| `npm run qa:render` | 以 LibreOffice 與 Poppler 產生 timestamp PDF／PNG。 |
| `npm run qa:baseline` | 經人工審查後逐檔更新視覺 baseline。 |
| `npm run qa:compare` | 比較最新 render 與 baseline，門檻為 1.5%。 |

---

## 🐛 除錯技巧 (Debugging)

### 1. Markdown 解析除錯
若發現轉檔結果不如預期，可以先檢查 Parser 的輸出。
優先用 `tests/markdownParser.publisher.test.ts` 建立最小重現，直接檢查 `parseMarkdown()` 產生的 `ParsedBlock[]`，確認錯誤位於 Parser、Preview 或 DOCX Builder。臨時除錯輸出不可留在提交中。

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
- `tests/docxGenerator.test.ts`: 測試 Word 生成入口。
- `tests/docx/`: 驗證版面、樣式、表格、元件與 OOXML package。
- `tests/exampleCoverage.test.ts`: 驗證中英文範例與語法矩陣。
- `tests/aiPrompt.golden.test.ts`: 驗證 AI Prompt v2 契約。
- `tests/userGuide.test.ts`: 驗證教學安全 AST、搜尋與內容。

### 執行特定測試
```bash
npm run test:run -- tests/markdownParser.test.ts
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

### DOCX package 與版面驗收

`npm run qa:acceptance` 會在 `artifacts/docx-qa/acceptance/` 由同一份完整
Markdown 產生 exact／narrow／binding 三份公開 fixture；該目錄已忽略，不可
把 runtime HTML、瀏覽器 profile、PDF 或 PNG 加入 Git。產物必須通過內建
package inspection，且 ZIP 內不得出現 `.undefined` 媒體、未知媒體格式、
遺失 relationship 或缺少 content type。報告也會確認 TOC、bookmark 配對、
媒體、顯式換頁，以及只有真正無序清單含有 `numPr`。

三種版型的 OOXML 固定契約如下：

- narrow 的 17.6 × 23.6 cm 紙張搭配四邊 1.27 cm，內容寬度必須是 15.06 cm。
- binding 的 `w:pgMar` 必須包含上 2.00、下 2.20、內 2.20、外 1.80 cm
  與 0.50 cm gutter，`settings.xml` 必須含有 `w:mirrorMargins`。
- 鏡像邊界由 Word 在奇偶頁交換內外側；網頁單頁 Preview 不是雙面印刷證據。

完整書稿驗收只能使用維護者有權存取的來源，輸出放在
`artifacts/docx-qa/private-acceptance/<timestamp>/`。先確認來源與參考產生器
是同源，再比較 page size、margins、styles、tables、media、fields、package
relationships 與 render。若無法取得完全同源內容，必須把限制寫入驗收報告，
不得宣稱逐頁一致。差異要分類為：

1. 內容差異：來源轉換或兩份書稿內容不同。
2. renderer 差異：Word 365 與 LibreOffice 的字型、欄位或分頁行為不同。
3. MD2DOC defect：相同輸入下違反已定義的 OOXML／版型契約。

只有第三類可以修改產品程式碼，而且必須先加入會失敗的 regression test。
若本機有 Word 365 COM，自動化必須使用不可見視窗、唯讀開啟並在
`finally` 關閉文件與 Word process；不得在檢查流程中覆寫私有參考檔。
`npm run qa:word` 會為每份 DOCX 建立獨立 worker，避免單一 COM 程序互相
污染。要同時量測唯讀參考稿，可執行：

```powershell
npm run qa:word -- -ReferenceDocx 'D:\path\reference.docx'
```

Word 驗收 PDF 會放在
`artifacts/docx-qa/acceptance/word/<timestamp>/`。可再以
`scripts/qa/render-word-pdfs.py` 全頁轉成 PNG 與 contact sheet；此步需要
Python 的 PyMuPDF 與 Pillow。

### Release candidate gate

一般 compare 不得更新 baseline。準備 release candidate 時依序執行：

```powershell
npm run verify
npm run qa:acceptance
npm run qa:word
git diff --check
git status --short
```

LibreOffice 固定環境可另外執行 `qa:render` 與 `qa:compare`，但安裝或
`bootstrap.ini` 損壞時不得拿失敗結果取代 Word 365 驗收。另需檢查嚴格
UTF-8、私人內容、秘密字串、staged diff 與 `npm audit` 剩餘數量。只有
`npm run qa:baseline` 可以寫 baseline，且必須先完成固定環境的人工逐頁
審查。

---

## 📦 發布流程 (Release Workflow)

1. 完成功能開發並通過測試。
2. 更新 `package.json` 中的版本號與公開 release notes。
3. 執行完整 release candidate gate，確認預設為 `publisher-exact`，且三種新版版型皆可正常匯出。
4. 建立經審查的 Conventional Commit；只有收到明確指示後才能 push 或 publish。

---

若有任何疑問，歡迎在 Issue 中提出討論。
