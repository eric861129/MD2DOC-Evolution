/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { UI_THEME } from '../../constants/theme';
import { useEditor } from '../../contexts/EditorContext';

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
  const { registerImage } = useEditor();

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

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    let insertedText = '';
    
    for (const file of imageFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Generate a short ID for the image
      const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      registerImage(imageId, base64);
      
      insertedText += `\n![${file.name}](${imageId})\n`;
    }

    const newContent = content.substring(0, start) + insertedText + content.substring(end);
    setContent(newContent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="w-[40%] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Manuscript Editor (Draft)</span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
           {wordCount} Words
        </span>
      </div>
      <textarea
        ref={textareaRef}
        onScroll={onScroll}
        className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 dark:text-slate-300 bg-transparent selection:bg-indigo-100 dark:selection:bg-indigo-900"
        style={{ fontFamily: UI_THEME.FONTS.PREVIEW }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        spellCheck={false}
        placeholder="在此輸入您的 Markdown 稿件..."
      />
    </div>
  );
};