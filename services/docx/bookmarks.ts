import {
  BookmarkEnd,
  BookmarkStart,
  type ParagraphChild,
} from 'docx';

const MAX_BOOKMARK_NAME_LENGTH = 40;

export interface BookmarkAllocation {
  name: string;
  numericId: number;
}

export interface BookmarkRequest {
  kind: 'chapter' | 'heading';
  content: string;
  headingLevel?: 1 | 2 | 3;
}

export interface BookmarkAllocator {
  allocate: (request: BookmarkRequest) => BookmarkAllocation;
}

const createAsciiSlug = (content: string): string => content
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

/**
 * 建立文件範圍的書籤配置器，統一名稱序號與 OOXML 數字識別碼。
 */
export const createBookmarkAllocator = (): BookmarkAllocator => {
  let sequence = 0;

  return {
    allocate: ({ kind, content, headingLevel }) => {
      sequence += 1;
      const prefix = kind === 'heading'
        ? `h${headingLevel ?? 1}_`
        : 'chapter_';
      const suffix = `_${sequence}`;
      const fallback = kind === 'heading'
        ? `heading_${sequence}`
        : 'chapter';
      const slug = createAsciiSlug(content) || fallback;
      const maximumSlugLength = Math.max(
        1,
        MAX_BOOKMARK_NAME_LENGTH - prefix.length - suffix.length,
      );
      const truncatedSlug = slug
        .slice(0, maximumSlugLength)
        .replace(/_+$/g, '')
        || fallback.slice(0, maximumSlugLength);

      return {
        name: `${prefix}${truncatedSlug}${suffix}`,
        numericId: sequence,
      };
    },
  };
};

/**
 * 使用相同 numeric id 建立一對明確的 OOXML bookmark start/end。
 */
export const wrapBookmark = (
  allocation: BookmarkAllocation,
  children: readonly ParagraphChild[],
): ParagraphChild[] => [
  new BookmarkStart(
    allocation.name,
    allocation.numericId,
  ) as unknown as ParagraphChild,
  ...children,
  new BookmarkEnd(allocation.numericId) as unknown as ParagraphChild,
];
