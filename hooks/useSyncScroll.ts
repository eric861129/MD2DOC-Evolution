import { useRef, useCallback } from 'react';

/**
 * Hook for synchronized scrolling between editor and preview.
 * Currently uses percentage-based synchronization.
 */
export const useSyncScroll = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current) return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    
    // Calculate scroll percentage
    const scrollMax = textarea.scrollHeight - textarea.clientHeight;
    if (scrollMax <= 0) return;
    
    const scrollPercentage = textarea.scrollTop / scrollMax;
    
    // Apply to preview
    const previewScrollMax = preview.scrollHeight - preview.clientHeight;
    preview.scrollTop = scrollPercentage * previewScrollMax;
    
  }, []);

  return {
    textareaRef,
    previewRef,
    handleScroll
  };
};
