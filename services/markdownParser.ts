/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import yaml from 'js-yaml';
import { BlockType, ParsedBlock, ParseResult, DocumentMeta } from './types';
import { parserRegistry, ParserContext } from './parser/registry';
import { registerDefaultParserRules } from './parser/rules';

// Initialize rules ONCE
registerDefaultParserRules();

export const parseMarkdown = (text: string): ParseResult => {
  // Ensure rules are initialized (useful for tests/HMR)
  if ((parserRegistry as any).rules.length === 0) {
    registerDefaultParserRules();
  }

  let meta: DocumentMeta = {};
  let contentToParse = text;

  // 1. Extract Frontmatter
  // Pattern: ^---\n([\s\S]*?)\n---
  // 使用 trimStart() 確保即使檔案開頭有空行也能匹配，但通常 Frontmatter 必須在第一行
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = text.match(frontmatterRegex);
  
  if (match) {
    try {
      const yamlContent = match[1];
      const parsedYaml = yaml.load(yamlContent) as object;
      if (parsedYaml && typeof parsedYaml === 'object') {
        meta = parsedYaml;
      }
      // Remove frontmatter from content
      contentToParse = text.slice(match[0].length);
    } catch (e) {
      console.warn("Failed to parse YAML frontmatter", e);
    }
  }

  const lines = contentToParse.split('\n');
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
  return { blocks, meta };
};