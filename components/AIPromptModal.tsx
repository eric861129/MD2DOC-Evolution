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

  const promptText = `我想將這段 Markdown 內容轉換為符合「MD2DOC-Evolution」專案格式的內容。
請參考此規範：https://github.com/eric861129/MD2DOC-Evolution/blob/main/docs/AI_GENERATION_GUIDE.md

請幫我：
1. 加入 YAML Frontmatter (title, author)。
2. 將普通提示文字轉換為 
> [!TIP]
 等專用 Callouts。
3. 將操作說明（如按鈕、快捷鍵）轉換為 
【】
 與 
[]
 樣式。
4. 確保程式碼區塊都有語言標籤。

以下是我的內容：
[貼上您的內容]`;

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
