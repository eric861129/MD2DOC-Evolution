/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { BlockType, ParsedBlock } from './types';
import { parserRegistry, ParserContext } from './parser/registry';
import { registerDefaultParserRules } from './parser/rules';

// Initialize rules ONCE
registerDefaultParserRules();

export const parseMarkdown = (text: string): ParsedBlock[] => {
  // Ensure rules are initialized (useful for tests/HMR)
  if ((parserRegistry as any).rules.length === 0) {
    registerDefaultParserRules();
  }

  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];

  let currentBuffer: string[] = [];

  const flushBuffer = () => {
    if (currentBuffer.length > 0) {
      blocks.push({
        type: BlockType.PARAGRAPH,
        content: currentBuffer.join('\n').trim(),
      });
      currentBuffer = [];
    }
  };

  const ctx: ParserContext = { lines, currentIndex: 0 };

  while (ctx.currentIndex < lines.length) {
    const line = lines[ctx.currentIndex];
    const trimmedLine = line.trim();

    // 1. Registered Rules (Includes Code Blocks, Tables, Headings, etc.)
    const result = parserRegistry.parse(line, ctx);
    if (result) {
      flushBuffer();
      if (Array.isArray(result)) {
        blocks.push(...result);
      } else {
        blocks.push(result);
      }
      ctx.currentIndex++;
      continue;
    }

    // 2. Empty Lines
    if (trimmedLine === '') { 
      flushBuffer(); 
      ctx.currentIndex++;
      continue; 
    }

    // 3. Default: Paragraph Buffer
    currentBuffer.push(line);
    ctx.currentIndex++;
  }

  // Final flush
  flushBuffer();
  return blocks;
};