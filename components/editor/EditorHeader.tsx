/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Settings2, Download, Sun, Moon, RotateCcw, Languages } from 'lucide-react';
import { Language } from '../../constants/locales';

interface EditorHeaderProps {
  pageSizes: { name: string; width: number; height: number }[];
  selectedSizeIndex: number;
  onSizeChange: (index: number) => void;
  onDownload: () => void;
  onReset: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
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
  onReset,
  language,
  toggleLanguage,
  t,
  isGenerating,
  hasContent,
  isDark,
  toggleDarkMode
}) => {
  // 處理 LOGO 路徑，考慮到 GitHub Pages 的子目錄
  const logoPath = `${import.meta.env.BASE_URL}logo.svg`;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center z-20 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 dark:bg-indigo-600 p-1 rounded-xl">
          <img src={logoPath} alt="Logo" className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('title')} <span className="text-slate-400 font-normal">MD2Docx</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t('subtitle')}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-800 transition-all"
          title={t('reset')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-medium text-xs"
          title="Switch Language / 切換語言"
        >
          <Languages className="w-4 h-4" />
          <span>{language === 'zh' ? 'EN' : '中'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          title={isDark ? t('theme.light') : t('theme.dark')}
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
                {t(`sizes.${size.name}`)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onDownload}
          disabled={isGenerating || !hasContent}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {isGenerating ? t('exporting') : t('export')}
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};