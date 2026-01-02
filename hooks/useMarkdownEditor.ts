/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { useState, useEffect, useRef } from 'react';
import saveAs from 'file-saver';
import { parseMarkdown } from '../services/markdownParser';
import { generateDocx } from '../services/docxGenerator';
import { ParsedBlock } from '../types';
import { INITIAL_CONTENT } from '../constants/defaultContent';

export const PAGE_SIZES = [
  { name: "技術書籍 (17x23cm)", width: 17, height: 23 },
  { name: "A4 (21x29.7cm)", width: 21, height: 29.7 },
  { name: "A5 (14.8x21cm)", width: 14.8, height: 21 },
  { name: "B5 (17.6x25cm)", width: 17.6, height: 25 },
];

export const useMarkdownEditor = () => {
  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || INITIAL_CONTENT;
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

  const resetToDefault = () => {
    if (confirm('確定要重置內容嗎？您目前的編輯將會遺失並恢復為預設範例。')) {
      setContent(INITIAL_CONTENT);
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
    pageSizes: PAGE_SIZES
  };
};
