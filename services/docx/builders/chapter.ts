import {
  AlignmentType,
  Paragraph,
  TextRun,
} from 'docx';
import type { ChapterMetadata } from '../../types';
import { DOCUMENT_STYLE_IDS } from '../styles';
import type { DocxConfig } from '../types';
import { wrapBookmark } from '../bookmarks';
import {
  createImageParagraph,
  resolveImageMedia,
} from './image';

const CHAPTER_COLORS = {
  part: '2E8B8B',
  primary: '0B2545',
  english: '2E74B5',
  summary: '333333',
  outcome: 'C55A3A',
} as const;

const createRun = (
  text: string,
  config: DocxConfig,
  options: {
    size: number;
    color?: string;
    bold?: boolean;
    italics?: boolean;
  },
): TextRun => new TextRun({
  text,
  font: config.profile.fonts.body,
  ...options,
});

const createMissingImageFallback = (
  imageKey: string,
  config: DocxConfig,
): Paragraph => {
  config.reportWarning({
    code: 'CHAPTER_IMAGE_MISSING',
    message: `找不到章首頁圖片：${imageKey}。已改用文字提示繼續匯出。`,
  });
  return new Paragraph({
    style: DOCUMENT_STYLE_IDS.callout,
    text: `[缺少章首頁圖片：${imageKey}]`,
    spacing: { before: 0, after: 120 },
    keepNext: true,
  });
};

/**
 * 依出版社參考產生器的順序與節奏建立章首頁。
 */
export const createChapterOpener = (
  chapter: ChapterMetadata,
  config: DocxConfig,
  pageBreakBefore: boolean,
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let needsPageBreak = pageBreakBefore;
  const takePageBreak = (): boolean => {
    const value = needsPageBreak;
    needsPageBreak = false;
    return value;
  };

  if (chapter.part) {
    paragraphs.push(new Paragraph({
      pageBreakBefore: takePageBreak(),
      children: [createRun(chapter.part, config, {
        size: 18,
        color: CHAPTER_COLORS.part,
        bold: true,
      })],
      spacing: { before: 0, after: 40 },
      keepNext: true,
    }));
  }

  paragraphs.push(new Paragraph({
    pageBreakBefore: takePageBreak(),
    children: [createRun(
      chapter.number.toLowerCase() === 'appendix' ? 'A' : chapter.number,
      config,
      {
        size: 68,
        color: CHAPTER_COLORS.primary,
        bold: true,
      },
    )],
    spacing: { before: 0, after: 0 },
    keepNext: true,
  }));

  const bookmark = config.bookmarks.allocate({
    kind: 'chapter',
    content: chapter.number,
  });
  paragraphs.push(new Paragraph({
    children: wrapBookmark(bookmark, [
      createRun(chapter.title, config, {
        size: 44,
        color: CHAPTER_COLORS.primary,
        bold: true,
      }),
    ]),
    spacing: { before: 0, after: 40 },
    keepNext: true,
  }));

  if (chapter.englishTitle) {
    paragraphs.push(new Paragraph({
      children: [createRun(chapter.englishTitle, config, {
        size: 19,
        color: CHAPTER_COLORS.english,
        italics: true,
      })],
      spacing: { before: 0, after: 120 },
      keepNext: true,
    }));
  }

  if (chapter.summary) {
    paragraphs.push(new Paragraph({
      children: [createRun(chapter.summary, config, {
        size: 21,
        color: CHAPTER_COLORS.summary,
      })],
      spacing: { before: 0, after: 140, line: 300 },
      keepNext: true,
    }));
  }

  if (chapter.image) {
    const imageSource = config.imageRegistry[chapter.image] ?? chapter.image;
    if (imageSource.startsWith('data:')) {
      paragraphs.push(createImageParagraph({
        media: resolveImageMedia(imageSource),
        config,
        alt: `章首頁：${chapter.title}`,
        title: chapter.title,
        fixedWidthCm: config.profile.image.chapterOpenerWidthCm,
        spacing: { before: 0, after: 120 },
        keepNext: true,
      }));
    } else {
      paragraphs.push(createMissingImageFallback(chapter.image, config));
    }
  }

  paragraphs.push(new Paragraph({
    children: [createRun('本章完成', config, {
      size: 21,
      color: CHAPTER_COLORS.outcome,
      bold: true,
    })],
    spacing: { before: 20, after: 40 },
    keepNext: chapter.goals.length > 0,
  }));

  for (const goal of chapter.goals) {
    paragraphs.push(new Paragraph({
      style: DOCUMENT_STYLE_IDS.normal,
      children: [createRun(goal, config, { size: 19 })],
      numbering: {
        reference: 'default-bullet',
        level: 0,
        instance: 0,
      },
      indent: { left: 360, hanging: 230 },
      spacing: { before: 0, after: 20, line: 252 },
    }));
  }

  return paragraphs;
};
