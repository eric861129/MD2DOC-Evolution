export enum BlockType {
  PARAGRAPH = 'PARAGRAPH',
  HEADING_1 = 'HEADING_1',
  HEADING_2 = 'HEADING_2',
  HEADING_3 = 'HEADING_3',
  CODE_BLOCK = 'CODE_BLOCK',
  CHAT_USER = 'CHAT_USER',
  CHAT_AI = 'CHAT_AI',
  CALLOUT_TIP = 'CALLOUT_TIP',
  CALLOUT_NOTE = 'CALLOUT_NOTE',
  CALLOUT_WARNING = 'CALLOUT_WARNING',
  BULLET_LIST = 'BULLET_LIST',
  NUMBERED_LIST = 'NUMBERED_LIST',
  TABLE = 'TABLE',
  HORIZONTAL_RULE = 'HORIZONTAL_RULE'
}

export interface ParsedBlock {
  type: BlockType;
  content: string; // Plain text or raw content
  language?: string; // For code blocks
  tableRows?: string[][]; // For tables: 2D array of cell content
}