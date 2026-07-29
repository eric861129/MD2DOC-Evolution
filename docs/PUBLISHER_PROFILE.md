# 出版社版型與語法指南

MD2DOC-Evolution 以文件 Profile 同時控制版面幾何與 Word 樣式。新安裝與既有文件都維持 `technical-legacy` 為預設；選擇出版社 Profile 不會改寫 Markdown 原稿。

## 四種文件 Profile

| Profile | 適用情境 | 預設紙張 | 預設邊界 | 相容性 |
| :--- | :--- | :--- | :--- | :--- |
| `technical-legacy` | 既有技術文件 | 17.6 × 23.6 cm | 四邊 2.54 cm | 預設值；保留舊版樣式與匯出語意，紙張採新版 technical preset |
| `publisher-exact` | 對照出版社幾何契約 | 17.6 × 23.6 cm | 四邊 2.54 cm | 使用出版社樣式；覆寫幾何後不保證參考稿頁碼一致 |
| `publisher-narrow` | 希望增加內容寬度 | 17.6 × 23.6 cm | 四邊 1.27 cm | 與 exact 共用出版社樣式；允許換行與頁碼重排 |
| `publisher-binding` | 雙面印刷與裝訂 | 17.6 × 23.6 cm | 上 2.00、下 2.20、內 2.20、外 1.80 cm，gutter 0.50 cm | 使用鏡像邊界；允許頁碼重排 |

`publisher-exact` 的內容寬度是 12.52 cm；`publisher-narrow` 是 15.06 cm。兩者不可能同時維持完全相同的換行、分頁與總頁數。`exact` 表示幾何與樣式契約，不代表任何不同來源、不同字型或不同 renderer 都能產生逐頁相同的像素結果。

## 紙張、邊界與自訂限制

紙張預設包含 17.6 × 23.6 cm 技術書、A4（21 × 29.7 cm）、A5（14.8 × 21 cm）與 B5（17.6 × 25 cm）。邊界預設包含：

- `narrow`：四邊 1.27 cm。
- `compact`：四邊 1.50 cm。
- `balanced`：四邊 2.00 cm。
- `standard`／`publisher-exact`：四邊 2.54 cm。
- `publisher-binding`：鏡像邊界加 0.50 cm 左側 gutter。

自訂紙張的寬、高都必須介於 10.00 至 100.00 cm。自訂四邊或內外側邊界必須介於 0.50 至 5.00 cm，gutter 必須介於 0.00 至 5.00 cm；有效內容寬度不得小於 8 cm，有效內容高度不得小於 10 cm。任一邊界小於 1 cm 時，系統會提示列印裁切風險。鏡像邊界不可搭配上方 gutter。

鏡像邊界使用「內側／外側」而不是固定左／右。Word 在奇數頁把內側放在左側、偶數頁交換到右側；gutter 會額外保留裝訂空間。網頁單頁預覽只能示意一側，交付前仍應以 Word 的雙面或多頁檢視確認奇偶頁。

## 出版語法

### 章首頁

章首頁以根層級 `[CHAPTER]` YAML 區塊表示：

```markdown
[CHAPTER]
number: "01"
part: "第一部：準備"
title: "建立公開範例"
englishTitle: "Build a Public Example"
summary: "本章使用虛構內容示範出版流程。"
image: "chapter-cover"
goals:
  - "理解版型差異。"
  - "完成可驗證的輸出。"
[/CHAPTER]
```

`number`、`title` 與至少一個 `goals` 項目為必要資料。`part`、`englishTitle`、`summary` 與 `image` 可依書稿需要加入。

### 目錄

在 Frontmatter 後加入獨立一行：

```markdown
[TOC]
```

Publisher Profile 會建立 Word TOC field，並將文件設為開啟時更新欄位。交付前仍應在 Word 365 中按一下目錄，選擇「更新目錄」→「更新整個目錄」；也可按 `Ctrl+A` 後按 `F9` 更新所有欄位。LibreOffice 的欄位更新與分頁結果可能不同，不能取代最終 Word 檢查。

### 一般連結與明確 QR

一般 Markdown 連結保持可點擊 hyperlink：

```markdown
[公開文件](https://example.com/docs)
```

只有需要紙本讀者掃描的重要連結才使用獨立 QR 語法：

```markdown
[QR:公開下載頁](https://example.com/download)
```

不要把每一個 hyperlink 都轉成 QR，否則版面會膨脹且讀者難以辨識真正重要的入口。

### 五種 Callout

```markdown
> [!NOTE]
> 補充背景或一般筆記。

> [!TIP]
> 提供實作技巧或建議。

> [!WARNING]
> 提醒可能造成失敗的條件。

> [!IMPORTANT]
> 標示交付前一定要完成的事項。

> [!CAUTION]
> 標示可能造成資料或實體風險的操作。
```

## 字型與 renderer 差異

出版社 Profile 的中日韓文字使用 Noto Sans TC。產生或審查文件的 Windows、Word、LibreOffice 與 CI/render 主機都應安裝相同版本的字型。缺少字型時，應用程式會依環境選擇替代字型，可能改變字寬、行高、表格換行、章首頁與總頁數。

Word 365 是最終出版交付的主要檢查環境；LibreOffice 適合可重複的 headless PDF／PNG 回歸。兩者的字型 fallback、TOC field、分頁、表格高度、圖片定位與奇偶頁呈現可能不同。因此：

1. 先以 package inspection 驗證 DOCX 沒有損壞、遺失關聯或未知媒體。
2. 再以固定 LibreOffice／Poppler 環境做視覺回歸。
3. 最後以 Word 365 更新欄位並檢查封面、目錄、章首頁、跨頁表格與末頁。

任何 renderer 差異都應記錄環境與分類，不應為了追求單一 renderer 的像素相同而破壞 OOXML 或出版社版型契約。
