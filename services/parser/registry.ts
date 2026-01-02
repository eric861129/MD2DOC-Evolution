/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { ParsedBlock } from "../types";

export interface ParserContext {
  lines: string[];
  currentIndex: number;
}

export type ParserRule = (line: string, context: ParserContext) => ParsedBlock | ParsedBlock[] | null;

class MarkdownParserRegistry {
  private rules: ParserRule[] = [];

  register(rule: ParserRule) {
    this.rules.push(rule);
  }

  parse(line: string, context: ParserContext): ParsedBlock | ParsedBlock[] | null {
    for (const rule of this.rules) {
      const result = rule(line, context);
      if (result) return result;
    }
    return null;
  }
}

export const parserRegistry = new MarkdownParserRegistry();
