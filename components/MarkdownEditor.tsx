/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useDarkMode } from '../hooks/useDarkMode';

// Components
import { EditorHeader } from './editor/EditorHeader';
import { EditorPane } from './editor/EditorPane';
import { PreviewPane } from './editor/PreviewPane';

const MarkdownEditor: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  
  const {
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
    pageSizes
  } = useMarkdownEditor();

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      <EditorHeader 
        pageSizes={pageSizes}
        selectedSizeIndex={selectedSizeIndex}
        onSizeChange={setSelectedSizeIndex}
        onDownload={handleDownload}
        isGenerating={isGenerating}
        hasContent={parsedBlocks.length > 0}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="flex flex-1 overflow-hidden">
        <EditorPane 
          content={content}
          setContent={setContent}
          wordCount={wordCount}
          textareaRef={textareaRef}
          onScroll={handleScroll}
        />

        <PreviewPane 
          parsedBlocks={parsedBlocks}
          previewRef={previewRef}
        />
      </main>
    </div>
  );
};

export default MarkdownEditor;