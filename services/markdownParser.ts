import { BlockType, ParsedBlock } from '../types.ts';

export const parseMarkdown = (text: string): ParsedBlock[] => {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];

  let currentBuffer: string[] = [];
  let inCodeBlock = false;
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 1. Handle Code Blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: BlockType.CODE_BLOCK,
          content: currentBuffer.join('\n'),
          language: codeBlockLang
        });
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

    if (inCodeBlock) {
      currentBuffer.push(line);
      continue;
    }

    // 2. Handle Horizontal Rules (---, ***, ___)
    // Must be checked before lists and headers to prevent misinterpretation
    if (trimmedLine.match(/^[-*_]{3,}$/)) {
      flushBuffer();
      blocks.push({ type: BlockType.HORIZONTAL_RULE, content: '' });
      continue;
    }

    // 3. Handle Chat Dialogues (Enhanced for full-width colons)
    // Matches "User:", "User：", "User (Prompt):", etc.
    if (trimmedLine.match(/^(User|AI)[：:]/i) || trimmedLine.startsWith('User（') || trimmedLine.startsWith('AI（')) {
      flushBuffer();
      const type = (trimmedLine.toLowerCase().startsWith('user')) ? BlockType.CHAT_USER : BlockType.CHAT_AI;
      // Extract content after colon
      const content = line.replace(/^(User|AI)[：:]\s*|^(User|AI)（.*?）\s*/i, '').trim();
      blocks.push({ type, content });
      continue;
    }

    // 4. Handle Callouts / Blockquotes
    if (trimmedLine.startsWith('>')) {
      flushBuffer();
      let type = BlockType.CALLOUT_NOTE; // Default
      let rawContent = trimmedLine.replace(/^>\s?/, '');

      // Check for specific GitHub/Obsidian alert styles
      if (rawContent.match(/^\[!TIP\]/i)) {
        type = BlockType.CALLOUT_TIP;
        rawContent = rawContent.replace(/^\[!TIP\]/i, '').trim();
      } else if (rawContent.match(/^\[!WARNING\]/i)) {
        type = BlockType.CALLOUT_WARNING;
        rawContent = rawContent.replace(/^\[!WARNING\]/i, '').trim();
      } else if (rawContent.match(/^\[!NOTE\]/i)) {
        type = BlockType.CALLOUT_NOTE;
        rawContent = rawContent.replace(/^\[!NOTE\]/i, '').trim();
      }

      let content = rawContent;
      // Look ahead for multiline blockquote
      while (i + 1 < lines.length && (lines[i + 1].startsWith('>') || (lines[i+1].trim() !== '' && lines[i].startsWith('>')))) {
        i++;
        const nextRaw = lines[i].replace(/^>\s?/, '');
        content += '\n' + nextRaw;
      }
      blocks.push({ type, content: content.trim() });
      continue;
    }

    // 5. Headers
    if (trimmedLine.startsWith('# ')) {
      flushBuffer();
      blocks.push({ type: BlockType.HEADING_1, content: trimmedLine.replace('# ', '') });
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      flushBuffer();
      blocks.push({ type: BlockType.HEADING_2, content: trimmedLine.replace('## ', '') });
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      flushBuffer();
      blocks.push({ type: BlockType.HEADING_3, content: trimmedLine.replace('### ', '') });
      continue;
    }

    // 6. Lists
    if (trimmedLine.match(/^[-*]\s/)) {
      flushBuffer();
      blocks.push({ type: BlockType.BULLET_LIST, content: trimmedLine.replace(/^[-*]\s/, '') });
      continue;
    }

    // 7. Empty Lines
    if (trimmedLine === '') {
      flushBuffer();
      continue;
    }

    currentBuffer.push(line);
  }

  flushBuffer();
  return blocks;
};