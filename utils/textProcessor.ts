/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

/**
 * Clean text for publishing requirements:
 * 1. Remove spaces between CJK and English/Number characters.
 * 2. Convert English punctuation to Chinese punctuation in CJK sentences.
 */
export const cleanTextForPublishing = (text: string): string => {
  if (!text) return text;

  // Skip if it looks like a URL or is very short
  if (text.startsWith('http') || text.length < 2) return text;

  let result = text;

  // 1. Remove space between CJK and English/Number
  // CJK: \u4e00-\u9fa5
  // English/Number: a-zA-Z0-9
  
  // Chinese followed by space followed by English/Number
  result = result.replace(/([\u4e00-\u9fa5])\s+([a-zA-Z0-9])/g, '$1$2');
  
  // English/Number followed by space followed by Chinese
  result = result.replace(/([a-zA-Z0-9])\s+([\u4e00-\u9fa5])/g, '$1$2');

  // 2. Convert punctuation in CJK context
  const hasChinese = /[\u4e00-\u9fa5]/.test(result);
  
  if (hasChinese) {
    // Avoid converting if it looks like a number (e.g., 1,000) or a technical term
    
    // Convert , -> ， (if not preceded by a digit and followed by a digit)
    result = result.replace(/([^0-9]),\s*/g, (match, p1) => {
        // If p1 is a Chinese character or English letter, convert it
        if (/[\u4e00-\u9fa5a-zA-Z]/.test(p1)) {
            return p1 + '，';
        }
        return match;
    });

    // Convert ; -> ；
    result = result.replace(/([\u4e00-\u9fa5]);\s*/g, '$1；');
    
    // Convert ! -> ！
    result = result.replace(/([\u4e00-\u9fa5])!\s*/g, '$1！');
    
    // Convert ? -> ？
    result = result.replace(/([\u4e00-\u9fa5])\?\s*/g, '$1？');
    
    // Convert : -> ：
    // Avoid URLs: only convert if preceded by CJK
    result = result.replace(/([\u4e00-\u9fa5]):\s*/g, '$1：');
  }

  return result;
};
