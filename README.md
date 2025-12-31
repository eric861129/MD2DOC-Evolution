# BookPublisher MD2Docx

## 喜歡的話可以幫我按星星🌟🌟🌟

**BookPublisher MD2Docx** 是一個開源的 Markdown 編輯與轉檔工具，專為**技術書籍作者**與**內容創作者**設計。它填補了「工程師習慣的 Markdown 寫作」與「出版社要求的 Word 稿件」之間的鴻溝，讓你能專注於內容創作，自動完成繁瑣的排版工作。

🔗 **線上試用 (Live Demo):** [https://eric861129.github.io/BookPublisher_MD2Doc/](https://eric861129.github.io/BookPublisher_MD2Doc/)

## 📄 範例下載 (Sample Output)

您可以從這裡查看匯出的 Word 文件效果：
- [📥 下載範例文件 (範例Word.docx)](samples/範例Word.docx)

<div align="center">
  <img src="docs/images/1.jpg" width="32%" alt="Cover & Header" />
  <img src="docs/images/2.jpg" width="32%" alt="Chat Dialogues" />
  <img src="docs/images/3.jpg" width="32%" alt="Callouts & Styles" />
  <br/>
  <img src="docs/images/4.jpg" width="48%" alt="Code Blocks" />
  <img src="docs/images/5.jpg" width="48%" alt="Tables & Lists" />
</div>
*(實際 Word 輸出效果截圖)*

## ✨ 核心特色 (Features)

這個專案不僅僅是一個 Markdown 轉換器，它針對「出版」需求做了深度優化：

- **📚 專業出版級 Word (DOCX) 匯出**
    - 自動配置標題、段落、行距與邊框。
    - 內建字體設定：中文使用 **Microsoft JhengHei (微軟正黑體)**，英文/程式碼使用 **Consolas**。
    - 支援多種版面尺寸：技術書籍 (17x23cm)、A4、A5、B5。

- **💬 角色對話框 (Chat Dialogues)**
    - 專為技術書中常見的「情境模擬」或「AI 對話」設計。
    - 寫作時只需輸入 `User:` 或 `AI:`，轉檔後自動生成左右對齊、風格區隔的對話盒。

- **⚠️ 豐富的提示區塊 (Callouts)**
    - 支援 GitHub/Obsidian 風格的提示語法：
    - `[!TIP]` 提示：實線邊框
    - `[!NOTE]` 筆記：虛線邊框
    - `[!WARNING]` 警告：粗框強調

- **⌨️ 特殊行內樣式**
    - **UI 按鈕**：使用 `【設定】` 自動生成按鈕樣式。
    - **快捷鍵**：使用 `[Ctrl]` 生成鍵盤按鍵樣式。
    - **書名號**：使用 `『Clean Code』` 自動加粗。

- **📊 豐富的區塊支援**
    - **表格 (Tables)**：支援 Markdown 標準表格語法，自動生成帶邊框的 Word 表格。
    - **有序列表**：支援 `1.` `2.` 自動編號功能。

- **👁️ 所見即所得 (WYSIWYG)**
    - 雙欄模式：左側寫作，右側即時預覽。
    - **編輯器優化**：支援 `Tab` 鍵縮排（插入空格），不跳失焦點。

## 🚀 快速開始 (Getting Started)

### 前置需求
- [Node.js](https://nodejs.org/) (建議 v16 以上)

### 安裝與執行

1. **複製專案 (Clone)**
   ```bash
   git clone https://github.com/your-username/BookPublisher_MD2Doc.git
   cd BookPublisher_MD2Doc
   ```

2. **安裝依賴 (Install Dependencies)**
   ```bash
   npm install
   ```

3. **啟動開發伺服器 (Run Dev Server)**
   ```bash
   npm run dev
   ```
   瀏覽器將會自動開啟 `http://localhost:5173`。

## 📝 寫作語法指南 (Syntax Guide)

除了標準 Markdown 語法 (標題, 列表, 程式碼區塊) 外，我們支援以下特殊語法：

### 1. 角色對話
```markdown
User: 請解釋什麼是 React Hook？
AI: React Hook 是 React 16.8 新增的特性...
```

### 2. 提示區塊 (Callouts)
```markdown
> [!TIP]
> 这是一个提示技巧。

> [!WARNING]
> 操作前請務必備份資料！
```

### 3. 特殊行內樣式
- **UI 按鈕**: 點擊 【確定】 繼續。
- **快捷鍵**: 按下 [Ctrl] + [S] 存檔。
- **強調**: 這是 **粗體** 和 *斜體 (轉檔後為深藍色)*。
- **行內程式碼**: 使用 `npm install` 指令。

### 4. 表格 (Tables)
```markdown
| 標題 A | 標題 B |
| ------ | ------ |
| 內容 1 | 內容 2 |
```

### 5. 圖片插入指引
使用標準 Markdown 圖片語法，建議作為位置標記：
`![圖片描述](圖片網址)`
*(註：因安全性限制，Word 匯出後可能需手動重新置入高畫質圖片)*


## 🎨 客製化指南 (Customization)

本專案支援高度客製化，您可以根據需求調整字體、顏色或新增 Markdown 語法。詳細說明請參考：
- [📘 客製化指南 (CUSTOMIZATION.md)](CUSTOMIZATION.md)

## 🛠️ 技術棧 (Tech Stack)

- **Frontend Framework**: [React 19](https://react.dev/) (Hooks-based Modular Architecture)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Design System**: Centralized Theming System (`theme.ts`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Document Generation**: [docx](https://docx.js.org/)
- **UI Icons**: [Lucide React](https://lucide.dev/)

## 🤝 貢獻 (Contributing)

歡迎任何形式的貢獻！如果你發現 Bug 或有新功能建議：

1. Fork 這個專案
2. 建立你的 Feature Branch (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權 (License)

本專案採用 MIT License 開源授權，詳見 [LICENSE](LICENSE) 文件。