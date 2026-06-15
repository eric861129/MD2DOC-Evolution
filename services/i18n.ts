/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { APP_VERSION } from '../constants/meta';

const resources = {
  zh: {
    translation: {
      title: 'MD2DOC-Evolution',
      subtitle: `Markdown 到 Word 的技術書稿工作台 v${APP_VERSION}`,
      export: '匯出 DOCX',
      exportMD: '匯出 Markdown',
      exporting: '轉檔中...',
      aiPrompt: 'AI 轉稿提示',
      reset: '重設範例',
      resetConfirm: '確定要重設為範例內容嗎？目前草稿會被取代。',
      switchLangConfirm: '切換語言會載入該語言的範例內容，並清除目前草稿。要繼續嗎？',
      theme: {
        light: '切換為淺色模式',
        dark: '切換為深色模式'
      },
      sizes: {
        tech: '技術書稿 (17x23cm)',
        a4: 'A4 (21x29.7cm)',
        a5: 'A5 (14.8x21cm)',
        b5: 'B5 (17.6x25cm)'
      },
      workspace: {
        editor: '稿件編輯',
        preview: '列印預覽',
        source: 'Markdown 草稿',
        blocks: '區塊',
        words: '字數',
        frontmatterReady: 'Frontmatter 已設定',
        frontmatterMissing: '尚未設定標題或作者',
        lineNumbers: '程式碼行號',
        exportReady: '已準備好匯出',
        exportValid: '可匯出',
        exportChecking: '檢查中',
        exportWarnings: '{{count}} 項提醒',
        exportWarningPanel: '匯出前提醒',
        showExportWarnings: '展開',
        hideExportWarnings: '收合',
        waitingContent: '等待內容',
        emptyTitle: '開始建立你的技術書稿',
        emptyDescription: '輸入 Markdown、拖入 .md 檔案，或使用左側工具快速插入常用區塊。',
        mobileEditor: '編輯',
        mobilePreview: '預覽',
        zoomIn: '放大預覽',
        zoomOut: '縮小預覽',
        fitWidth: '符合寬度'
      }
    }
  },
  en: {
    translation: {
      title: 'MD2DOC-Evolution',
      subtitle: `Markdown to Word workspace v${APP_VERSION}`,
      export: 'Export DOCX',
      exportMD: 'Export Markdown',
      exporting: 'Converting...',
      aiPrompt: 'AI prompt',
      reset: 'Reset example',
      resetConfirm: 'Reset to the example content? Your current draft will be replaced.',
      switchLangConfirm: 'Switching language loads the example for that language and clears the current draft. Continue?',
      theme: {
        light: 'Switch to light mode',
        dark: 'Switch to dark mode'
      },
      sizes: {
        tech: 'Technical book (17x23cm)',
        a4: 'A4 (21x29.7cm)',
        a5: 'A5 (14.8x21cm)',
        b5: 'B5 (17.6x25cm)'
      },
      workspace: {
        editor: 'Manuscript editor',
        preview: 'Print preview',
        source: 'Markdown draft',
        blocks: 'Blocks',
        words: 'Words',
        frontmatterReady: 'Frontmatter ready',
        frontmatterMissing: 'Title or author missing',
        lineNumbers: 'Code line numbers',
        exportReady: 'Ready to export',
        exportValid: 'Ready',
        exportChecking: 'Checking',
        exportWarnings: '{{count}} warnings',
        exportWarningPanel: 'Pre-export warnings',
        showExportWarnings: 'Show',
        hideExportWarnings: 'Hide',
        waitingContent: 'Waiting for content',
        emptyTitle: 'Start your technical manuscript',
        emptyDescription: 'Write Markdown, drop in an .md file, or use the tool rail to insert common blocks.',
        mobileEditor: 'Editor',
        mobilePreview: 'Preview',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        fitWidth: 'Fit width'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
