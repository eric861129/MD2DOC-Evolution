/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { BlockType, ParsedBlock } from "../types";
import { parserRegistry, ParserContext } from "./registry";

export const registerDefaultParserRules = () => {
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
    if (line.trim().match(/^[[\]]TOC[[\]]$/i)) {
      let tocContent = "";
      while (ctx.currentIndex + 1 < ctx.lines.length && 
            (ctx.lines[ctx.currentIndex + 1].trim().startsWith('-') || 
             ctx.lines[ctx.currentIndex + 1].trim().startsWith('*') || 
             ctx.lines[ctx.currentIndex + 1].trim().match(/^\d+\./))) {
        ctx.currentIndex++;
        tocContent += ctx.lines[ctx.currentIndex] + "\n";
      }
      return { type: BlockType.TOC, content: tocContent.trim() };
    }
    return null;
  });

  // 4. Chat Dialogues
  parserRegistry.register((line) => {
    const trimmed = line.trim();
    if (trimmed.match(/^(User|AI)[：:]/i) || trimmed.startsWith('User（') || trimmed.startsWith('AI（')) {
      const type = (trimmed.toLowerCase().startsWith('user')) ? BlockType.CHAT_USER : BlockType.CHAT_AI;
      const content = line.replace(/^(User|AI)[：:]\s*|^(User|AI)（.*?）\s*/i, '').trim();
      return { type, content };
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

  // 6. Callouts (Complex multi-line)
  parserRegistry.register((line, ctx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      let type = BlockType.CALLOUT_NOTE;
      let rawContent = trimmed.replace(/^>\s?/, '');
      
      if (rawContent.match(/^[[\]]!TIP[[\]]/i)) {
        type = BlockType.CALLOUT_TIP;
        rawContent = rawContent.replace(/^[[\]]!TIP[[\]]/i, '').trim();
      } else if (rawContent.match(/^[[\]]!WARNING[[\]]/i)) {
        type = BlockType.CALLOUT_WARNING;
        rawContent = rawContent.replace(/^[[\]]!WARNING[[\]]/i, '').trim();
      } else if (rawContent.match(/^[[\]]!NOTE[[\]]/i)) {
        type = BlockType.CALLOUT_NOTE;
        rawContent = rawContent.replace(/^[[\]]!NOTE[[\]]/i, '').trim();
      }
      
      let content = rawContent;
      while (ctx.currentIndex + 1 < ctx.lines.length) {
        const nextLine = ctx.lines[ctx.currentIndex + 1];
        if (nextLine.startsWith('>') || (nextLine.trim() !== '' && ctx.lines[ctx.currentIndex].startsWith('>'))) {
          ctx.currentIndex++;
          const nextRaw = ctx.lines[ctx.currentIndex].replace(/^>\s?/, '');
          content += '\n' + nextRaw;
        } else {
          break;
        }
      }
      return { type, content: content.trim() };
    }
    return null;
  });
};
