/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Download,
  FileText,
  Languages,
  Moon,
  RotateCcw,
  Settings2,
  Sun,
} from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Select } from '../ui/Select';
import { AIPromptModal } from '../AIPromptModal';

interface EditorHeaderProps {
  activeMobilePanel: 'editor' | 'preview';
  onMobilePanelChange: (panel: 'editor' | 'preview') => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  activeMobilePanel,
  onMobilePanelChange,
}) => {
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
    isValidatingExport,
    parsedBlocks,
    documentMeta,
    wordCount,
    isDark,
    toggleDarkMode,
    exportError,
    clearExportError,
    validationIssues,
    showValidationIssues,
    setShowValidationIssues,
  } = useEditor();

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const hasContent = parsedBlocks.length > 0;
  const hasFrontmatter = Boolean(documentMeta.title || documentMeta.author);
  const logoPath = `${import.meta.env.BASE_URL}logo.svg`;
  const validationIssueCount = validationIssues.length;
  const exportReadinessLabel = !hasContent
    ? t('workspace.waitingContent')
    : isValidatingExport
      ? t('workspace.exportChecking')
      : validationIssueCount > 0
        ? t('workspace.exportWarnings', { count: validationIssueCount })
        : t('workspace.exportValid');

  const stats = [
    {
      label: t('workspace.words'),
      value: wordCount.toLocaleString(),
      className: 'col-span-1',
    },
    {
      label: t('workspace.blocks'),
      value: parsedBlocks.length.toLocaleString(),
      className: 'col-span-1',
    },
    {
      label: 'DOCX',
      value: exportReadinessLabel,
      className: 'col-span-1',
    },
    {
      label: 'Meta',
      value: hasFrontmatter ? t('workspace.frontmatterReady') : t('workspace.frontmatterMissing'),
      className: 'col-span-1',
    },
  ];

  return (
    <header className="workspace-glass relative z-20 mx-3 mt-3 rounded-md px-3 py-3 md:mx-5 md:px-5">
      <nav className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" aria-label="MD2DOC workspace">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 p-1.5 dark:bg-white">
            <img src={logoPath} alt="MD2DOC-Evolution logo" className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <h1 className="max-w-5xl truncate text-2xl font-black leading-none text-slate-950 dark:text-white md:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-1 max-w-2xl truncate text-sm font-medium text-slate-600 dark:text-slate-300">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            <button
              type="button"
              onClick={() => onMobilePanelChange('editor')}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                activeMobilePanel === 'editor'
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t('workspace.mobileEditor')}
            </button>
            <button
              type="button"
              onClick={() => onMobilePanelChange('preview')}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                activeMobilePanel === 'preview'
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t('workspace.mobilePreview')}
            </button>
          </div>

          <IconButton onClick={() => setIsAIModalOpen(true)} title={t('aiPrompt')}>
            <Bot className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={resetToDefault} title={t('reset')}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={toggleLanguage} title="Switch language">
            <Languages className="h-4 w-4" />
            <span className="sr-only">{language === 'zh' ? 'English' : 'Chinese'}</span>
          </IconButton>
          <IconButton onClick={toggleDarkMode} title={isDark ? t('theme.light') : t('theme.dark')}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>

          <Select
            icon={<Settings2 className="h-4 w-4" />}
            value={selectedSizeIndex}
            onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
            containerClassName="min-w-[12rem]"
            aria-label="Page size"
          >
            {pageSizes.map((size, index) => (
              <option key={size.name} value={index} className="dark:bg-slate-900">
                {t(`sizes.${size.name}`)}
              </option>
            ))}
          </Select>

          <Button onClick={handleExportMarkdown} disabled={!hasContent} variant="secondary">
            <FileText className="h-4 w-4" />
            {t('exportMD')}
          </Button>

          <Button onClick={handleDownload} disabled={!hasContent} isLoading={isGenerating}>
            <Download className="h-4 w-4" />
            {isGenerating ? t('exporting') : t('export')}
          </Button>
        </div>
      </nav>

      <div className="mt-4 grid grid-flow-dense grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-md border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40 ${stat.className}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {stat.label}
            </div>
            <div className="mt-1 truncate text-sm font-bold text-slate-950 dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {hasContent && validationIssueCount > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
          <button
            type="button"
            onClick={() => setShowValidationIssues(!showValidationIssues)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold"
            aria-expanded={showValidationIssues}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {t('workspace.exportWarningPanel')}：{t('workspace.exportWarnings', { count: validationIssueCount })}
              </span>
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.14em]">
              {showValidationIssues ? t('workspace.hideExportWarnings') : t('workspace.showExportWarnings')}
            </span>
          </button>
          {showValidationIssues && (
            <ul className="space-y-2 border-t border-amber-200/80 px-3 py-3 text-sm dark:border-amber-900/70">
              {validationIssues.map((issue) => (
                <li key={issue.id} className="rounded border border-amber-200/80 bg-white/70 p-3 dark:border-amber-900/70 dark:bg-slate-950/30">
                  <div className="font-bold">{issue.title}</div>
                  <div className="mt-1 leading-6">{issue.message}</div>
                  {issue.sourceLine !== undefined && (
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
                      Line {issue.sourceLine + 1}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {exportError && (
        <button
          type="button"
          onClick={clearExportError}
          className="mt-3 w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200"
        >
          {exportError}
        </button>
      )}

      <AIPromptModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </header>
  );
};
