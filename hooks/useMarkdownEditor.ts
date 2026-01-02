/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { useState, useEffect, useRef } from 'react';
import saveAs from 'file-saver';
import { useTranslation } from 'react-i18next';
import { parseMarkdown } from '../services/markdownParser';
import { generateDocx } from '../services/docxGenerator';
import { ParsedBlock } from '../services/types';
import { INITIAL_CONTENT_ZH, INITIAL_CONTENT_EN } from '../constants/defaultContent';

export const PAGE_SIZES = [
  { name: "tech", width: 17, height: 23 },
  { name: "a4", width: 21, height: 29.7 },
  { name: "a5", width: 14.8, height: 21 },
  { name: "b5", width: 17.6, height: 25 },
];

export const useMarkdownEditor = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split('-')[0]; // Handle cases like 'zh-TW'

  const getInitialContent = (lang: string) => lang.startsWith('zh') ? INITIAL_CONTENT_ZH : INITIAL_CONTENT_EN;

  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || getInitialContent(i18n.language);
  });
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 計算字數
  const getWordCount = (text: string) => {
    const cleanText = text.replace(/[*#>`~_\[\]()]/g, ' ');
    const cjk = (cleanText.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    const latin = (cleanText.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ').match(/\b\w+\b/g) || []).length;
    return cjk + latin;
  };

  // 解析與自動儲存
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const blocks = parseMarkdown(content);
        setParsedBlocks(blocks);
        setWordCount(getWordCount(content));
        localStorage.setItem('draft_content', content);
      } catch (e) {
        console.error("Markdown 解析出錯:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  // 同步捲動邏輯
  const handleScroll = () => {
    if (!textareaRef.current || !previewRef.current) return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    const percentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
    preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
  };

  // 下載邏輯
  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const sizeConfig = PAGE_SIZES[selectedSizeIndex];
      const blob = await generateDocx(parsedBlocks, { 
        widthCm: sizeConfig.width, 
        heightCm: sizeConfig.height 
      });
      saveAs(blob, "Professional_Manuscript.docx");
    } catch (error) {
      console.error("Word 轉檔失敗:", error);
      alert("轉檔失敗，請確認內容格式是否正確。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 切換語言
  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    
    // 如果內容有變更，詢問使用者是否要切換範例內容
    if (confirm(t('switchLangConfirm'))) {
      i18n.changeLanguage(nextLang);
      setContent(getInitialContent(nextLang));
      localStorage.removeItem('draft_content');
    }
  };

  // 重置內容
  const resetToDefault = () => {
    if (confirm(t('resetConfirm'))) {
      setContent(getInitialContent(i18n.language));
      localStorage.removeItem('draft_content');
    }
  };

  return {
    content,
    setContent,
    parsedBlocks,
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    wordCount,
    textareaRef,
    previewRef,
    handleScroll,
    handleDownload,
    resetToDefault,
    language,
    toggleLanguage,
    t,
    pageSizes: PAGE_SIZES
  };
};
