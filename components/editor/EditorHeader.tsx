/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React, { useState } from 'react';
import { Settings2, Download, Sun, Moon, RotateCcw, Languages, FileText, Bot } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Select } from '../ui/Select';
import { AIPromptModal } from '../AIPromptModal';

export const EditorHeader: React.FC = () => {
  const {
    pageSizes,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    resetToDefault,
    language,
    toggleLanguage,
    t,
    isGenerating,
    parsedBlocks,
    isDark,
    toggleDarkMode
  } = useEditor();

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

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
            {t('title')}
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t('subtitle')}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Action Group: Reset, Language, Theme */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
          {/* AI Prompt Button */}
          <IconButton
            onClick={() => setIsAIModalOpen(true)}
            title={t('aiPrompt')}
            className="bg-transparent border-none hover:bg-white dark:hover:bg-slate-700 shadow-none text-indigo-600 dark:text-indigo-400"
          >
            <Bot className="w-4 h-4" />
          </IconButton>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Reset Button */}
          <IconButton
            onClick={resetToDefault}
            title={t('reset')}
            className="bg-transparent border-none hover:bg-white dark:hover:bg-slate-700 shadow-none"
          >
            <RotateCcw className="w-4 h-4" />
          </IconButton>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Language Toggle */}
          <IconButton
            onClick={toggleLanguage}
            className="bg-transparent border-none hover:bg-white dark:hover:bg-slate-700 shadow-none gap-2 px-3 w-auto"
            title="Switch Language / 切換語言"
          >
            <Languages className="w-4 h-4" />
            <span className="text-xs font-bold">{language === 'zh' ? 'EN' : '中'}</span>
          </IconButton>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleDarkMode}
            title={isDark ? t('theme.light') : t('theme.dark')}
            className="bg-transparent border-none hover:bg-white dark:hover:bg-slate-700 shadow-none"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>
        </div>

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
          onClick={handleExportMarkdown}
          disabled={!hasContent}
          variant="secondary"
          title={t('exportMD')}
        >
          {t('exportMD')}
          <FileText className="w-4 h-4" />
        </Button>

        <Button
          onClick={handleDownload}
          disabled={!hasContent}
          isLoading={isGenerating}
        >
          {isGenerating ? t('exporting') : t('export')}
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <AIPromptModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />
    </header>
  );
};
