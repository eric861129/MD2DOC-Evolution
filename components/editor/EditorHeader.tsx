/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { FileText, Settings2, Download } from 'lucide-react';

interface EditorHeaderProps {
  pageSizes: { name: string; width: number; height: number }[];
  selectedSizeIndex: number;
  onSizeChange: (index: number) => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasContent: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  pageSizes,
  selectedSizeIndex,
  onSizeChange,
  onDownload,
  isGenerating,
  hasContent
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <FileText className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">BookPublisher <span className="text-slate-400 font-normal">MD2Docx</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">核心引擎：Markdown -&gt; Word (v2.0)</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <select 
            value={selectedSizeIndex}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            {pageSizes.map((size, index) => (
              <option key={index} value={index}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onDownload}
          disabled={isGenerating || !hasContent}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300"
        >
          {isGenerating ? '正在轉換...' : '匯出 Word'}
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
