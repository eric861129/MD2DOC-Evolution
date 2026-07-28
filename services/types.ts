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
  MERMAID = 'MERMAID',
  QUOTE_BLOCK = 'QUOTE_BLOCK',
  CHAT_USER = 'CHAT_USER', // Legacy, to be removed or mapped
  CHAT_AI = 'CHAT_AI',     // Legacy, to be removed or mapped
  CHAT_CUSTOM = 'CHAT_CUSTOM',
  CALLOUT_TIP = 'CALLOUT_TIP',
  CALLOUT_NOTE = 'CALLOUT_NOTE',
  CALLOUT_WARNING = 'CALLOUT_WARNING',
  CALLOUT_IMPORTANT = 'CALLOUT_IMPORTANT',
  CALLOUT_CAUTION = 'CALLOUT_CAUTION',
  BULLET_LIST = 'BULLET_LIST',
  NUMBERED_LIST = 'NUMBERED_LIST',
  TABLE = 'TABLE',
  HORIZONTAL_RULE = 'HORIZONTAL_RULE',
  TOC = 'TOC',
  CHAPTER_OPENER = 'CHAPTER_OPENER',
  IMAGE = 'IMAGE',
  QR = 'QR',
}

export type ValidationSeverity = 'warning' | 'error';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  sourceLine?: number;
  blockType?: BlockType;
}

/** 章首頁 YAML 經嚴格型別正規化後的資料。 */
export interface ChapterMetadata {
  number: string;
  part?: string;
  title: string;
  englishTitle?: string;
  summary?: string;
  image?: string;
  goals: string[];
}

export interface ParsedBlock {
  type: BlockType;
  content: string;
  role?: string;         // For chat blocks
  alignment?: 'left' | 'right' | 'center'; // For chat blocks
  tableRows?: string[][]; // For table blocks
  sourceLine?: number;    // Starting line number in the original markdown
  startIndex?: number;    // Character index start
  endIndex?: number;      // Character index end
  metadata?: {
    showLineNumbers?: boolean;
    language?: string;
    chapter?: ChapterMetadata;
    listInstance?: number;
    [key: string]: any;
  };
  validationIssues?: ValidationIssue[];
  nestingLevel?: number; // For lists
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
