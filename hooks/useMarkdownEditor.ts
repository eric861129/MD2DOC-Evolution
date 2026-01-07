/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import saveAs from 'file-saver';
import { useTranslation } from 'react-i18next';
import { parseMarkdown } from '../services/markdownParser';
import { generateDocx } from '../services/docxGenerator';
import { ParsedBlock, DocumentMeta } from '../services/types';
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
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 計算字數
  const getWordCount = (text: string) => {
    const cleanText = text.replace(/[*#>`~_[\]()]/g, ' ');
    const cjk = (cleanText.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    const latin = (cleanText.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ').match(/\b\w+\b/g) || []).length;
    return cjk + latin;
  };

  // 解析與自動儲存
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { blocks, meta } = parseMarkdown(content);
        setParsedBlocks(blocks);
        setDocumentMeta(meta);
        setWordCount(getWordCount(content));
        localStorage.setItem('draft_content', content);
      } catch (e) {
        console.error("Markdown 解析出錯:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  /**
   * Precise Sync Scroll
   * Maps the textarea's scroll position to the corresponding block in the preview.
   * Uses line-height estimation for the textarea.
   */
  const handleScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current) return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    
    // 1. Calculate the current line number at the top of the viewport
    // Assuming standard line-height of roughly 24px (1.5rem) for the editor font
    // Adjust this value if the CSS line-height changes
    const lineHeight = 24; 
    const currentLine = Math.floor(textarea.scrollTop / lineHeight);
    const totalLines = textarea.value.split('\n').length;
    
    // 2. Percentage fallback for extreme ends
    const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
    if (scrollPercentage > 0.99) {
        preview.scrollTop = preview.scrollHeight - preview.clientHeight;
        return;
    }
    if (scrollPercentage < 0.01) {
        preview.scrollTop = 0;
        return;
    }

    // 3. Find the block corresponding to the current line
    // We map blocks to their approximate source lines.
    // Note: Since we don't have source maps from the parser yet, we estimate based on block index ratio
    // Ideally, the parser should return line numbers for each block.
    // For now, we use a proportional block mapping which is better than raw pixel percentage
    // because it accounts for varying block heights (images vs text).
    
    const blockCount = parsedBlocks.length;
    if (blockCount === 0) return;

    // Estimate block index based on line ratio
    const estimatedBlockIndex = Math.floor((currentLine / totalLines) * blockCount);
    const targetBlockIndex = Math.min(Math.max(0, estimatedBlockIndex), blockCount - 1);
    
    // 4. Scroll preview to that block
    // We assume preview children match parsedBlocks 1:1 (roughly)
    // The preview pane has a wrapper, so we look at its children.
    // The PreviewPane component structure needs to be stable for this.
    const previewContainer = preview.firstElementChild as HTMLElement; // The inner container
    if (previewContainer && previewContainer.children.length > targetBlockIndex) {
        const targetElement = previewContainer.children[targetBlockIndex] as HTMLElement;
        if (targetElement) {
             // Smooth alignment
             // We subtract a small offset so the header isn't hidden under the top edge
             preview.scrollTop = targetElement.offsetTop - 20;
        }
    } else {
        // Fallback to percentage if element matching fails
        preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);
    }
  }, [parsedBlocks]); // Re-create function when blocks change to ensure index mapping is fresh

  // 下載邏輯
  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const sizeConfig = PAGE_SIZES[selectedSizeIndex];
      const blob = await generateDocx(parsedBlocks, { 
        widthCm: sizeConfig.width, 
        heightCm: sizeConfig.height,
        showLineNumbers: true, // Default to true for technical books
        meta: documentMeta
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