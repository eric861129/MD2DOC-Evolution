# AI Generation & Conversion Guide (AI 輔助生成與轉換指南)

本文件旨在提供給大型語言模型 (LLM) 閱讀，以便精確地將現有的內容轉換為 **MD2DOC-Evolution** 專屬格式。

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

### 3. 程式碼區塊 (Code Blocks)
- **語法**：```語言[:ln|:no-ln]
- **細節**：
  - 預設會顯示行號。
  - 若為短小的設定檔，請強制標註 `:no-ln`。
  - **範例**：```json:no-ln

### 4. 提示區塊 (Callouts)
- **格式**：必須使用 `> [!標記]`。
- **類型限制**：僅支援 `TIP`, `NOTE`, `WARNING`。
- **轉換邏輯**：
  - 「注意」、「補充」 -> `> [!NOTE]`
  - 「技巧」、「建議」 -> `> [!TIP]`
  - 「警告」、「重要」 -> `> [!WARNING]`

### 5. 角色對話 (Chat Dialogues) - **極重要**
這是 AI 最容易出錯的地方，請嚴格執行：
- **左側 (AI/講者)**：`角色名稱 ":: 對話內容` (注意引號位置)
- **右側 (User/讀者)**：`對話內容 ::" 角色`
- **範例**：
  - `GPT ":: 您好！有什麼我能幫您的？`
  - `請幫我寫一段程式碼 ::" 使用者`

### 6. 行內樣式轉換表
| 原始內容 | 轉換後格式 | 說明 |
| :--- | :--- | :--- |
| 「點擊設定」 | `【設定】` | 所有 UI 按鈕、選單項目 |
| Ctrl+C | `[Ctrl]`+`[C]` | 所有實體按鍵 |
| 《深入淺出》 | `『深入淺出』` | 所有書名、軟體專案名 |
| [連結](url) | `[連結](url)` | 保持原樣，系統會自動轉 QR Code |

---

## 負面約束 (Negative Constraints)
- **不要** 使用 HTML 標籤（如 `<u>`, `<br>`）。
- **不要** 在 Callout 內嵌套另一個 Callout。
- **不要** 自行發明 Callout 標籤（如 `[!DANGER]` 是不支援的）。
- **不要** 改變 Mermaid 的標準語法。

---

## AI 轉換指令 (AI System Prompt)

請將以下 Prompt 提供給 AI：

```markdown
# Role
你是一位專業的技術圖書編輯，專精於將一般 Markdown 稿件重構為「MD2DOC-Evolution」專業排版格式。

# Task
請將我提供的內容轉換為符合規範的格式。

# Rules to follow
1. 分析內容並生成對應的 YAML Frontmatter (title, author)。
2. 在文件最開頭插入 `[TOC]`。
3. 標題層級：嚴格檢查，若有 H4 以上標題，請降級或轉為粗體，僅保留 H1~H3。
4. 行內樣式重構：
   - 識別所有 UI 元素、按鈕，改用 `【】`。
   - 識別所有快捷鍵，改用 `[]`。
   - 識別所有書名、專案名，改用 `『』`。
5. 對話重構：若內容中有對話流，請使用 `角色 "::` 與 `::" 角色` 語法。
6. 提示重構：將所有 Note/Tip/Warning 轉換為專案支援的 `> [!TAG]` 語法。
7. 程式碼：確保所有區塊都有語言標籤。

# Reference Guide
詳細語法請參考：https://github.com/eric861129/MD2DOC-Evolution/blob/main/docs/AI_GENERATION_GUIDE.md

# Output
僅輸出轉換後的 Markdown 內容，不要有任何多餘的解釋。
```