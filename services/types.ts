/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

export enum BlockType {
  PARAGRAPH = 'PARAGRAPH',
  HEADING_1 = 'HEADING_1',
  HEADING_2 = 'HEADING_2',
  HEADING_3 = 'HEADING_3',
  CODE_BLOCK = 'CODE_BLOCK',
  CHAT_USER = 'CHAT_USER', // Legacy, to be removed or mapped
  CHAT_AI = 'CHAT_AI',     // Legacy, to be removed or mapped
  CHAT_CUSTOM = 'CHAT_CUSTOM',
  CALLOUT_TIP = 'CALLOUT_TIP',
  CALLOUT_NOTE = 'CALLOUT_NOTE',
  CALLOUT_WARNING = 'CALLOUT_WARNING',
  BULLET_LIST = 'BULLET_LIST',
  NUMBERED_LIST = 'NUMBERED_LIST',
  TABLE = 'TABLE',
  HORIZONTAL_RULE = 'HORIZONTAL_RULE',
  TOC = 'TOC'
}

export interface ParsedBlock {
  type: BlockType;
  content: string;
  role?: string;         // For chat blocks
  alignment?: 'left' | 'right' | 'center'; // For chat blocks
  tableRows?: string[][]; // For table blocks
  metadata?: {
    showLineNumbers?: boolean;
    language?: string;
    [key: string]: any;
  };
}

export interface DocumentMeta {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  header?: boolean; // Show header? Default true
  footer?: boolean; // Show page number footer? Default true
  [key: string]: any;
}

export interface ParseResult {
  blocks: ParsedBlock[];
  meta: DocumentMeta;
}