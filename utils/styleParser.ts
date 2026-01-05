/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

export enum InlineStyleType {
  BOLD = 'BOLD',
  ITALIC = 'ITALIC',
  UNDERLINE = 'UNDERLINE',
  CODE = 'CODE',
  UI_BUTTON = 'UI_BUTTON',
  LINK = 'LINK',
  SHORTCUT = 'SHORTCUT',
  BOOK = 'BOOK',
  TEXT = 'TEXT'
}

export interface InlineStyleSegment {
  type: InlineStyleType;
  content: string;
  original: string;
  url?: string;
}

export const parseInlineElements = (text: string): InlineStyleSegment[] => {
  // Regex 順序：連結 (必須在 Shortcut 前) > 粗體 > 斜體 > 底線 > 程式碼 > UI按鈕 > 快捷鍵 > 書名號
  // Link: \[.*?\]\(.*?\)
  const regex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(<u>.*?<\/u>)|(`[^`]+`)|(【.*?】)|(\[.*?\])|(『.*?』)/g;
  
  const segments: InlineStyleSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 1. 處理匹配前的普通文字
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      segments.push({
        type: InlineStyleType.TEXT,
        content: plainText,
        original: plainText
      });
    }

    const fullMatch = match[0];
    let type = InlineStyleType.TEXT;
    let content = fullMatch;
    let url: string | undefined = undefined;

    if (fullMatch.startsWith('[') && fullMatch.includes('](')) {
      // Markdown Link: [Text](URL)
      const linkMatch = fullMatch.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        type = InlineStyleType.LINK;
        content = linkMatch[1];
        url = linkMatch[2];
      } else {
        // Fallback (shouldn't happen with correct regex)
        type = InlineStyleType.TEXT;
      }
    } else if (fullMatch.startsWith('**')) {
      type = InlineStyleType.BOLD;
      content = fullMatch.slice(2, -2);
    } else if (fullMatch.startsWith('*')) {
      type = InlineStyleType.ITALIC;
      content = fullMatch.slice(1, -1);
    } else if (fullMatch.startsWith('<u>')) {
      type = InlineStyleType.UNDERLINE;
      content = fullMatch.slice(3, -4);
    } else if (fullMatch.startsWith('`')) {
      type = InlineStyleType.CODE;
      content = fullMatch.slice(1, -1);
    } else if (fullMatch.startsWith('【')) {
      type = InlineStyleType.UI_BUTTON;
      content = fullMatch; // 保留括號
    } else if (fullMatch.startsWith('[')) {
      type = InlineStyleType.SHORTCUT;
      content = fullMatch; // 保留括號
    } else if (fullMatch.startsWith('『')) {
      type = InlineStyleType.BOOK;
      content = fullMatch; // 保留括號
    }

    segments.push({ type, content, original: fullMatch, url });
    lastIndex = regex.lastIndex;
  }

  // 2. 處理剩餘文字
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    segments.push({
      type: InlineStyleType.TEXT,
      content: plainText,
      original: plainText
    });
  }

  return segments;
};
