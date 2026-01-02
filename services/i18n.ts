/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  zh: {
    translation: {
      title: 'BookPublisher',
      subtitle: '核心引擎：Markdown -> Word (v2.0)',
      export: '匯出 Word',
      exporting: '正在轉換...',
      reset: '重置為範例文件',
      resetConfirm: '確定要重置內容嗎？您目前的編輯將會遺失並恢復為預設範例。',
      switchLangConfirm: '切換語言將會重置當前內容為該語言的範例文件。確定要繼續嗎？',
      theme: {
        light: '切換至亮色模式',
        dark: '切換至深色模式'
      },
      sizes: {
        tech: '技術書籍 (17x23cm)',
        a4: 'A4 (21x29.7cm)',
        a5: 'A5 (14.8x21cm)',
        b5: 'B5 (17.6x25cm)'
      }
    }
  },
  en: {
    translation: {
      title: 'BookPublisher',
      subtitle: 'Core Engine: Markdown -> Word (v2.0)',
      export: 'Export DOCX',
      exporting: 'Converting...',
      reset: 'Reset to Example',
      resetConfirm: 'Are you sure you want to reset? Your current changes will be lost.',
      switchLangConfirm: 'Switching language will reset the content to the default example of that language. Continue?',
      theme: {
        light: 'Switch to Light Mode',
        dark: 'Switch to Dark Mode'
      },
      sizes: {
        tech: 'Tech Book (17x23cm)',
        a4: 'A4 (21x29.7cm)',
        a5: 'A5 (14.8x21cm)',
        b5: 'B5 (17.6x25cm)'
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
