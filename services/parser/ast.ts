/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { marked } from 'marked';
import { BlockType, ParsedBlock } from '../types';
import { cleanTextForPublishing } from '../../utils/textProcessor';

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
            endIndex: blockStartIndex + (token.raw?.length || 0)
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
          content: cleanTextForPublishing(token.text)
        });
        break;

      case 'paragraph':
        const text = token.text;

        // 1. TOC (Can be [TOC] followed by manual list in the same paragraph)
        if (text.trim().startsWith('[TOC]') || text.trim().startsWith('[toc]')) {
          addBlock({ 
            type: BlockType.TOC, 
            content: cleanTextForPublishing(text.replace(/\[TOC\]|\[toc\]/i, '').trim()) 
          });
          break;
        }

        // 2. Chat Dialogues (Handle multi-line if they are grouped by marked)
        const lines = text.split('\n');
        let allChat = true;
        const chatBlocks: ParsedBlock[] = [];
        
        for (const line of lines) {
            const centerMatch = line.match(/^(.+?)\s*:\":\s*(.*)$/);
            if (centerMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: centerMatch[1].trim(), content: cleanTextForPublishing(centerMatch[2].trim()), alignment: 'center' });
                continue;
            }
            const rightMatch = line.match(/^(.+?)\s*::\"\s*(.*)$/);
            if (rightMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: rightMatch[1].trim(), content: cleanTextForPublishing(rightMatch[2].trim()), alignment: 'right' });
                continue;
            }
            const leftMatch = line.match(/^(.+?)\s*\"(?:::)\s*(.*)$/);
            if (leftMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: leftMatch[1].trim(), content: cleanTextForPublishing(leftMatch[2].trim()), alignment: 'left' });
                continue;
            }
            allChat = false;
            break;
        }

        if (allChat && chatBlocks.length > 0) {
            chatBlocks.forEach((cb, idx) => {
                blocks.push({
                    ...cb,
                    sourceLine: blockStartLine + idx,
                    startIndex: blockStartIndex,
                    endIndex: blockStartIndex + token.raw.length
                });
            });
            break;
        }

        addBlock({
          type: BlockType.PARAGRAPH,
          content: cleanTextForPublishing(token.text)
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
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!TIP]')) {
                 lines.shift();
             }
             content = lines.join('\n').trim();

           } else if (firstLine.startsWith('[!WARNING]')) {
             calloutType = BlockType.CALLOUT_WARNING;
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!WARNING]')) {
                 lines.shift();
             }
             content = lines.join('\n').trim();

           } else if (firstLine.startsWith('[!NOTE]')) {
             calloutType = BlockType.CALLOUT_NOTE;
             const lines = rawBlockquote.split('\n');
             if (lines[0].includes('[!NOTE]')) {
                 lines.shift();
             }
             content = lines.join('\n').trim();
           }
        }
        
        addBlock({
             type: calloutType,
             content: cleanTextForPublishing(content)
        });
        break;

      case 'list':
        const processListItems = (items: any[], level: number, ordered: boolean) => {
          items.forEach(item => {
            let itemContent = '';
            const subLists: any[] = [];

            if (item.tokens) {
              item.tokens.forEach((t: any) => {
                if (t.type === 'list') {
                  subLists.push(t);
                } else {
                  if (t.type === 'text' || t.type === 'html') {
                    itemContent += t.text;
                  } else if (t.raw) {
                     // Fallback for other token types, try to use raw or text if available
                     itemContent += (t.text || t.raw);
                  }
                }
              });
            } else {
              itemContent = item.text;
            }

            // Clean content (checkboxes)
            const cleanText = itemContent.replace(/^\[[ x]\]\s*/, '');

            addBlock({
              type: ordered ? BlockType.NUMBERED_LIST : BlockType.BULLET_LIST,
              content: cleanTextForPublishing(cleanText),
              nestingLevel: level
            });

            // Process nested lists
            subLists.forEach(subList => {
              processListItems(subList.items, level + 1, subList.ordered);
            });
          });
        };

        processListItems(token.items, 0, token.ordered);
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

      case 'image':
        addBlock({
          type: BlockType.IMAGE,
          content: token.href,
          metadata: {
            alt: token.text,
            title: token.title
          }
        });
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

  // Post-processing: Merge adjacent TOC and List blocks if they are intended to be a manual TOC
  const mergedBlocks: ParsedBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    if (current.type === BlockType.TOC && i + 1 < blocks.length) {
      let nextIndex = i + 1;
      let manualContent = current.content || '';
      
      while (nextIndex < blocks.length && 
             (blocks[nextIndex].type === BlockType.BULLET_LIST || 
              blocks[nextIndex].type === BlockType.NUMBERED_LIST)) {
        
        const listBlock = blocks[nextIndex];
        // Reconstruct manual TOC line
        const prefix = listBlock.type === BlockType.BULLET_LIST ? '- ' : '1. ';
        manualContent += (manualContent ? '\n' : '') + prefix + listBlock.content;
        nextIndex++;
      }
      
      if (nextIndex > i + 1) {
        mergedBlocks.push({ ...current, content: manualContent });
        i = nextIndex - 1;
        continue;
      }
    }
    mergedBlocks.push(current);
  }

  return mergedBlocks;
};
