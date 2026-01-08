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
   * Uses character-index mapping which is more robust against wrapping.
   */
  const handleScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current) return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    
    // 1. Calculate global scroll percentage
    const scrollMax = textarea.scrollHeight - textarea.clientHeight;
    if (scrollMax <= 0) return;
    
    const scrollPercentage = textarea.scrollTop / scrollMax;

    // 2. Map to target character index
    // Character count is a better proxy for visual height than line count 
    // because wrapped lines consume visual space but not logical line count.
    const totalLength = textarea.value.length;
    const targetCharIndex = scrollPercentage * totalLength;

    // 3. Find the matching block
    let targetBlockIndex = 0;
    let blockProgress = 0; // Progress within the block (0 to 1)

    // Corner case: Top of document
    if (scrollPercentage < 0.001) {
        targetBlockIndex = 0;
        blockProgress = 0;
    } else {
        for (let i = 0; i < parsedBlocks.length; i++) {
            const block = parsedBlocks[i];
            const start = block.startIndex ?? 0;
            const end = block.endIndex ?? 0;
            
            if (targetCharIndex >= start && targetCharIndex < end) {
                // Found exact match
                targetBlockIndex = i;
                const len = end - start;
                if (len > 0) {
                    blockProgress = (targetCharIndex - start) / len;
                }
                break;
            } else if (targetCharIndex < start) {
                // We are in a gap before this block (e.g., empty lines)
                // Snap to this block's start
                targetBlockIndex = i;
                blockProgress = 0;
                break;
            }
            // Otherwise, we are past this block. Keep searching.
            // If we reach the end, targetBlockIndex remains at the last block.
            targetBlockIndex = i;
            blockProgress = 1;
        }
    }
    
    // 4. Scroll preview
    const previewContainer = preview.firstElementChild as HTMLElement; 
    if (previewContainer && previewContainer.children.length > targetBlockIndex) {
        const targetElement = previewContainer.children[targetBlockIndex] as HTMLElement;
        if (targetElement) {
             // Calculate precise position within the element
             const elementTop = targetElement.offsetTop;
             const elementHeight = targetElement.offsetHeight;
             
             // Base target position
             let targetScrollTop = elementTop + (elementHeight * blockProgress);
             
             // Apply offset to keep context (e.g., 20px padding)
             // But if we are deep in a block, center it? 
             // For now, keep simple offset logic but respect element boundaries
             targetScrollTop -= 20;

             preview.scrollTop = targetScrollTop;
        }
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
      
      // Use title from meta if available, sanitize it
      const safeTitle = documentMeta.title 
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_') 
        : "Professional_Manuscript";
        
      saveAs(blob, `${safeTitle}.docx`);
    } catch (error) {
      console.error("Word 轉檔失敗:", error);
      alert("轉檔失敗，請確認內容格式是否正確。");
    } finally {
      setIsGenerating(false);
    }
  };

  // 匯出 Markdown
  const handleExportMarkdown = () => {
    if (!content) return;
    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      
      const safeTitle = documentMeta.title 
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_') 
        : "manuscript";
        
      saveAs(blob, `${safeTitle}.md`);
    } catch (error) {
      console.error("Markdown 匯出失敗:", error);
      alert("匯出失敗");
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
    handleExportMarkdown,
    resetToDefault,
    language,
    toggleLanguage,
    t,
    pageSizes: PAGE_SIZES
  };
};