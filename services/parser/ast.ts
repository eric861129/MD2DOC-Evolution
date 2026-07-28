/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Lexer, marked } from 'marked';
import yaml from 'js-yaml';
import {
  BlockType,
  type ChapterMetadata,
  type ParsedBlock,
  type ValidationIssue,
} from '../types';
import { cleanTextForPublishing } from '../../utils/textProcessor';

// Configure marked options if needed
marked.use({
  breaks: true,
  gfm: true,
});

interface StandaloneQrLink {
  label: string;
  url: string;
}

interface PhysicalLineSpan {
  content: string;
  lineOffset: number;
  startIndex: number;
  endIndex: number;
}

interface ChapterSourceSpan {
  startIndex: number;
  endIndex: number;
  lineOffset: number;
  yamlContent: string;
  isClosed: boolean;
}

const CHAPTER_KEYS = new Set([
  'number',
  'part',
  'title',
  'englishTitle',
  'summary',
  'image',
  'goals',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const createChapterIssue = (
  sourceLine: number,
  code: string,
  severity: ValidationIssue['severity'],
  title: string,
  message: string,
): ValidationIssue => ({
  id: `chapter-${sourceLine}-${code}`,
  severity,
  title,
  message,
  sourceLine,
  blockType: BlockType.CHAPTER_OPENER,
});

const scanPhysicalLineSpans = (source: string): PhysicalLineSpan[] => {
  const spans: PhysicalLineSpan[] = [];
  let lineOffset = 0;
  let lineStart = 0;
  let cursor = 0;

  while (cursor < source.length) {
    const character = source[cursor];
    if (character !== '\n' && character !== '\r') {
      cursor += 1;
      continue;
    }

    spans.push({
      content: source.slice(lineStart, cursor),
      lineOffset,
      startIndex: lineStart,
      endIndex: cursor,
    });
    cursor += character === '\r' && source[cursor + 1] === '\n' ? 2 : 1;
    lineStart = cursor;
    lineOffset += 1;
  }

  if (lineStart < source.length) {
    spans.push({
      content: source.slice(lineStart),
      lineOffset,
      startIndex: lineStart,
      endIndex: source.length,
    });
  }
  return spans;
};

const scanChapterSourceSpans = (source: string): ChapterSourceSpan[] => {
  const lines = scanPhysicalLineSpans(source);
  const spans: ChapterSourceSpan[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].content.trim() !== '[CHAPTER]') {
      continue;
    }

    const startLine = lines[index];
    let closingIndex = index + 1;
    while (
      closingIndex < lines.length
      && lines[closingIndex].content.trim() !== '[/CHAPTER]'
    ) {
      closingIndex += 1;
    }

    const isClosed = closingIndex < lines.length;
    const closingLine = isClosed
      ? lines[closingIndex]
      : lines[lines.length - 1];
    const yamlStart = index + 1 < lines.length
      ? lines[index + 1].startIndex
      : startLine.endIndex;
    const yamlEnd = isClosed ? closingLine.startIndex : source.length;

    spans.push({
      startIndex: startLine.startIndex,
      endIndex: isClosed ? closingLine.endIndex : source.length,
      lineOffset: startLine.lineOffset,
      yamlContent: source.slice(yamlStart, yamlEnd),
      isClosed,
    });
    index = isClosed ? closingIndex : lines.length;
  }

  return spans;
};

const normalizeOptionalChapterString = (
  raw: Record<string, unknown>,
  key: 'part' | 'englishTitle' | 'summary' | 'image',
  sourceLine: number,
  issues: ValidationIssue[],
): string | undefined => {
  const value = raw[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    issues.push(createChapterIssue(
      sourceLine,
      `${key}-type`,
      'warning',
      `章首頁 ${key} 必須是字串`,
      `已忽略 ${key}；請在 [CHAPTER] YAML 中使用字串。`,
    ));
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
};

const normalizeRequiredChapterString = (
  raw: Record<string, unknown>,
  key: 'number' | 'title',
  sourceLine: number,
  issues: ValidationIssue[],
): string => {
  const value = raw[key];
  if (value === undefined || value === null || value === '') {
    issues.push(createChapterIssue(
      sourceLine,
      `${key}-missing`,
      'error',
      `章首頁缺少 ${key}`,
      `請在 [CHAPTER] YAML 補上字串欄位 ${key}。`,
    ));
    return '';
  }
  if (typeof value !== 'string') {
    issues.push(createChapterIssue(
      sourceLine,
      `${key}-type`,
      'error',
      `章首頁 ${key} 必須是字串`,
      `${key} 不會自動轉型；若需保留前導零，請使用引號包住值。`,
    ));
    return '';
  }
  const normalized = value.trim();
  if (!normalized) {
    issues.push(createChapterIssue(
      sourceLine,
      `${key}-missing`,
      'error',
      `章首頁缺少 ${key}`,
      `請在 [CHAPTER] YAML 補上非空白字串欄位 ${key}。`,
    ));
  }
  return normalized;
};

const parseChapterMetadata = (
  yamlContent: string,
  sourceLine: number,
  isClosed: boolean,
): { chapter: ChapterMetadata; issues: ValidationIssue[] } => {
  const issues: ValidationIssue[] = [];
  const emptyChapter: ChapterMetadata = {
    number: '',
    title: '',
    goals: [],
  };

  if (!isClosed) {
    issues.push(createChapterIssue(
      sourceLine,
      'closing-marker',
      'error',
      '章首頁缺少 [/CHAPTER]',
      '請補上章首頁結束標記，避免後續正文被視為 YAML。',
    ));
  }

  let parsedYaml: unknown;
  try {
    parsedYaml = yaml.load(yamlContent, { schema: yaml.DEFAULT_SCHEMA });
  } catch {
    issues.push(createChapterIssue(
      sourceLine,
      'yaml',
      'error',
      '章首頁 YAML 無法解析',
      '請檢查縮排、引號與陣列格式；其餘文件內容仍會繼續解析。',
    ));
    return { chapter: emptyChapter, issues };
  }

  if (!isRecord(parsedYaml)) {
    issues.push(createChapterIssue(
      sourceLine,
      'yaml-object',
      'error',
      '章首頁 YAML 必須是物件',
      '請使用 number、title 等鍵值欄位，不要使用純量或頂層陣列。',
    ));
    return { chapter: emptyChapter, issues };
  }

  const unknownKeys = Object.keys(parsedYaml)
    .filter((key) => !CHAPTER_KEYS.has(key))
    .sort();
  if (unknownKeys.length > 0) {
    issues.push(createChapterIssue(
      sourceLine,
      'unknown-keys',
      'warning',
      '章首頁包含未知欄位',
      `已忽略未知欄位：${unknownKeys.join('、')}。`,
    ));
  }

  let goals: string[] = [];
  if (parsedYaml.goals !== undefined) {
    if (
      Array.isArray(parsedYaml.goals)
      && parsedYaml.goals.every((goal) => typeof goal === 'string')
    ) {
      goals = parsedYaml.goals
        .map((goal) => goal.trim())
        .filter(Boolean);
    } else {
      issues.push(createChapterIssue(
        sourceLine,
        'goals-type',
        'warning',
        '章首頁 goals 必須是字串陣列',
        '已將 goals 正規化為空陣列；請使用 YAML 清單輸入每個學習目標。',
      ));
    }
  }

  return {
    chapter: {
      number: normalizeRequiredChapterString(
        parsedYaml,
        'number',
        sourceLine,
        issues,
      ),
      ...Object.fromEntries(
        (['part', 'englishTitle', 'summary', 'image'] as const)
          .map((key) => [
            key,
            normalizeOptionalChapterString(
              parsedYaml,
              key,
              sourceLine,
              issues,
            ),
          ])
          .filter(([, value]) => value !== undefined),
      ),
      title: normalizeRequiredChapterString(
        parsedYaml,
        'title',
        sourceLine,
        issues,
      ),
      goals,
    },
    issues,
  };
};

const finalizeBlocks = (blocks: ParsedBlock[]): ParsedBlock[] => {
  const mergedBlocks: ParsedBlock[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const current = blocks[index];
    if (current.type === BlockType.TOC && index + 1 < blocks.length) {
      let nextIndex = index + 1;
      let manualContent = current.content || '';

      while (
        nextIndex < blocks.length
        && (
          blocks[nextIndex].type === BlockType.BULLET_LIST
          || blocks[nextIndex].type === BlockType.NUMBERED_LIST
        )
      ) {
        const listBlock = blocks[nextIndex];
        const prefix = listBlock.type === BlockType.BULLET_LIST ? '- ' : '1. ';
        manualContent += `${manualContent ? '\n' : ''}${prefix}${listBlock.content}`;
        nextIndex += 1;
      }

      if (nextIndex > index + 1) {
        mergedBlocks.push({
          ...current,
          content: manualContent,
          metadata: {
            ...current.metadata,
            manualTocContent: true,
          },
        });
        index = nextIndex - 1;
        continue;
      }
    }
    mergedBlocks.push(current);
  }

  let currentListInstance: number | undefined;
  let nextListInstance = 1;
  return mergedBlocks.map((block) => {
    if (block.type !== BlockType.NUMBERED_LIST) {
      currentListInstance = undefined;
      return block;
    }
    if (currentListInstance === undefined) {
      currentListInstance = nextListInstance;
      nextListInstance += 1;
    }
    return {
      ...block,
      metadata: {
        ...block.metadata,
        listInstance: currentListInstance,
      },
    };
  });
};

const createNormalizedBoundaryMap = (source: string): number[] => {
  const originalIndexByNormalizedBoundary = [0];
  let originalIndex = 0;

  while (originalIndex < source.length) {
    if (
      source[originalIndex] === '\r'
      && source[originalIndex + 1] === '\n'
    ) {
      originalIndex += 2;
    } else {
      originalIndex += 1;
    }
    originalIndexByNormalizedBoundary.push(originalIndex);
  }
  return originalIndexByNormalizedBoundary;
};

const parseStandaloneQrLink = (
  sourceLine: string,
): StandaloneQrLink | undefined => {
  const trimmedLine = sourceLine.trim();
  const inlineTokens = Lexer.lexInline(trimmedLine);
  if (inlineTokens.length !== 1 || inlineTokens[0].type !== 'link') {
    return undefined;
  }

  const link = inlineTokens[0];
  if (
    link.raw.trim() !== trimmedLine
    || !link.text.startsWith('QR:')
  ) {
    return undefined;
  }
  const label = link.text.slice('QR:'.length).trim();
  const url = link.href.trim();
  return label && url ? { label, url } : undefined;
};

export const parseMarkdownWithAST = (markdown: string, lineOffset: number = 0, charOffset: number = 0): ParsedBlock[] => {
  const chapterSpans = scanChapterSourceSpans(markdown);
  if (chapterSpans.length > 0) {
    const chapterBlocks: ParsedBlock[] = [];
    let cursor = 0;

    for (const span of chapterSpans) {
      if (cursor < span.startIndex) {
        const prefix = markdown.slice(cursor, span.startIndex);
        const prefixLineOffset = lineOffset
          + (markdown.slice(0, cursor).match(/\n/g) || []).length;
        chapterBlocks.push(...parseMarkdownWithAST(
          prefix,
          prefixLineOffset,
          charOffset + cursor,
        ));
      }

      const sourceLine = lineOffset + span.lineOffset;
      const { chapter, issues } = parseChapterMetadata(
        span.yamlContent,
        sourceLine,
        span.isClosed,
      );
      chapterBlocks.push({
        type: BlockType.CHAPTER_OPENER,
        content: chapter.title,
        metadata: { chapter },
        validationIssues: issues,
        sourceLine,
        startIndex: charOffset + span.startIndex,
        endIndex: charOffset + span.endIndex,
      });
      cursor = span.endIndex;
    }

    if (cursor < markdown.length) {
      const suffixLineOffset = lineOffset
        + (markdown.slice(0, cursor).match(/\n/g) || []).length;
      chapterBlocks.push(...parseMarkdownWithAST(
        markdown.slice(cursor),
        suffixLineOffset,
        charOffset + cursor,
      ));
    }

    return finalizeBlocks(chapterBlocks);
  }

  const tokens = marked.lexer(markdown);
  const blocks: ParsedBlock[] = [];
  const originalIndexByNormalizedBoundary =
    createNormalizedBoundaryMap(markdown);
  
  let currentLine = lineOffset;
  let currentNormalizedIndex = 0;

  const processToken = (
    token: any,
    blockStartLine: number,
    blockStartIndex: number,
    tokenSource: string,
  ) => {
    // Helper to add block with source info
    const addBlock = (block: ParsedBlock) => {
        blocks.push({
            ...block,
            sourceLine: blockStartLine,
            startIndex: blockStartIndex,
            endIndex: blockStartIndex + tokenSource.length,
        });
    };

    switch (token.type) {
      case 'heading':
        const headingType = 
          token.depth === 1 ? BlockType.HEADING_1 :
          token.depth === 2 ? BlockType.HEADING_2 :
          BlockType.HEADING_3;
        addBlock({
          type: headingType,
          content: cleanTextForPublishing(token.text)
        });
        break;

      case 'paragraph':
        const text = token.text;
        const sourceLines = scanPhysicalLineSpans(tokenSource);
        const qrLines = sourceLines.map(({ content }) =>
          parseStandaloneQrLink(content)
        );

        if (qrLines.some(Boolean)) {
          let fragmentStart = 0;
          const flushSemanticFragment = (fragmentEnd: number) => {
            if (fragmentStart >= fragmentEnd) {
              return;
            }
            const firstLine = sourceLines[fragmentStart];
            const lastLine = sourceLines[fragmentEnd - 1];
            const fragment = tokenSource.slice(
              firstLine.startIndex,
              lastLine.endIndex,
            );
            blocks.push(...parseMarkdownWithAST(
              fragment,
              blockStartLine + firstLine.lineOffset,
              blockStartIndex + firstLine.startIndex,
            ));
          };

          sourceLines.forEach((line, index) => {
            const qrLink = qrLines[index];
            if (!qrLink) {
              return;
            }

            flushSemanticFragment(index);
            blocks.push({
              type: BlockType.QR,
              content: qrLink.label,
              metadata: {
                url: qrLink.url,
                label: qrLink.label,
              },
              sourceLine: blockStartLine + line.lineOffset,
              startIndex: blockStartIndex + line.startIndex,
              endIndex: blockStartIndex + line.endIndex,
            });
            fragmentStart = index + 1;
          });
          flushSemanticFragment(sourceLines.length);
          break;
        }

        const tocLineIndexes = sourceLines
          .map(({ content }, index) =>
            content.trim().toLowerCase() === '[toc]' ? index : -1
          )
          .filter((index) => index >= 0);
        if (tocLineIndexes.length > 0) {
          let fragmentStart = 0;
          const flushTocFragment = (fragmentEnd: number) => {
            if (fragmentStart >= fragmentEnd) {
              return;
            }
            const firstLine = sourceLines[fragmentStart];
            const lastLine = sourceLines[fragmentEnd - 1];
            blocks.push(...parseMarkdownWithAST(
              tokenSource.slice(firstLine.startIndex, lastLine.endIndex),
              blockStartLine + firstLine.lineOffset,
              blockStartIndex + firstLine.startIndex,
            ));
          };

          for (const tocLineIndex of tocLineIndexes) {
            flushTocFragment(tocLineIndex);
            const tocLine = sourceLines[tocLineIndex];
            blocks.push({
              type: BlockType.TOC,
              content: '',
              metadata: { manualTocContent: false },
              sourceLine: blockStartLine + tocLine.lineOffset,
              startIndex: blockStartIndex + tocLine.startIndex,
              endIndex: blockStartIndex + tocLine.endIndex,
            });
            fragmentStart = tocLineIndex + 1;
          }
          flushTocFragment(sourceLines.length);
          break;
        }

        // 1. TOC (Can be [TOC] followed by manual list in the same paragraph)
        if (text.trim().startsWith('[TOC]') || text.trim().startsWith('[toc]')) {
          addBlock({ 
            type: BlockType.TOC, 
            content: cleanTextForPublishing(text.replace(/\[TOC\]|\[toc\]/i, '').trim()) 
          });
          break;
        }

        // 2. Chat Dialogues (Handle multi-line if they are grouped by marked)
        const lines = text.split('\n');
        let allChat = true;
        const chatBlocks: ParsedBlock[] = [];
        
        for (const line of lines) {
            const centerMatch = line.match(/^(.+?)\s*:\":\s*(.*)$/);
            if (centerMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: centerMatch[1].trim(), content: cleanTextForPublishing(centerMatch[2].trim()), alignment: 'center' });
                continue;
            }
            const rightMatch = line.match(/^(.+?)\s*::\"\s*(.*)$/);
            if (rightMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: rightMatch[1].trim(), content: cleanTextForPublishing(rightMatch[2].trim()), alignment: 'right' });
                continue;
            }
            const leftMatch = line.match(/^(.+?)\s*\"(?:::)\s*(.*)$/);
            if (leftMatch) {
                chatBlocks.push({ type: BlockType.CHAT_CUSTOM, role: leftMatch[1].trim(), content: cleanTextForPublishing(leftMatch[2].trim()), alignment: 'left' });
                continue;
            }
            allChat = false;
            break;
        }

        if (allChat && chatBlocks.length > 0) {
            chatBlocks.forEach((cb, idx) => {
                blocks.push({
                    ...cb,
                    sourceLine: blockStartLine + idx,
                    startIndex: blockStartIndex,
                    endIndex: blockStartIndex + tokenSource.length,
                });
            });
            break;
        }

        addBlock({
          type: BlockType.PARAGRAPH,
          content: cleanTextForPublishing(token.text)
        });
        break;

      case 'code':
        if (token.lang === 'mermaid') {
          addBlock({
            type: BlockType.MERMAID,
            content: token.text
          });
        } else {
          let language = token.lang || '';
          let showLineNumbers: boolean | undefined = undefined;

          if (language.includes(':')) {
            const parts = language.split(':');
            language = parts[0].trim();
            const modifier = parts[1].trim().toLowerCase();
            if (['ln', 'line', 'yes'].includes(modifier)) {
              showLineNumbers = true;
            } else if (['no-ln', 'plain', 'no'].includes(modifier)) {
              showLineNumbers = false;
            }
          }

          addBlock({
            type: BlockType.CODE_BLOCK,
            content: token.text,
            metadata: {
              language,
              showLineNumbers
            }
          });
        }
        break;

      case 'blockquote':
        const rawBlockquote = token.tokens.map((t: any) => t.raw).join('').trim();
        let calloutType = BlockType.QUOTE_BLOCK;
        let content = rawBlockquote;

        const firstToken = token.tokens[0];
        if (firstToken && firstToken.type === 'paragraph') {
          const firstLine = firstToken.text.trim();
          const calloutTypes: Record<string, BlockType> = {
            TIP: BlockType.CALLOUT_TIP,
            NOTE: BlockType.CALLOUT_NOTE,
            WARNING: BlockType.CALLOUT_WARNING,
            IMPORTANT: BlockType.CALLOUT_IMPORTANT,
            CAUTION: BlockType.CALLOUT_CAUTION,
          };
          const calloutMarker = firstLine.match(
            /^\[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]/,
          );

          if (calloutMarker) {
            calloutType = calloutTypes[calloutMarker[1]];
            const lines = rawBlockquote.split('\n');
            lines.shift();
            content = lines.join('\n').trim();
          }
        }
        
        addBlock({
             type: calloutType,
             content: cleanTextForPublishing(content)
        });
        break;

      case 'list':
        const processListItems = (items: any[], level: number, ordered: boolean) => {
          items.forEach(item => {
            let itemContent = '';
            const subLists: any[] = [];

            if (item.tokens) {
              item.tokens.forEach((t: any) => {
                if (t.type === 'list') {
                  subLists.push(t);
                } else {
                  if (t.type === 'text' || t.type === 'html') {
                    itemContent += t.text;
                  } else if (t.raw) {
                     // Fallback for other token types, try to use raw or text if available
                     itemContent += (t.text || t.raw);
                  }
                }
              });
            } else {
              itemContent = item.text;
            }

            // Clean content (checkboxes)
            const cleanText = itemContent.replace(/^\[[ x]\]\s*/, '');

            addBlock({
              type: ordered ? BlockType.NUMBERED_LIST : BlockType.BULLET_LIST,
              content: cleanTextForPublishing(cleanText),
              nestingLevel: level
            });

            // Process nested lists
            subLists.forEach(subList => {
              processListItems(subList.items, level + 1, subList.ordered);
            });
          });
        };

        processListItems(token.items, 0, token.ordered);
        break;

      case 'table':
        const headers = token.header.map((h: any) => h.text);
        const rows = token.rows.map((row: any) => row.map((cell: any) => cell.text));
        const allRows = [headers, ...rows];
        
        addBlock({
            type: BlockType.TABLE,
            content: '',
            tableRows: allRows
        });
        break;

      case 'hr':
        addBlock({ type: BlockType.HORIZONTAL_RULE, content: '' });
        break;

      case 'image':
        addBlock({
          type: BlockType.IMAGE,
          content: token.href,
          metadata: {
            alt: token.text,
            title: token.title
          }
        });
        break;
        
      case 'space':
        break;

      default:
        console.warn(`Unknown token type: ${token.type}`, token);
        break;
    }
  };

  tokens.forEach(token => {
     const raw = token.raw;
     const newlines = (raw.match(/\n/g) || []).length;
     const len = raw.length;
     
     const blockStartLine = currentLine;
     const normalizedEndIndex = currentNormalizedIndex + len;
     const relativeStartIndex =
       originalIndexByNormalizedBoundary[currentNormalizedIndex]
       ?? currentNormalizedIndex;
     const relativeEndIndex =
       originalIndexByNormalizedBoundary[normalizedEndIndex]
       ?? normalizedEndIndex;
     const blockStartIndex = charOffset + relativeStartIndex;
     const tokenSource = markdown.slice(
       relativeStartIndex,
       relativeEndIndex,
     );
     
     currentLine += newlines;
     currentNormalizedIndex = normalizedEndIndex;
     
     if (token.type === 'space') return;
     
     processToken(token, blockStartLine, blockStartIndex, tokenSource);
  });

  return finalizeBlocks(blocks);
};
