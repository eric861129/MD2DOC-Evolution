import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parseMarkdown } from '../services/markdownParser';
import { ParsedBlock, DocumentMeta } from '../services/types';
import { INITIAL_CONTENT_ZH, INITIAL_CONTENT_EN } from '../constants/defaultContent';

export const useEditorState = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split('-')[0];

  const getInitialContent = (lang: string) => lang.startsWith('zh') ? INITIAL_CONTENT_ZH : INITIAL_CONTENT_EN;

  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || getInitialContent(i18n.language);
  });
  
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({});
  const [imageRegistry, setImageRegistry] = useState<Record<string, string>>({});

  const registerImage = (id: string, base64: string) => {
    setImageRegistry(prev => ({ ...prev, [id]: base64 }));
  };

  // Parsing & Auto-save (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { blocks, meta } = parseMarkdown(content);
        setParsedBlocks(blocks);
        setDocumentMeta(meta);
        localStorage.setItem('draft_content', content);
      } catch (e) {
        console.error("Markdown parsing error:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  // Language Toggle Logic
  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    
    if (confirm(t('switchLangConfirm'))) {
      i18n.changeLanguage(nextLang);
      setContent(getInitialContent(nextLang));
      localStorage.removeItem('draft_content');
      setImageRegistry({});
    }
  };

  // Reset Logic
  const resetToDefault = () => {
    if (confirm(t('resetConfirm'))) {
      setContent(getInitialContent(i18n.language));
      localStorage.removeItem('draft_content');
      setImageRegistry({});
    }
  };

  return {
    content,
    setContent,
    parsedBlocks,
    documentMeta,
    imageRegistry,
    registerImage,
    language,
    toggleLanguage,
    resetToDefault,
    t // Export translation helper if needed
  };
};
