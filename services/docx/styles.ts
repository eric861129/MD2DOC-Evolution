import {
  LineRuleType,
  ShadingType,
  type IBaseParagraphStyleOptions,
  type IParagraphStyleOptions,
  type IStylesOptions,
} from 'docx';
import type {
  DocumentStyleProfile,
  FontFamilySet,
  ParagraphStyleToken,
} from './profiles';

export const DOCUMENT_STYLE_IDS = {
  normal: 'Normal',
  heading1: 'Heading1',
  heading2: 'Heading2',
  heading3: 'Heading3',
  codeBlock: 'CodeBlock',
  callout: 'Callout',
  bookCaption: 'BookCaption',
} as const;

const createRunStyle = (
  font: FontFamilySet,
  token: ParagraphStyleToken,
) => ({
  font,
  size: token.sizeHalfPoints,
  color: token.color,
  bold: token.bold,
  italics: token.italics,
});

const createParagraphStyle = (token: ParagraphStyleToken) => ({
  spacing: {
    before: token.beforeTwips,
    after: token.afterTwips,
    ...(token.lineTwips === undefined
      ? {}
      : {
          line: token.lineTwips,
          lineRule: LineRuleType.AUTO,
        }),
  },
  indent:
    token.leftIndentTwips === undefined && token.rightIndentTwips === undefined
      ? undefined
      : {
          left: token.leftIndentTwips,
          right: token.rightIndentTwips,
        },
  shading: token.shadingFill
    ? {
        type: ShadingType.CLEAR,
        color: 'auto',
        fill: token.shadingFill,
      }
    : undefined,
});

const createHeadingStyle = (
  profile: DocumentStyleProfile,
  level: 'h1' | 'h2' | 'h3',
): IBaseParagraphStyleOptions => {
  const token = profile.heading[level];

  return {
    run: createRunStyle(profile.fonts.body, token),
    paragraph: {
      ...createParagraphStyle(token),
      keepNext: true,
      keepLines: true,
      outlineLevel: token.outlineLevel,
    },
  };
};

const createNamedParagraphStyle = (
  id: string,
  name: string,
  font: FontFamilySet,
  token: ParagraphStyleToken,
): IParagraphStyleOptions => ({
  id,
  name,
  basedOn: id === DOCUMENT_STYLE_IDS.normal ? undefined : DOCUMENT_STYLE_IDS.normal,
  next: DOCUMENT_STYLE_IDS.normal,
  quickFormat: true,
  run: createRunStyle(font, token),
  paragraph: createParagraphStyle(token),
});

/**
 * 將 Profile 轉成 docx 套件可直接傳入 Document 的命名樣式設定。
 */
export const createDocumentStyles = (
  profile: DocumentStyleProfile,
): IStylesOptions => ({
  default: {
    document: {
      run: createRunStyle(profile.fonts.body, profile.paragraph.normal),
      paragraph: createParagraphStyle(profile.paragraph.normal),
    },
    heading1: createHeadingStyle(profile, 'h1'),
    heading2: createHeadingStyle(profile, 'h2'),
    heading3: createHeadingStyle(profile, 'h3'),
  },
  paragraphStyles: [
    createNamedParagraphStyle(
      DOCUMENT_STYLE_IDS.normal,
      'Normal',
      profile.fonts.body,
      profile.paragraph.normal,
    ),
    createNamedParagraphStyle(
      DOCUMENT_STYLE_IDS.codeBlock,
      'Code Block',
      profile.fonts.code,
      profile.paragraph.code,
    ),
    createNamedParagraphStyle(
      DOCUMENT_STYLE_IDS.callout,
      'Callout',
      profile.fonts.body,
      profile.paragraph.callout,
    ),
    createNamedParagraphStyle(
      DOCUMENT_STYLE_IDS.bookCaption,
      'Book Caption',
      profile.fonts.body,
      profile.paragraph.caption,
    ),
  ],
});
