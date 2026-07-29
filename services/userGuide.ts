import userGuideMarkdown from '../docs/USER_GUIDE.md?raw';

export type GuideInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'emphasis'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type GuideBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 3; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; content: string }
  | { type: 'quote'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'rule' };

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
  searchText: string;
}

export interface GuideDocument {
  title: string;
  introduction: GuideBlock[];
  sections: GuideSection[];
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
const LIST_PATTERN = /^(\d+\.)\s+(.+)$|^[-*]\s+(.+)$/;
const TABLE_DIVIDER_PATTERN = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/;

const createSectionId = (title: string, index: number) => {
  const normalized = title
    .toLocaleLowerCase('zh-TW')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || `section-${index + 1}`;
};

const splitTableRow = (line: string) => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map((cell) => cell.trim());

const blockSearchText = (block: GuideBlock): string => {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
    case 'code':
      return block.content;
    case 'list':
      return block.items.join(' ');
    case 'table':
      return [...block.headers, ...block.rows.flat()].join(' ');
    case 'rule':
      return '';
  }
};

/**
 * 將受控的教學 Markdown 解析為安全 AST。此解析器不產生 HTML，
 * 未支援的標記會以純文字保留，交由 React 自動跳脫。
 */
export const parseUserGuideMarkdown = (source: string): GuideDocument => {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let title = 'MD2DOC-Evolution 完整使用教學';
  const introduction: GuideBlock[] = [];
  const sections: GuideSection[] = [];
  let currentBlocks = introduction;

  const pushParagraph = (paragraphLines: string[]) => {
    const content = paragraphLines.join(' ').trim();
    if (content) currentBlocks.push({ type: 'paragraph', content });
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim();
      index += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const sectionTitle = trimmed.slice(3).trim();
      const section: GuideSection = {
        id: createSectionId(sectionTitle, sections.length),
        title: sectionTitle,
        blocks: [],
        searchText: '',
      };
      sections.push(section);
      currentBlocks = section.blocks;
      index += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      currentBlocks.push({
        type: 'heading',
        level: 3,
        content: trimmed.slice(4).trim(),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      currentBlocks.push({
        type: 'code',
        language,
        content: codeLines.join('\n'),
      });
      continue;
    }

    if (trimmed === '---') {
      currentBlocks.push({ type: 'rule' });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      currentBlocks.push({ type: 'quote', content: quoteLines.join(' ') });
      continue;
    }

    const listMatch = trimmed.match(LIST_PATTERN);
    if (listMatch) {
      const ordered = Boolean(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const nextMatch = lines[index].trim().match(LIST_PATTERN);
        if (!nextMatch || Boolean(nextMatch[1]) !== ordered) break;
        items.push((nextMatch[2] ?? nextMatch[3]).trim());
        index += 1;
      }
      currentBlocks.push({ type: 'list', ordered, items });
      continue;
    }

    if (
      trimmed.includes('|')
      && index + 1 < lines.length
      && TABLE_DIVIDER_PATTERN.test(lines[index + 1].trim())
    ) {
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      currentBlocks.push({ type: 'table', headers, rows });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next
        || next.startsWith('#')
        || next.startsWith('```')
        || next.startsWith('>')
        || next === '---'
        || LIST_PATTERN.test(next)
      ) break;
      paragraphLines.push(next);
      index += 1;
    }
    pushParagraph(paragraphLines);
  }

  for (const section of sections) {
    section.searchText = [
      section.title,
      ...section.blocks.map(blockSearchText),
    ].join(' ').toLocaleLowerCase('zh-TW');
  }

  return { title, introduction, sections };
};

export const parseGuideInline = (content: string): GuideInline[] => {
  const result: GuideInline[] = [];
  let cursor = 0;

  for (const match of content.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      result.push({ type: 'text', text: content.slice(cursor, start) });
    }

    const token = match[0];
    if (token.startsWith('**')) {
      result.push({ type: 'strong', text: token.slice(2, -2) });
    } else if (token.startsWith('`')) {
      result.push({ type: 'code', text: token.slice(1, -1) });
    } else if (token.startsWith('*')) {
      result.push({ type: 'emphasis', text: token.slice(1, -1) });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        result.push({ type: 'link', text: linkMatch[1], href: linkMatch[2] });
      } else {
        result.push({ type: 'text', text: token });
      }
    }
    cursor = start + token.length;
  }

  if (cursor < content.length) {
    result.push({ type: 'text', text: content.slice(cursor) });
  }

  return result;
};

export const isSafeGuideHref = (href: string): boolean => {
  if (href.startsWith('#') || href.startsWith('/')) return true;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const searchGuideSections = (
  document: GuideDocument,
  query: string,
): GuideSection[] => {
  const normalized = query.trim().toLocaleLowerCase('zh-TW');
  if (!normalized) return document.sections;
  const terms = normalized.split(/\s+/).filter(Boolean);
  return document.sections.filter((section) =>
    terms.every((term) => section.searchText.includes(term)));
};

export const USER_GUIDE_MARKDOWN = userGuideMarkdown;
export const USER_GUIDE_DOCUMENT = parseUserGuideMarkdown(userGuideMarkdown);
