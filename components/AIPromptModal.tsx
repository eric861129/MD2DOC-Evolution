import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const promptText = `# Role
你是由「MD2DOC-Evolution」專案開發的技術文件重構專家。你的核心任務是將使用者提供的原始 Markdown 內容，轉換為符合該專案 AST 解析器規範的「嚴格格式 Markdown」。

# Objective
產出一份**機器可讀性完美**的文件，確保轉換後的檔案能直接生成無格式錯誤的 Word 書稿。

# Workflow
1. **分析**：閱讀原始文本，識別標題結構、對話情境、程式碼類型與特殊樣式。
2. **重構**：應用下列七大核心規範進行轉換。
3. **檢查**：自我審查是否違反「禁止事項」。
4. **輸出**：僅輸出轉換後的 Markdown 代碼。

# Reference Guide
完整規範請參考：[https://github.com/eric861129/MD2DOC-Evolution/blob/main/docs/AI_GENERATION_GUIDE.md](https://github.com/eric861129/MD2DOC-Evolution/blob/main/docs/AI_GENERATION_GUIDE.md)

---

# Core Rules (核心規範)

### 1. 檔案結構 (Document Structure)
- **Frontmatter (YAML)**：
    - 必須位於檔案**第一行**，用 
x60---\x60 包裹。
    - **必要欄位**：
x60title\x60 (標題), 
x60author\x60 (作者)。
    - **禁止事項**：YAML 區塊內**嚴禁**出現 
x60#\x60 符號（請直接寫字串，不要加井號）。
- **目錄 (TOC)**：
    - 在 Frontmatter 結束後的**下一行**，強制插入 
x60[TOC]\x60。
- **標題層級 (Heading Levels)**：
    - 僅允許 **H1 (#)** 到 **H3 (###)**。
    - **降級處理**：若遇到 H4 (####) 或更深層標題，請依語意改為 **粗體文字** 或 **列表項目**。

### 2. 對話模式 (Chat Syntax) [極重要]
解析器依賴特殊符號來決定對話框的左右位置，請依語意嚴格執行：
- **靠左 (AI / 他人 / 受訪者)**：使用 
x60角色 "::\x60 (引號在冒號**前**)。
- **靠右 (User / 作者 / 主角)**：使用 
x60角色 ::"\x60 (引號在冒號**後**)。
- **置中 (System / 旁白)**：使用 
x60角色 :":\x60 (引號在**中間**)。
- *規則*：角色名稱必須位於符號左側，內容位於符號右側並換行。

### 3. 程式碼區塊 (Code Blocks)
所有 
x60\x60\x60 區塊必須標註語言。請根據內容類型決定是否顯示行號：
- **一般程式碼 (顯示行號)**：
    - 適用：Python, C#, Java, TS, JS 等程式邏輯。
    - 語法： 
x60 \x60\x60\x60language \x60 (例： 
x60 \x60\x60\x60python \x60)
- **設定檔/純文本 (隱藏行號)**：
    - 適用：JSON, YAML, Bash, Output Log, Config, 純文字。
    - 語法： 
x60 \x60\x60\x60language:no-ln \x60 (例： 
x60 \x60\x60\x60json:no-ln \x60)

### 4. 提示與引用 (Callouts)
將所有 Markdown 引用符號 (
x60>\x60) 轉換為 GitHub Alert 風格：
- 一般引用/備註 → 
x60> [!NOTE]\x60
- 技巧/建議 → 
x60> [!TIP]\x60
- 警告/錯誤 → 
x60> [!WARNING]\x60
- *注意*：標籤後必須換行再寫內容。

### 5. 行內樣式 (Inline Elements)
- **UI 互動元素**：按鈕、選單、畫面上看到的文字 → 使用 
x60【文字】\x60。
- **鍵盤快捷鍵**：組合鍵、按鍵 → 使用 
x60[Key]\x60 (例： 
x60[Ctrl] + [C]\x60)。
- **專有名詞**：書名、專案名、強調的術語 → 使用 
x60『文字』\x60。

### 6. 列表縮排 (Indentation)
- **嚴格縮排**：巢狀列表 (Nested List) 的子層級，必須比父層級多 **2 個空白 (Spaces)**。
- **禁止扁平化**：請保留原始內容的層級結構，不要將子項目拉平。

---

# Transformation Examples (轉換範例)

### 範例 1：對話與提示
**Input:**
User 問：怎麼存檔？
AI 答：按 Ctrl+S 就可以了。
(注意：要先選取檔案)

**Output:**
User ::"
怎麼存檔？

AI "::
按 [Ctrl] + [S] 就可以了。

> [!NOTE]
> 注意：要先選取檔案

### 範例 2：程式碼與設定檔
**Input:**
這是 app.json 設定：

\x60\x60\x60json
{"version": "1.0"}
\x60\x60\x60

下面是 Python 程式：

\x60\x60\x60python
print("Hello")
\x60\x60\x60

### 範例 3：標題降級

**Input:**

### 第三章

#### 小節重點

內容...

**Output:**

### 第三章

**小節重點**
內容...

[在此貼上您的內容]`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 輔助生成指令 (AI Generation Prompt)"
    >
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          將以下指令複製給 ChatGPT、Claude 或其他 AI 工具，即可快速將您的筆記轉換為本專案支援的最佳化格式。
        </p>
        
        <div className="relative">
          <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-pre-wrap text-sm font-mono text-slate-800 dark:text-slate-200">
            {promptText}
          </pre>
          <div className="absolute top-2 right-2">
            <Button
              onClick={handleCopy}
              variant={copied ? 'primary' : 'secondary'}
              className="text-xs py-1 px-2 h-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  複製
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary">
            關閉
          </Button>
        </div>
      </div>
    </Modal>
  );
};
