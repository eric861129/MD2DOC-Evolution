# AI Generation & Conversion Guide (AI 輔助生成與轉換指南)

本文件旨在提供給大型語言模型 (LLM) 閱讀，以便精確地將現有的內容轉換為 **MD2DOC-Evolution** 專屬格式，並符合專業出版社的寫作規範。

---

## 核心轉換規則 (Core Rules)

### 1. 文件後設資料 (Frontmatter)
- **必須包含**：`title`, `author`。
- **選填參數**：`header` (true/false), `footer` (true/false)。
- **範例**：
  ```yaml
  ---
  title: "深入淺出 TypeScript"
  author: "Eric Huang"
  header: true
  footer: true
  ---
  ```

### 2. 標題與結構 (Structure)
- **禁止使用 H4, H5, H6**：本專案僅支援 `#`, `##`, `###`。若原始稿件有更深層級，請將其轉換為 `**粗體項目**`。
- **目錄標籤**：在 Frontmatter 結束後的下一行，必須插入 `[TOC]`。
- **章首頁**：只有來源明確提供章號、標題與目標時，才使用 `[CHAPTER]` YAML 區塊；不要自行捏造章節資料。

  ```markdown
  [CHAPTER]
  number: "01"
  title: "公開章節"
  summary: "使用虛構內容示範章首頁。"
  goals:
    - "完成可驗證的公開範例。"
  [/CHAPTER]
  ```

### 3. 文件 Profile (Document Profiles)

AI 只負責整理 Markdown 內容，不應假設使用者一定選擇某個版型。使用者可在匯出設定中選擇：

- `technical-legacy`：預設值，保留舊版技術書稿行為。
- `publisher-exact`：固定出版社幾何與出版社樣式。
- `publisher-narrow`：增加內容寬度，接受換行與頁碼重排。
- `publisher-binding`：鏡像邊界與 gutter，供雙面裝訂。

### 4. 出版級文字規範 (Publishing Standards)
- **中英文空格**：遵循來源或編輯規範並保持全文一致，不要在轉換時任意改寫專有名詞。
- **標點符號**：中文句子中夾雜英文時，必須使用 **中文標點符號**。 (例：`開設 FB、IG 帳號。` 而非 `開設 FB, IG 帳號。`)
- **UI 強調**：介紹軟體介面操作時，使用 `「」` 符號加以強調。 (例：完成後按 「Test Connection」)

### 5. 圖片與圖號 (Images & Figures)
- **自動編號**：系統會自動根據出現順序編號為「圖 X」。
- **圖名語法**：使用 `![圖名](url)`。
- **全頁圖片**：若圖片需放整頁 (13x18cm)，請在 Alt 文字中加入 `full-page` 標記。 (例：`![這是全頁圖 full-page](url)`)
- **截圖規範**：截圖請務必使用 **淺色亮底** 主題，並在關鍵步驟加上醒目框線。
- **寬度限制**：系統會自動將圖片限制在 **13 cm** 寬度內。

### 6. 程式碼區塊 (Code Blocks)
- **語法**：```語言[:ln|:no-ln]
- **細節**：
  - 預設會顯示行號。
  - 若為短小的設定檔，請強制標註 `:no-ln`。
  - **範例**：```json:no-ln

### 7. 提示區塊 (Callouts)
- **格式**：必須使用 `> [!標記]`。
- **類型限制**：僅支援 `NOTE`, `TIP`, `WARNING`, `IMPORTANT`, `CAUTION`。
- **轉換邏輯**：
  - 「注意」、「補充」 -> `> [!NOTE]`
  - 「技巧」、「建議」 -> `> [!TIP]`
  - 「警告」、「可能失敗」 -> `> [!WARNING]`
  - 「務必完成」、「關鍵要求」 -> `> [!IMPORTANT]`
  - 「可能造成資料或實體風險」 -> `> [!CAUTION]`

### 8. 角色對話 (Chat Dialogues)
- **左側 (AI/他人)**：`角色名稱 "::` (引號在冒號前)
- **右側 (User/作者)**：`角色名稱 ::"` (引號在冒號後)
- **置中 (System/旁白)**：`角色名稱 :":` (引號在中間)

### 9. 連結與 QR

- 一般 Markdown 連結必須保持 hyperlink：`[公開文件](https://example.com/docs)`。
- 只有需要紙本讀者掃描的重要連結才使用明確 QR：`[QR:公開下載頁](https://example.com/download)`。
- 不得把所有 hyperlink 批次改成 QR；QR 是獨立版面區塊，不是一般連結的預設輸出。

### 10. 行內樣式轉換表
| 原始內容 | 轉換後格式 | 說明 |
| :--- | :--- | :--- |
| 「點擊設定」 | `「設定」` | UI 元素強調 (建議優先使用) |
| 【點擊設定】 | `【設定】` | UI 按鈕、選單項目 (帶底色) |
| Ctrl+C | `[Ctrl]`+`[C]` | 所有實體按鍵 |
| 《深入淺出》 | `『深入淺出』` | 所有書名、軟體專案名 |
| [連結](url) | `[連結](url)` | 保持一般 hyperlink |
| 重要掃描入口 | `[QR:標籤](URL)` | 只用於重要紙本入口 |

---

## 負面約束 (Negative Constraints)
- **不要** 使用 HTML 標籤（如 `<u>`, `<br>`）。
- **不要** 在 Callout 內嵌套另一個 Callout。
- **不要** 自行發明 Callout 標籤。
- **不要** 把一般 Markdown hyperlink 全部轉成 QR。
- **不要** 忽略關鍵步驟，避免用「這個大家應該都知道」為前提。
- **不要** 忘記專有名詞第一次出現時要簡短解釋。

版型、鏡像邊界、字型與 Word／LibreOffice 差異請見
[出版社版型與語法指南](PUBLISHER_PROFILE.md)。
