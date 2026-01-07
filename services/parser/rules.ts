/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { BlockType } from "../types";
import { parserRegistry } from "./registry";

export const registerDefaultParserRules = () => {
  // Clear
  (parserRegistry as any).rules = [];

  // 1. Headers
  parserRegistry.register((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return { type: BlockType.HEADING_1, content: trimmed.replace('# ', '') };
    if (trimmed.startsWith('## ')) return { type: BlockType.HEADING_2, content: trimmed.replace('## ', '') };
    if (trimmed.startsWith('### ')) return { type: BlockType.HEADING_3, content: trimmed.replace('### ', '') };
    return null;
  });

  // 2. Horizontal Rules
  parserRegistry.register((line) => {
    if (line.trim().match(/^[-*_]{3,}$/)) return { type: BlockType.HORIZONTAL_RULE, content: '' };
    return null;
  });

  // 3. Manual TOC
  parserRegistry.register((line, ctx) => {
    const trimmed = line.trim();
    if (trimmed === '[TOC]' || trimmed === '[toc]') {
      let tocContent = "";
      while (ctx.currentIndex + 1 < ctx.lines.length) {
        const nextLine = ctx.lines[ctx.currentIndex + 1].trim();
        if (nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.match(/^\d+\./)) {
          ctx.currentIndex++;
          tocContent += (tocContent ? "\n" : "") + ctx.lines[ctx.currentIndex];
        } else {
          break;
        }
      }
      return { type: BlockType.TOC, content: tocContent.trim() };
    }
    return null;
  });

  // 4. Custom Chat Dialogues
  parserRegistry.register((line) => {
    const trimmed = line.trim();
    
    // Pattern Center: :":
    const centerMatch = trimmed.match(/^(.+?)\s*:\":\s*(.*)$/);
    if (centerMatch) {
      return { type: BlockType.CHAT_CUSTOM, role: centerMatch[1].trim(), content: centerMatch[2].trim(), alignment: 'center' };
    }

    // Pattern Right: ::"
    const rightMatch = trimmed.match(/^(.+?)\s*::\"\s*(.*)$/);
    if (rightMatch) {
      return { type: BlockType.CHAT_CUSTOM, role: rightMatch[1].trim(), content: rightMatch[2].trim(), alignment: 'right' };
    }

    // Pattern Left: "::
    const leftMatch = trimmed.match(/^(.+?)\s*\"(?:::)\s*(.*)$/);
    if (leftMatch) {
      return { type: BlockType.CHAT_CUSTOM, role: leftMatch[1].trim(), content: leftMatch[2].trim(), alignment: 'left' };
    }

    return null;
  });

  // 5. Lists
  parserRegistry.register((line) => {
    const trimmed = line.trim();
    if (trimmed.match(/^\d+\.\s/)) return { type: BlockType.NUMBERED_LIST, content: trimmed.replace(/^\d+\.\s/, '') };
    if (trimmed.match(/^[-*]\s/)) return { type: BlockType.BULLET_LIST, content: trimmed.replace(/^[-*]\s/, '') };
    return null;
  });

  // 6. Callouts
  parserRegistry.register((line, ctx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      let type = BlockType.CALLOUT_NOTE;
      const rawContent = trimmed.replace(/^>\s?/, '').trim();
      let firstLineText = rawContent;

      if (rawContent.startsWith('[!TIP]')) {
        type = BlockType.CALLOUT_TIP;
        firstLineText = rawContent.replace('[!TIP]', '').trim();
      } else if (rawContent.startsWith('[!WARNING]')) {
        type = BlockType.CALLOUT_WARNING;
        firstLineText = rawContent.replace('[!WARNING]', '').trim();
      } else if (rawContent.startsWith('[!NOTE]')) {
        type = BlockType.CALLOUT_NOTE;
        firstLineText = rawContent.replace('[!NOTE]', '').trim();
      }
      
      let content = firstLineText;
      while (ctx.currentIndex + 1 < ctx.lines.length) {
        const nextLine = ctx.lines[ctx.currentIndex + 1];
        if (nextLine.trim().startsWith('>')) {
          ctx.currentIndex++;
          const nextRaw = nextLine.trim().replace(/^>\s?/, '').trim();
          content += (content ? "\n" : "") + nextRaw;
        } else {
          break;
        }
      }
      return { type, content: content.trim() };
    }
    return null;
  });

  // 7. Code Blocks
  parserRegistry.register((line, ctx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      const fullTag = trimmed.replace('```', '').trim();
      let language = fullTag;
      let showLineNumbers: boolean | undefined = undefined;

      // Parse metadata from tag (e.g. "ts:ln")
      if (fullTag.includes(':')) {
        const parts = fullTag.split(':');
        language = parts[0].trim();
        const modifier = parts[1].trim().toLowerCase();
        
        if (['ln', 'line', 'yes'].includes(modifier)) {
          showLineNumbers = true;
        } else if (['no-ln', 'plain', 'no'].includes(modifier)) {
          showLineNumbers = false;
        }
      }

      let content = "";
      
      while (ctx.currentIndex + 1 < ctx.lines.length) {
        ctx.currentIndex++;
        const nextLine = ctx.lines[ctx.currentIndex];
        if (nextLine.trim().startsWith('```')) {
          break;
        }
        content += (content ? "\n" : "") + nextLine;
      }
      
      if (language === 'mermaid') {
        return {
          type: BlockType.MERMAID,
          content: content
        };
      }

      return { 
        type: BlockType.CODE_BLOCK, 
        content: content, 
        metadata: {
          language,
          showLineNumbers
        }
      };
    }
    return null;
  });

  // 8. Tables
  parserRegistry.register((line, ctx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      const tableBuffer: string[] = [trimmed];
      
      while (ctx.currentIndex + 1 < ctx.lines.length) {
        const nextLine = ctx.lines[ctx.currentIndex + 1].trim();
        if (nextLine.startsWith('|')) {
          ctx.currentIndex++;
          tableBuffer.push(nextLine);
        } else {
          break;
        }
      }

      const validRows = tableBuffer.filter(row => !/^\|[\s\-:|]+\|$/.test(row.trim()));
      const tableRows = validRows.map(row => {
        const content = row.trim().replace(/^\||\|$/g, '');
        return content.split('|').map(cell => cell.trim());
      });

      if (tableRows.length > 0) {
        return {
          type: BlockType.TABLE,
          content: tableBuffer.join('\n'),
          tableRows: tableRows
        };
      }
    }
    return null;
  });
};
