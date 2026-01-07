/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License. 
 */

import yaml from 'js-yaml';
import { ParsedBlock, ParseResult, DocumentMeta } from './types';
import { parseMarkdownWithAST } from './parser/ast';

export const parseMarkdown = (text: string): ParseResult => {
  let meta: DocumentMeta = {};
  let contentToParse = text;

  // 1. Extract Frontmatter
  // Pattern: ^---\n([\s\S]*?)\n---
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

  // 2. Parse Content using AST
  const blocks = parseMarkdownWithAST(contentToParse);

  return { blocks, meta };
};
