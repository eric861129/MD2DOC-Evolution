/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Settings2, Download, Sun, Moon, RotateCcw, Languages } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Select } from '../ui/Select';

export const EditorHeader: React.FC = () => {
  const {
    pageSizes,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    resetToDefault,
    language,
    toggleLanguage,
    t,
    isGenerating,
    parsedBlocks,
    isDark,
    toggleDarkMode
  } = useEditor();

  const logoPath = `${import.meta.env.BASE_URL}logo.svg`;
  const hasContent = parsedBlocks.length > 0;

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
        <IconButton
          onClick={resetToDefault}
          title={t('reset')}
        >
          <RotateCcw className="w-4 h-4" />
        </IconButton>

        {/* Language Toggle */}
        <IconButton
          onClick={toggleLanguage}
          className="gap-2 px-3 w-auto"
          title="Switch Language / 切換語言"
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs font-medium">{language === 'zh' ? 'EN' : '中'}</span>
        </IconButton>

        {/* Theme Toggle */}
        <IconButton
          onClick={toggleDarkMode}
          title={isDark ? t('theme.light') : t('theme.dark')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </IconButton>

        {/* 版面尺寸選擇器 */}
        <Select 
          icon={<Settings2 className="w-4 h-4" />}
          value={selectedSizeIndex}
          onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
        >
            {pageSizes.map((size, index) => (
              <option key={index} value={index} className="dark:bg-slate-800">
                {t(`sizes.${size.name}`)}
              </option>
            ))}
        </Select>

        <Button
          onClick={handleDownload}
          disabled={!hasContent}
          isLoading={isGenerating}
        >
          {isGenerating ? t('exporting') : t('export')}
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
