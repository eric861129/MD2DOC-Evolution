import { useMemo } from 'react';

/**
 * Hook for calculating word count of Markdown content.
 * Optimized with useMemo to avoid recalculation on every render.
 */
export const useWordCount = (text: string) => {
  const wordCount = useMemo(() => {
    if (!text) return 0;
    
    // Remove Markdown syntax characters roughly
    const cleanText = text.replace(/[*#>`~_[\]()]/g, ' ');
    
    // Count CJK (Chinese/Japanese/Korean) characters
    const cjk = (cleanText.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
    
    // Count Latin words (English, etc.)
    const latin = (cleanText
      .replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ')
      .match(/\b\w+\b/g) || []
    ).length;
    
    return cjk + latin;
  }, [text]);

  return wordCount;
};
