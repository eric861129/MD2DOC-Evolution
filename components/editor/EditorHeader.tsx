/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { FileText, Settings2, Download, Sun, Moon } from 'lucide-react';

interface EditorHeaderProps {
  pageSizes: { name: string; width: number; height: number }[];
  selectedSizeIndex: number;
  onSizeChange: (index: number) => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasContent: boolean;
  isDark: boolean;
  toggleDarkMode: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  pageSizes,
  selectedSizeIndex,
  onSizeChange,
  onDownload,
  isGenerating,
  hasContent,
  isDark,
  toggleDarkMode
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center z-20 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 dark:bg-indigo-600 p-2.5 rounded-xl">
          <FileText className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            BookPublisher <span className="text-slate-400 font-normal">MD2Docx</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">核心引擎：Markdown -&gt; Word (v2.0)</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          title={isDark ? "切換至亮色模式" : "切換至深色模式"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* 版面尺寸選擇器 */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Settings2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <select 
            value={selectedSizeIndex}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {pageSizes.map((size, index) => (
              <option key={index} value={index} className="dark:bg-slate-800">
                {size.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onDownload}
          disabled={isGenerating || !hasContent}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {isGenerating ? '正在轉換...' : '匯出 Word'}
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
