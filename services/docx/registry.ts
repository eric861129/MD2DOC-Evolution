/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Paragraph, Table } from "docx";
import { ParsedBlock } from "../types";
import { DocxConfig } from "./types";

export type DocxBlockResult = Paragraph | Table | (Paragraph | Table)[];

export type DocxBlockHandler = (block: ParsedBlock, config: DocxConfig) => Promise<DocxBlockResult>;

class DocxHandlerRegistry {
  private handlers: Map<string, DocxBlockHandler> = new Map();

  register(type: string, handler: DocxBlockHandler) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): DocxBlockHandler | undefined {
    return this.handlers.get(type);
  }

  async handle(block: ParsedBlock, config: DocxConfig): Promise<DocxBlockResult | null> {
    const handler = this.handlers.get(block.type);
    if (handler) {
      return await handler(block, config);
    }
    return null;
  }
}

export const docxRegistry = new DocxHandlerRegistry();
