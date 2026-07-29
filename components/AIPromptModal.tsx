import React, { useState } from 'react';
import { Check, Copy, FilePenLine, WandSparkles } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import {
  AIPromptMode,
  AI_PROMPT_MODE_LABELS,
  AI_PROMPT_TEXTS,
} from '../services/aiPrompt';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_DESCRIPTIONS: Record<AIPromptMode, string> = {
  transform: '保留既有稿件的事實與語意，整理成 MD2DOC-Evolution 支援的完整格式。',
  draft: '從主題、受眾與素材開始，建立具備出版結構的新稿初稿。',
};

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AIPromptMode>('transform');
  const [copiedMode, setCopiedMode] = useState<AIPromptMode | null>(null);
  const promptText = AI_PROMPT_TEXTS[mode];

  const handleCopy = async (targetMode: AIPromptMode) => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEXTS[targetMode]);
      setCopiedMode(targetMode);
      window.setTimeout(() => setCopiedMode(null), 2000);
    } catch (error) {
      console.error('複製 AI 提示詞失敗：', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 轉稿提示 v2"
    >
      <div className="space-y-4">
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          先選擇使用情境，再把提示詞交給 ChatGPT、Claude 或其他 AI 工具。兩種模式都會遵守相同的 MD2DOC 語法、Profile 邊界與 Word 後製原則。
        </p>

        <div className="grid gap-3 sm:grid-cols-2" role="tablist" aria-label="AI 提示模式">
          {(['transform', 'draft'] as const).map((item) => {
            const isActive = item === mode;
            const Icon = item === 'transform' ? FilePenLine : WandSparkles;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMode(item)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-sky-500 bg-sky-50 text-sky-950 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4" />
                  {AI_PROMPT_MODE_LABELS[item]}
                </span>
                <span className="mt-2 block text-xs leading-5 opacity-80">
                  {MODE_DESCRIPTIONS[item]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <pre
            data-testid="ai-prompt-preview"
            className="max-h-[48vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-4 pr-28 text-sm leading-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            {promptText}
          </pre>
          <div className="absolute right-3 top-3">
            <Button
              onClick={() => handleCopy(mode)}
              variant={copiedMode === mode ? 'primary' : 'secondary'}
              className="h-8 px-3 text-xs"
              aria-label={`複製${AI_PROMPT_MODE_LABELS[mode]}提示詞`}
            >
              {copiedMode === mode
                ? <Check className="h-3.5 w-3.5" />
                : <Copy className="h-3.5 w-3.5" />}
              {copiedMode === mode ? '已複製' : '複製提示詞'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            AI 只負責內容結構；紙張、邊界、目錄更新與最終換頁仍由匯出設定及 Word 後製決定。
          </p>
          <Button onClick={onClose} variant="secondary">
            關閉
          </Button>
        </div>
      </div>
    </Modal>
  );
};
