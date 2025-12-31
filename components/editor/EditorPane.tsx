/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { FONTS } from '../../constants/theme';

interface EditorPaneProps {
  content: string;
  setContent: (content: string) => void;
  wordCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onScroll: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  content,
  setContent,
  wordCount,
  textareaRef,
  onScroll
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // 在當前位置插入兩個空格
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      // 重新設定光標位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
      <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manuscript Editor (Draft)</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           {wordCount} Words
        </span>
      </div>
      <textarea
        ref={textareaRef}
        onScroll={onScroll}
        className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 selection:bg-indigo-100"
        style={{ fontFamily: `"${FONTS.LATIN}", "${FONTS.CJK}", sans-serif` }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="在此輸入您的 Markdown 稿件..."
      />
    </div>
  );
};
