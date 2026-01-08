/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { marked } from 'marked';
import { BlockType, ParsedBlock } from '../types';

// Configure marked options if needed
marked.use({
  breaks: true,
  gfm: true,
});

export const parseMarkdownWithAST = (markdown: string, lineOffset: number = 0, charOffset: number = 0): ParsedBlock[] => {
  const tokens = marked.lexer(markdown);
  const blocks: ParsedBlock[] = [];
  
  let currentLine = lineOffset;
  let currentIndex = charOffset;

  const processToken = (token: any, blockStartLine: number, blockStartIndex: number) => {
    // Helper to add block with source info
    const addBlock = (block: ParsedBlock) => {
        blocks.push({
            ...block,
            sourceLine: blockStartLine,
            startIndex: blockStartIndex,
            endIndex: blockStartIndex + token.raw.length
        });
    };

    switch (token.type) {
      case 'heading':
        const headingType = 
          token.depth === 1 ? BlockType.HEADING_1 :
          token.depth === 2 ? BlockType.HEADING_2 :
          BlockType.HEADING_3;
        addBlock({
          type: headingType,
          content: token.text
        });
        break;

      case 'paragraph':
        const text = token.text;

        // 1. TOC
        if (text.trim() === '[TOC]' || text.trim() === '[toc]') {
          addBlock({ type: BlockType.TOC, content: '' });
          break;
        }

        // 2. Chat Dialogues
        const centerMatch = text.match(/^(.+?)\s*:\":\s*(.*)$/);
        if (centerMatch) {
            addBlock({ type: BlockType.CHAT_CUSTOM, role: centerMatch[1].trim(), content: centerMatch[2].trim(), alignment: 'center' });
            break;
        }
        const rightMatch = text.match(/^(.+?)\s*::\"\s*(.*)$/);
        if (rightMatch) {
            addBlock({ type: BlockType.CHAT_CUSTOM, role: rightMatch[1].trim(), content: rightMatch[2].trim(), alignment: 'right' });
            break;
        }
        const leftMatch = text.match(/^(.+?)\s*\"(?:::)\s*(.*)$/);
        if (leftMatch) {
            addBlock({ type: BlockType.CHAT_CUSTOM, role: leftMatch[1].trim(), content: leftMatch[2].trim(), alignment: 'left' });
            break;
        }

        addBlock({
          type: BlockType.PARAGRAPH,
          content: token.text
        });
        break;

      case 'code':
        if (token.lang === 'mermaid') {
          addBlock({
            type: BlockType.MERMAID,
            content: token.text
          });
        } else {
          let language = token.lang || '';
          let showLineNumbers: boolean | undefined = undefined;

          if (language.includes(':')) {
            const parts = language.split(':');
            language = parts[0].trim();
            const modifier = parts[1].trim().toLowerCase();
            if (['ln', 'line', 'yes'].includes(modifier)) {
              showLineNumbers = true;
            } else if (['no-ln', 'plain', 'no'].includes(modifier)) {
              showLineNumbers = false;
            }
          }

          addBlock({
            type: BlockType.CODE_BLOCK,
            content: token.text,
            metadata: {
              language,
              showLineNumbers
            }
          });
        }
        break;

      case 'blockquote':
        const rawBlockquote = token.tokens.map((t: any) => t.raw).join('').trim();
        let calloutType = BlockType.QUOTE_BLOCK;
        let content = rawBlockquote;

        const firstToken = token.tokens[0];
        if (firstToken && firstToken.type === 'paragraph') {
           const firstLine = firstToken.text.trim();
           if (firstLine.startsWith('[!TIP]')) {
             calloutType = BlockType.CALLOUT_TIP;
             content = rawBlockquote.replace(/^\\[!TIP\\]\s*/m, '').trim(); 
             // Simplified stripping for now, matching previous logic roughly
             // Re-implementing specific stripping if needed
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!TIP]')) lines[0] = lines[0].replace('[!TIP]', '').trim();
             content = lines.join('\n');

           } else if (firstLine.startsWith('[!WARNING]')) {
             calloutType = BlockType.CALLOUT_WARNING;
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!WARNING]')) lines[0] = lines[0].replace('[!WARNING]', '').trim();
             content = lines.join('\n');

           } else if (firstLine.startsWith('[!NOTE]')) {
             calloutType = BlockType.CALLOUT_NOTE;
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!NOTE]')) lines[0] = lines[0].replace('[!NOTE]', '').trim();
             content = lines.join('\n');
           }
        }
        
        addBlock({
             type: calloutType,
             content: content
        });
        break;

      case 'list':
        token.items.forEach((item: any) => {
          const cleanText = item.text.replace(/^\\[[ x]\\]\s*/, ''); 
          addBlock({
            type: token.ordered ? BlockType.NUMBERED_LIST : BlockType.BULLET_LIST,
            content: cleanText 
          });
        });
        break;

      case 'table':
        const headers = token.header.map((h: any) => h.text);
        const rows = token.rows.map((row: any) => row.map((cell: any) => cell.text));
        const allRows = [headers, ...rows];
        
        addBlock({
            type: BlockType.TABLE,
            content: '',
            tableRows: allRows
        });
        break;

      case 'hr':
        addBlock({ type: BlockType.HORIZONTAL_RULE, content: '' });
        break;
        
      case 'space':
        break;

      default:
        console.warn(`Unknown token type: ${token.type}`, token);
        break;
    }
  };

  tokens.forEach(token => {
     const raw = token.raw;
     const newlines = (raw.match(/\n/g) || []).length;
     const len = raw.length;
     
     const blockStartLine = currentLine;
     const blockStartIndex = currentIndex;
     
     currentLine += newlines;
     currentIndex += len;
     
     if (token.type === 'space') return;
     
     processToken(token, blockStartLine, blockStartIndex);
  });

  return blocks;
};
