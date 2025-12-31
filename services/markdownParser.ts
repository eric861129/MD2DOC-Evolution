/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { BlockType, ParsedBlock } from '../types.ts';

export const parseMarkdown = (text: string): ParsedBlock[] => {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];

  let currentBuffer: string[] = [];
  let tableBuffer: string[] = [];
  let inCodeBlock = false;
  let inTable = false;
  let codeBlockLang = '';

  const flushBuffer = (type: BlockType = BlockType.PARAGRAPH) => {
    if (currentBuffer.length > 0) {
      blocks.push({
        type,
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 1. Handle Code Blocks
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

    // 2. Handle Tables
    if (trimmedLine.startsWith('|')) {
      if (!inTable) { flushBuffer(); inTable = true; }
      tableBuffer.push(trimmedLine);
      continue;
    }
    if (inTable) { flushTable(); inTable = false; }

    // 3. Handle Manual TOC ([TOC])
    if (trimmedLine.match(/^[\[]TOC[\]]$/i)) {
      flushBuffer();
      let tocContent = "";
      // 收集隨後的清單項
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('-') || lines[i + 1].trim().startsWith('*') || lines[i + 1].trim().match(/^\d+\./))) {
        i++;
        tocContent += lines[i] + "\n";
      }
      blocks.push({ type: BlockType.TOC, content: tocContent.trim() });
      continue;
    }

    // 4. Handle Horizontal Rules
    if (trimmedLine.match(/^[-*_]{3,}$/)) {
      flushBuffer();
      blocks.push({ type: BlockType.HORIZONTAL_RULE, content: '' });
      continue;
    }

    // 5. Handle Chat Dialogues
    if (trimmedLine.match(/^(User|AI)[：:]/i) || trimmedLine.startsWith('User（') || trimmedLine.startsWith('AI（')) {
      flushBuffer();
      const type = (trimmedLine.toLowerCase().startsWith('user')) ? BlockType.CHAT_USER : BlockType.CHAT_AI;
      const content = line.replace(/^(User|AI)[：:]\s*|^(User|AI)（.*?）\s*/i, '').trim();
      blocks.push({ type, content });
      continue;
    }

    // 6. Handle Callouts
    if (trimmedLine.startsWith('>')) {
      flushBuffer();
      let type = BlockType.CALLOUT_NOTE;
      let rawContent = trimmedLine.replace(/^>\s?/, '');
      if (rawContent.match(/^[\[]!TIP[\]]/i)) {
        type = BlockType.CALLOUT_TIP;
        rawContent = rawContent.replace(/^[\[]!TIP[\]]/i, '').trim();
      } else if (rawContent.match(/^[\[]!WARNING[\]]/i)) {
        type = BlockType.CALLOUT_WARNING;
        rawContent = rawContent.replace(/^[\[]!WARNING[\]]/i, '').trim();
      } else if (rawContent.match(/^[\[]!NOTE[\]]/i)) {
        type = BlockType.CALLOUT_NOTE;
        rawContent = rawContent.replace(/^[\[]!NOTE[\]]/i, '').trim();
      }
      let content = rawContent;
      while (i + 1 < lines.length && (lines[i + 1].startsWith('>') || (lines[i+1].trim() !== '' && lines[i].startsWith('>')))) {
        i++;
        const nextRaw = lines[i].replace(/^>\s?/, '');
        content += '\n' + nextRaw;
      }
      blocks.push({ type, content: content.trim() });
      continue;
    }

    // 7. Headers
    if (trimmedLine.startsWith('# ')) { flushBuffer(); blocks.push({ type: BlockType.HEADING_1, content: trimmedLine.replace('# ', '') }); continue; }
    if (trimmedLine.startsWith('## ')) { flushBuffer(); blocks.push({ type: BlockType.HEADING_2, content: trimmedLine.replace('## ', '') }); continue; }
    if (trimmedLine.startsWith('### ')) { flushBuffer(); blocks.push({ type: BlockType.HEADING_3, content: trimmedLine.replace('### ', '') }); continue; }

    // 8. Lists
    if (trimmedLine.match(/^\d+\.\s/)) { flushBuffer(); blocks.push({ type: BlockType.NUMBERED_LIST, content: trimmedLine.replace(/^\d+\.\s/, '') }); continue; }
    if (trimmedLine.match(/^[-*]\s/)) { flushBuffer(); blocks.push({ type: BlockType.BULLET_LIST, content: trimmedLine.replace(/^[-*]\s/, '') }); continue; }

    // 9. Empty Lines
    if (trimmedLine === '') { flushBuffer(); continue; }

    currentBuffer.push(line);
  }

  // Final flush
  if (inTable) flushTable();
  flushBuffer();
  return blocks;
};
