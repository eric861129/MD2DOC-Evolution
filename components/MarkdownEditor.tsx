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
  const [splitPercent, setSplitPercent] = React.useState(50);
  const isResizing = React.useRef(false);
  
  const {
    content,
    setContent,
    parsedBlocks,
    wordCount,
    textareaRef,
    previewRef,
    handleScroll,
  } = editorState;

  const startResizing = React.useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    
    // Calculate new percentage based on mouse position relative to the main container
    const sidebarWidth = 64; // QuickActionSidebar width is w-16 = 4rem = 64px
    const containerWidth = window.innerWidth - sidebarWidth;
    const mouseX = e.clientX - sidebarWidth;
    
    const newPercent = (mouseX / containerWidth) * 100;
    
    // Constrain between 20% and 80%
    if (newPercent >= 20 && newPercent <= 80) {
      setSplitPercent(newPercent);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <EditorProvider editorState={editorState} darkModeState={darkModeState}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
        <EditorHeader />

        <main className="flex flex-1 overflow-hidden relative">
          <QuickActionSidebar />
          
          <div style={{ width: `${splitPercent}%` }} className="flex flex-col h-full">
            <EditorPane 
              content={content}
              setContent={setContent}
              wordCount={wordCount}
              textareaRef={textareaRef}
              onScroll={handleScroll}
            />
          </div>

                    {/* Resizable Divider */}
                    <div 
                      onMouseDown={startResizing}
                      className="w-1.5 h-full cursor-col-resize resizer-product transition-colors z-10 flex items-center justify-center group"
                    >
                      <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 group-hover:bg-product rounded-full transition-colors" />
                    </div>
          <div style={{ width: `${100 - splitPercent}%` }} className="flex flex-col h-full">
            <PreviewPane 
              parsedBlocks={parsedBlocks}
              previewRef={previewRef}
              />
          </div>
        </main>
        
        <Footer />
      </div>
    </EditorProvider>
  );
};

export default MarkdownEditor;