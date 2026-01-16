/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { PAGE_SIZES } from '../constants/meta';
import { useEditorState } from './useEditorState';
import { useWordCount } from './useWordCount';
import { useSyncScroll } from './useSyncScroll';
import { useDocxExport } from './useDocxExport';

// Re-export for compatibility
export { PAGE_SIZES } from '../constants/meta';

/**
 * Main hook for the Markdown Editor.
 * Refactored in v1.2.8 to act as a composition root for specialized hooks.
 */
export const useMarkdownEditor = () => {
  // 1. Core Editor State (Content, Parsing, Persistence)
  const {
    content,
    setContent,
    parsedBlocks,
    documentMeta,
    imageRegistry,
    registerImage,
    language,
    toggleLanguage,
    resetToDefault,
    t
  } = useEditorState();

  // 2. Computed Metrics (Word Count)
  const wordCount = useWordCount(content);

  // 3. UI Interactions (Sync Scroll)
  const { textareaRef, previewRef, handleScroll } = useSyncScroll();

  // 4. Export Capabilities (DOCX, MD)
  const {
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    pageSizes
  } = useDocxExport({ content, parsedBlocks, documentMeta, imageRegistry });

  return {
    // State
    content,
    setContent,
    parsedBlocks,
    documentMeta,
    imageRegistry,
    registerImage,
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    wordCount,
    language,
    
    // Refs
    textareaRef,
    previewRef,
    
    // Actions
    handleScroll,
    handleDownload,
    handleExportMarkdown,
    resetToDefault,
    toggleLanguage,
    
    // Helpers/Constants
    t,
    pageSizes
  };
};
