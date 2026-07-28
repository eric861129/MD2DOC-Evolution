import {
  ExternalHyperlink,
  ImageRun,
  ShadingType,
  TextRun,
  UnderlineType,
  type IRunOptions,
  type ParagraphChild,
} from 'docx';
import { Lexer, type Token, type Tokens } from 'marked';
import { WORD_THEME } from '../../../constants/theme';
import {
  InlineStyleType,
  parseInlineElements,
  type InlineStyleSegment,
} from '../../../utils/styleParser';
import { generateQRCode } from '../../qrCodeService';
import { DocxConfig } from '../types';

const { FONTS, COLORS, FONT_SIZES } = WORD_THEME;

interface InlineRunState {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  hyperlink?: boolean;
}

// --- 字型配置 ---
export const FONT_CONFIG_NORMAL = {
  ascii: FONTS.LATIN,
  hAnsi: FONTS.LATIN,
  eastAsia: FONTS.CJK,
  cs: FONTS.LATIN,
};

const createRunOptions = (
  text: string,
  state: InlineRunState,
): IRunOptions => ({
  text,
  bold: state.bold,
  italics: state.italics,
  ...(state.underline || state.hyperlink
    ? {
        color: COLORS.LINK_BLUE,
        underline: {
          type: UnderlineType.SINGLE,
          color: COLORS.LINK_BLUE,
        },
      }
    : {}),
});

const createTextRun = (
  text: string,
  state: InlineRunState,
): TextRun => new TextRun(createRunOptions(text, state));

const createCodeRun = (
  text: string,
  state: InlineRunState,
  config?: DocxConfig,
): TextRun => new TextRun({
  ...createRunOptions(text, state),
  font: config?.profile.fonts.code ?? FONT_CONFIG_NORMAL,
  size: 19,
  color: config?.profile.colors.inlineCode ?? COLORS.BLACK,
  shading: {
    fill: config?.profile.paragraph.code.shadingFill ?? COLORS.BG_CODE,
    type: ShadingType.CLEAR,
    color: 'auto',
  },
});

const createImageRuns = (
  source: string,
  config?: DocxConfig,
): ParagraphChild[] => {
  try {
    const realSource = config?.imageRegistry[source] ?? source;
    if (!realSource.startsWith('data:image/')) {
      return [];
    }

    const base64Data = realSource.split(',')[1];
    const binaryData = atob(base64Data);
    const buffer = new Uint8Array(binaryData.length);
    for (let index = 0; index < binaryData.length; index += 1) {
      buffer[index] = binaryData.charCodeAt(index);
    }

    return [
      new ImageRun({
        data: buffer,
        transformation: { width: 100, height: 100 },
        type: 'png',
      }),
    ];
  } catch (error) {
    console.warn('Failed to render inline image', error);
    return [];
  }
};

const createLegacyQrRuns = async (
  url: string,
  config?: DocxConfig,
): Promise<ParagraphChild[]> => {
  if (config?.profile.id !== 'technical-legacy') {
    return [];
  }

  try {
    const qrBuffer = await generateQRCode(url);
    if (qrBuffer.byteLength === 0) {
      return [];
    }

    return [
      new TextRun({ text: ' ', size: 4 }),
      new ImageRun({
        data: qrBuffer,
        transformation: { width: 45, height: 45 },
        type: 'png',
      }),
      new TextRun({ text: ' ', size: 4 }),
    ];
  } catch (error) {
    console.warn(`Failed to generate QR for ${url}`, error);
    return [];
  }
};

const renderInlineTokens = async (
  tokens: Token[],
  state: InlineRunState,
  config?: DocxConfig,
): Promise<ParagraphChild[]> => {
  const children: ParagraphChild[] = [];
  let currentState = state;

  for (const token of tokens) {
    if (token.type === 'html') {
      const html = (token as Tokens.HTML).raw.toLowerCase();
      if (html === '<u>') {
        currentState = { ...currentState, underline: true };
        continue;
      }
      if (html === '</u>') {
        currentState = { ...currentState, underline: state.underline };
        continue;
      }
    }

    children.push(...await renderInlineToken(token, currentState, config));
  }

  return children;
};

const createExternalHyperlink = async (
  tokens: Token[],
  fallbackText: string,
  url: string,
  state: InlineRunState,
  config?: DocxConfig,
): Promise<ParagraphChild[]> => {
  const renderedChildren = await renderInlineTokens(
    tokens,
    { ...state, hyperlink: true },
    config,
  );
  const textRuns = renderedChildren.filter(
    (child): child is TextRun => child instanceof TextRun,
  );

  const hyperlink = new ExternalHyperlink({
    children: textRuns.length > 0
      ? textRuns
      : [createTextRun(fallbackText, { ...state, hyperlink: true })],
    link: url,
  });

  return [
    hyperlink,
    ...await createLegacyQrRuns(url, config),
  ];
};

const renderCustomSegment = (
  segment: InlineStyleSegment,
  state: InlineRunState,
): ParagraphChild[] => {
  switch (segment.type) {
    case InlineStyleType.BOLD:
    case InlineStyleType.ITALIC:
    case InlineStyleType.CODE:
    case InlineStyleType.LINK:
    case InlineStyleType.IMAGE:
      return [createTextRun(segment.original, state)];
    case InlineStyleType.UNDERLINE:
      return [createTextRun(segment.content, { ...state, underline: true })];
    case InlineStyleType.UI_BUTTON:
      return [
        new TextRun({
          ...createRunOptions(segment.content, state),
          bold: true,
          shading: {
            fill: COLORS.BG_BUTTON,
            type: ShadingType.CLEAR,
            color: 'auto',
          },
        }),
      ];
    case InlineStyleType.UI_EMPHASIS:
      return [
        new TextRun({
          ...createRunOptions(segment.content, state),
          bold: true,
        }),
      ];
    case InlineStyleType.SHORTCUT:
      return [
        new TextRun({
          ...createRunOptions(segment.content, state),
          size: FONT_SIZES.SHORTCUT,
          shading: {
            fill: COLORS.BG_SHORTCUT,
            type: ShadingType.CLEAR,
            color: 'auto',
          },
        }),
      ];
    case InlineStyleType.BOOK:
      return [
        new TextRun({
          ...createRunOptions(segment.content, state),
          bold: true,
        }),
      ];
    default:
      return [createTextRun(segment.content, state)];
  }
};

const renderTextLeaf = (
  text: string,
  state: InlineRunState,
): ParagraphChild[] => {
  const hasCustomSyntax = text.includes('【')
    || text.includes('「')
    || text.includes('[')
    || text.includes('『')
    || text.includes('<u>');
  if (!hasCustomSyntax) {
    return [createTextRun(text, state)];
  }

  const children: ParagraphChild[] = [];
  for (const segment of parseInlineElements(text)) {
    children.push(...renderCustomSegment(segment, state));
  }
  return children;
};

const renderInlineToken = async (
  token: Token,
  state: InlineRunState,
  config?: DocxConfig,
): Promise<ParagraphChild[]> => {
  switch (token.type) {
    case 'strong': {
      const strong = token as Tokens.Strong;
      return renderInlineTokens(
        strong.tokens,
        { ...state, bold: true },
        config,
      );
    }
    case 'em': {
      const emphasis = token as Tokens.Em;
      return renderInlineTokens(
        emphasis.tokens,
        { ...state, italics: true },
        config,
      );
    }
    case 'codespan':
      return [
        createCodeRun((token as Tokens.Codespan).text, state, config),
      ];
    case 'link': {
      const link = token as Tokens.Link;
      return createExternalHyperlink(
        link.tokens,
        link.text,
        link.href,
        state,
        config,
      );
    }
    case 'image':
      return createImageRuns((token as Tokens.Image).href, config);
    case 'text': {
      const text = token as Tokens.Text;
      return text.tokens?.length
        ? renderInlineTokens(text.tokens, state, config)
        : renderTextLeaf(text.text, state);
    }
    case 'escape':
      return renderTextLeaf((token as Tokens.Escape).text, state);
    case 'br':
      return [
        new TextRun({
          ...createRunOptions('', state),
          break: 1,
        }),
      ];
    case 'del':
      return renderInlineTokens((token as Tokens.Del).tokens, state, config);
    case 'html':
      return renderTextLeaf((token as Tokens.HTML).raw, state);
    default: {
      const generic = token as Tokens.Generic;
      if (generic.tokens?.length) {
        return renderInlineTokens(generic.tokens, state, config);
      }
      const text = typeof generic.text === 'string'
        ? generic.text
        : generic.raw;
      return renderTextLeaf(text, state);
    }
  }
};

// --- Helper: 行內樣式解析 ---
export const parseInlineStyles = async (
  text: string,
  config?: DocxConfig,
): Promise<ParagraphChild[]> =>
  renderInlineTokens(Lexer.lexInline(text), {}, config);
