import type { DocumentProfileId } from '../layout/types';

export interface FontFamilySet {
  ascii: string;
  hAnsi: string;
  eastAsia: string;
  cs: string;
}

export interface ParagraphStyleToken {
  sizeHalfPoints: number;
  beforeTwips: number;
  afterTwips: number;
  lineTwips?: number;
  color?: string;
  bold?: boolean;
  italics?: boolean;
  shadingFill?: string;
  leftIndentTwips?: number;
  rightIndentTwips?: number;
}

export interface HeadingStyleToken extends ParagraphStyleToken {
  color: string;
  bold: true;
  outlineLevel: 0 | 1 | 2;
}

export type CalloutKind = 'note' | 'tip' | 'warning' | 'important' | 'caution';

export interface CalloutStyleToken {
  label: string;
  fill: string;
}

export interface TableStyleToken {
  styleId: string;
  headerFill: string;
  indentTwips: number;
  cellMarginsTwips: {
    top: number;
    bottom: number;
    start: number;
    end: number;
  };
  bodySizeHalfPoints: number;
  paragraphAfterTwips: number;
  lineTwips?: number;
}

export interface DocumentStyleProfile {
  id: DocumentProfileId;
  fonts: {
    body: FontFamilySet;
    code: FontFamilySet;
  };
  colors: {
    body: string;
    heading1: string;
    heading2: string;
    heading3: string;
    inlineCode: string;
    caption: string;
    calloutText: string;
  };
  paragraph: {
    normal: ParagraphStyleToken;
    code: ParagraphStyleToken;
    callout: ParagraphStyleToken;
    caption: ParagraphStyleToken;
  };
  heading: Record<'h1' | 'h2' | 'h3', HeadingStyleToken>;
  callouts: Record<CalloutKind, CalloutStyleToken>;
  table: TableStyleToken;
  image: {
    maxWidthCm: number;
    chapterOpenerWidthCm: number;
    allowedMarginIntrusionCm: number;
  };
  headerFooter: {
    distanceCm: number;
    showTitle: boolean;
    showBookAndPage: boolean;
  };
}
