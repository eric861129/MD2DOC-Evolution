/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { BlockType, ParsedBlock } from './types';
import { parserRegistry, ParserContext } from './parser/registry';
import { registerDefaultParserRules } from './parser/rules';

// Initialize rules
registerDefaultParserRules();

export const parseMarkdown = (text: string): ParsedBlock[] => {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];

  let currentBuffer: string[] = [];
  let tableBuffer: string[] = [];
  let inCodeBlock = false;
  let inTable = false;
  let codeBlockLang = '';

  const flushBuffer = () => {
    if (currentBuffer.length > 0) {
      blocks.push({
        type: BlockType.PARAGRAPH,
        content: currentBuffer.join('\n').trim(),
      });
      currentBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const validRows = tableBuffer.filter(row => !/^\|[\s\-:|]+\|$/.test(row.trim()));
      const tableRows = validRows.map(row => {
        const content = row.trim().replace(/^\||\|$/g, '');
        return content.split('|').map(cell => cell.trim());
      });

      if (tableRows.length > 0) {
        blocks.push({
          type: BlockType.TABLE,
          content: tableBuffer.join('\n'),
          tableRows: tableRows
        });
      }
      tableBuffer = [];
    }
  };

  const ctx: ParserContext = { lines, currentIndex: 0 };

  for (; ctx.currentIndex < lines.length; ctx.currentIndex++) {
    const line = lines[ctx.currentIndex];
    const trimmedLine = line.trim();

    // 1. Handle Code Blocks (Stateful)
    if (trimmedLine.startsWith('```')) {
      if (inTable) { flushTable(); inTable = false; }
      if (inCodeBlock) {
        blocks.push({ type: BlockType.CODE_BLOCK, content: currentBuffer.join('\n'), language: codeBlockLang });
        currentBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        flushBuffer();
        inCodeBlock = true;
        codeBlockLang = trimmedLine.replace('```', '').trim();
      }
      continue;
    }
    if (inCodeBlock) { currentBuffer.push(line); continue; }

    // 2. Handle Tables (Stateful)
    if (trimmedLine.startsWith('|')) {
      if (!inTable) { flushBuffer(); inTable = true; }
      tableBuffer.push(trimmedLine);
      continue;
    }
    if (inTable) { flushTable(); inTable = false; }

    // 3. Registered Rules (Stateless or specific multi-line)
    const result = parserRegistry.parse(line, ctx);
    if (result) {
      flushBuffer();
      if (Array.isArray(result)) {
        blocks.push(...result);
      } else {
        blocks.push(result);
      }
      continue;
    }

    // 4. Empty Lines
    if (trimmedLine === '') { flushBuffer(); continue; }

    // 5. Default: Paragraph Buffer
    currentBuffer.push(line);
  }

  // Final flush
  if (inTable) flushTable();
  flushBuffer();
  return blocks;
};