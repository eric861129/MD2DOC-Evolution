import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AI_PROMPT_TEXT } from '../services/aiPrompt';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const promptText = AI_PROMPT_TEXT;

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 轉稿提示"
    >
      <div className="space-y-4">
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          將下方提示詞交給 ChatGPT、Claude 或其他 AI 工具，可以把既有稿件整理成 MD2DOC-Evolution 更適合匯出 Word 的格式。
        </p>

        <div className="relative">
          <pre className="max-h-[56vh] whitespace-pre-wrap break-words overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4 pr-24 text-sm leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {promptText}
          </pre>
          <div className="absolute right-3 top-3">
            <Button
              onClick={handleCopy}
              variant={copied ? 'primary' : 'secondary'}
              className="h-8 px-3 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '已複製' : '複製'}
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
