/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useDarkMode } from '../hooks/useDarkMode';

type EditorContextType = ReturnType<typeof useMarkdownEditor> & ReturnType<typeof useDarkMode>;

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  editorState: ReturnType<typeof useMarkdownEditor>;
  darkModeState: ReturnType<typeof useDarkMode>;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children, editorState, darkModeState }) => {
  return (
    <EditorContext.Provider value={{ ...editorState, ...darkModeState }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
