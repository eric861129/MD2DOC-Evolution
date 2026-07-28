# Publisher DOCX 視覺 Baseline

本目錄保存公開「星圖工坊」fixture 的逐頁 Golden PNG，供
`npm run qa:compare` 以 pixelmatch 驗證。

## 固定產生環境

- Windows 11
- LibreOffice 26.2.4.2
- Poppler `pdftoppm` 26.05.0
- Noto Sans TC 已安裝
- 110 DPI

Baseline 對作業系統、LibreOffice、Poppler、字型與 DPI 都敏感。不可在不同
環境中只為讓比較通過而執行 `npm run qa:baseline`。

## 更新規則

1. 執行 `npm run qa:fixture` 與 `npm run qa:render`。
2. 人工逐頁檢查 `artifacts/docx-qa/renders/<timestamp>/pages/*.png`，
   確認 TOC、章首頁、頁尾、表格、Callout、對話、程式碼、圖片、QR 與
   Mermaid 均無空白頁、裁切或溢出。
3. 確認工具版本、字型與 DPI 完全符合固定環境。
4. 經審查者同意後才執行 `npm run qa:baseline`。
5. 立即執行 `npm run qa:compare`，確認所有 mismatch ratio 都不超過
   `0.015`。

`qa:baseline` 只會逐檔新增或覆寫目前 render 的同名 PNG，不會刪除舊檔。
若頁數減少而留下舊 baseline，請先查明排版變更原因，再由維護者明確處理；
不可用一般比較命令修改 baseline。
