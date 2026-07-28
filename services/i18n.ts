/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { APP_VERSION } from '../constants/meta';

export const resources = {
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
      layout: {
        openSettings: '版面設定',
        profile: '文件版型',
        pageSize: '紙張尺寸',
        marginPreset: '頁面邊界',
        standardMargins: '一般邊界',
        mirroredMargins: '鏡像邊界',
        marginMode: '邊界模式',
        topMargin: '上邊界',
        bottomMargin: '下邊界',
        leftMargin: '左邊界',
        rightMargin: '右邊界',
        insideMargin: '內側邊界',
        outsideMargin: '外側邊界',
        gutter: '裝訂預留',
        gutterPosition: '裝訂預留位置',
        gutterLeft: '左側',
        gutterTop: '上方',
        pageWidth: '紙張寬度',
        pageHeight: '紙張高度',
        contentArea: '有效內容區域',
        apply: '套用版面設定',
        cancel: '取消',
        custom: '自訂',
        notAvailable: '無法計算',
        invalidGeometry: '目前的紙張與邊界設定無法產生有效內容區域。',
        customizedWarning: '已自訂出版社版型，頁碼可能與參考稿不同。',
        printRiskWarning: '邊界小於 1 公分，部分印表機可能無法完整列印。',
        profiles: {
          'technical-legacy': '技術書稿（相容舊版）',
          'publisher-exact': '出版社精確版型',
          'publisher-narrow': '出版社窄邊界版型',
          'publisher-binding': '出版社裝訂版型'
        },
        marginPresets: {
          narrow: '窄邊界',
          compact: '緊湊',
          balanced: '平衡',
          standard: '標準',
          'publisher-exact': '出版社精確邊界',
          'publisher-binding': '出版社裝訂邊界'
        }
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
      layout: {
        openSettings: 'Layout settings',
        profile: 'Document profile',
        pageSize: 'Page size',
        marginPreset: 'Page margins',
        standardMargins: 'Standard margins',
        mirroredMargins: 'Mirrored margins',
        marginMode: 'Margin mode',
        topMargin: 'Top margin',
        bottomMargin: 'Bottom margin',
        leftMargin: 'Left margin',
        rightMargin: 'Right margin',
        insideMargin: 'Inside margin',
        outsideMargin: 'Outside margin',
        gutter: 'Gutter',
        gutterPosition: 'Gutter position',
        gutterLeft: 'Left',
        gutterTop: 'Top',
        pageWidth: 'Page width',
        pageHeight: 'Page height',
        contentArea: 'Effective content area',
        apply: 'Apply layout settings',
        cancel: 'Cancel',
        custom: 'Custom',
        notAvailable: 'Unavailable',
        invalidGeometry: 'The selected page and margins do not leave a valid content area.',
        customizedWarning: 'This publisher profile was customized; pagination may differ from the reference manuscript.',
        printRiskWarning: 'Margins below 1 cm may not print completely on some printers.',
        profiles: {
          'technical-legacy': 'Technical manuscript (legacy compatible)',
          'publisher-exact': 'Publisher exact profile',
          'publisher-narrow': 'Publisher narrow-margin profile',
          'publisher-binding': 'Publisher binding profile'
        },
        marginPresets: {
          narrow: 'Narrow',
          compact: 'Compact',
          balanced: 'Balanced',
          standard: 'Standard',
          'publisher-exact': 'Publisher exact',
          'publisher-binding': 'Publisher binding'
        }
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
