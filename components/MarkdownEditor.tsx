/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useDarkMode } from '../hooks/useDarkMode';
import { EditorProvider } from '../contexts/EditorContext';

// Components
import { EditorHeader } from './editor/EditorHeader';
import { QuickActionSidebar } from './editor/QuickActionSidebar';
import { EditorPane } from './editor/EditorPane';
import { PreviewPane } from './editor/PreviewPane';
import Footer from './Footer';

const MarkdownEditor: React.FC = () => {
  const darkModeState = useDarkMode();
  const editorState = useMarkdownEditor();
  
  const {
    content,
    setContent,
    parsedBlocks,
    wordCount,
    textareaRef,
    previewRef,
    handleScroll,
  } = editorState;

  return (
    <EditorProvider editorState={editorState} darkModeState={darkModeState}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
        <EditorHeader />

        <main className="flex flex-1 overflow-hidden">
          <QuickActionSidebar />
          
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
        
        <Footer />
      </div>
    </EditorProvider>
  );
};

export default MarkdownEditor;