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

export const parseMarkdownWithAST = (markdown: string): ParsedBlock[] => {
  const tokens = marked.lexer(markdown);
  const blocks: ParsedBlock[] = [];

  const processToken = (token: any) => {
    switch (token.type) {
      case 'heading':
        const headingType = 
          token.depth === 1 ? BlockType.HEADING_1 :
          token.depth === 2 ? BlockType.HEADING_2 :
          BlockType.HEADING_3;
        blocks.push({
          type: headingType,
          content: token.text
        });
        break;

      case 'paragraph':
        // Check for special syntax in paragraph (Chat, Callouts, TOC)
        // Note: marked might parse blockquotes separately, but we handle them below.
        // Here we handle inline patterns that marked parses as paragraphs.
        
        const text = token.text;

        // 1. TOC
        if (text.trim() === '[TOC]' || text.trim() === '[toc]') {
          blocks.push({ type: BlockType.TOC, content: '' }); // Content populated later or handled by generator
          break;
        }

        // 2. Chat Dialogues (Custom Syntax)
        // Pattern Center: :":
        const centerMatch = text.match(/^(.+?)\s*:\":\s*(.*)$/);
        if (centerMatch) {
            blocks.push({ type: BlockType.CHAT_CUSTOM, role: centerMatch[1].trim(), content: centerMatch[2].trim(), alignment: 'center' });
            break;
        }
        // Pattern Right: ::"
        const rightMatch = text.match(/^(.+?)\s*::\"\s*(.*)$/);
        if (rightMatch) {
            blocks.push({ type: BlockType.CHAT_CUSTOM, role: rightMatch[1].trim(), content: rightMatch[2].trim(), alignment: 'right' });
            break;
        }
        // Pattern Left: "::
        const leftMatch = text.match(/^(.+?)\s*\"(?:::)\s*(.*)$/);
        if (leftMatch) {
            blocks.push({ type: BlockType.CHAT_CUSTOM, role: leftMatch[1].trim(), content: leftMatch[2].trim(), alignment: 'left' });
            break;
        }

        blocks.push({
          type: BlockType.PARAGRAPH,
          content: token.text // Keep raw text with inline markdown for now, generator handles inline styles
        });
        break;

      case 'code':
        // Check for Mermaid
        if (token.lang === 'mermaid') {
          blocks.push({
            type: BlockType.MERMAID,
            content: token.text
          });
        } else {
          // Check for line numbers syntax in lang (e.g., "ts:ln")
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

          blocks.push({
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
        // Check for Callouts within blockquote
        // marked parses blockquote content as nested tokens
        // We need to reconstruct the raw text or analyze the first paragraph to detect callouts.
        
        // Simplified approach: Reconstruct text from tokens
        const rawBlockquote = token.tokens.map((t: any) => t.raw).join('').trim();
        
        let calloutType = BlockType.QUOTE_BLOCK; // Default to standard quote
        let content = rawBlockquote;

        // Detect Callout headers
        // Note: marked might strip the '>' characters in 'text' property of child tokens, but 'raw' has them.
        // We look at the first token to see if it starts with [!TIP] etc.
        
        const firstToken = token.tokens[0];
        if (firstToken && firstToken.type === 'paragraph') {
           const firstLine = firstToken.text.trim();
           if (firstLine.startsWith('[!TIP]')) {
             calloutType = BlockType.CALLOUT_TIP;
             content = rawBlockquote.replace(/^\\[!TIP\\]\s*/m, '').trim(); // Very rough removal, needs refinement for multi-paragraph
             // Better: iterate tokens and strip the header from the first paragraph
             const restText = token.tokens.map((t: any, i: number) => {
                if (i === 0) return t.text.replace('[!TIP]', '').trim();
                return t.text; // Simplification: we lose some structure here, might need to recurse
             }).join('\n\n');
             content = restText;
           } else if (firstLine.startsWith('[!WARNING]')) {
             calloutType = BlockType.CALLOUT_WARNING;
             const restText = token.tokens.map((t: any, i: number) => {
                if (i === 0) return t.text.replace('[!WARNING]', '').trim();
                return t.text;
             }).join('\n\n');
             content = restText;
           } else if (firstLine.startsWith('[!NOTE]')) {
             calloutType = BlockType.CALLOUT_NOTE;
             const restText = token.tokens.map((t: any, i: number) => {
                if (i === 0) return t.text.replace('[!NOTE]', '').trim();
                return t.text;
             }).join('\n\n');
             content = restText;
           }
        }
        
        // If it's a standard quote, we might want to handle it differently
        // For now, mapping QUOTE_BLOCK to CALLOUT_NOTE style or just paragraph is common
        if (calloutType === BlockType.QUOTE_BLOCK) {
             const quoteText = token.tokens.map((t: any) => t.text).join('\n\n');
             blocks.push({
                 type: BlockType.QUOTE_BLOCK,
                 content: quoteText
             });
        } else {
             blocks.push({
                 type: calloutType,
                 content: content
             });
        }
        break;

      case 'list':
        // marked handles nested lists in 'items'.
        // Current docx generator expects simple string content for lists.
        // Future optimization: Pass structured items to generator for nested lists support.
        // For now, flatten to legacy format for compatibility.
        
        token.items.forEach((item: any) => {
          // Check if it's task list (optional)
          const cleanText = item.text.replace(/^\\[[ x]\\]\s*/, ''); 
          blocks.push({
            type: token.ordered ? BlockType.NUMBERED_LIST : BlockType.BULLET_LIST,
            content: cleanText 
          });
        });
        break;

      case 'table':
        const headers = token.header.map((h: any) => h.text);
        const rows = token.rows.map((row: any) => row.map((cell: any) => cell.text));
        const allRows = [headers, ...rows];
        
        blocks.push({
            type: BlockType.TABLE,
            content: '', // Raw content not strictly needed for generator
            tableRows: allRows
        });
        break;

      case 'hr':
        blocks.push({ type: BlockType.HORIZONTAL_RULE, content: '' });
        break;
        
      case 'space':
        // Ignore loose spaces
        break;

      default:
        console.warn(`Unknown token type: ${token.type}`, token);
        break;
    }
  };

  tokens.forEach(processToken);
  return blocks;
};
