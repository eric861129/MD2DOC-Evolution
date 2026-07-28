/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---
import type { DocumentMeta } from '../types';
import type { BookmarkAllocator } from './bookmarks';
import type { ExportSettings, ResolvedPageLayout } from './layout/types';
import type { DocumentStyleProfile } from './profiles';

export interface DocxExportWarning {
  code:
    | 'QR_GENERATION_FAILED'
    | 'MERMAID_GENERATION_FAILED'
    | 'CHAPTER_IMAGE_MISSING'
    | 'PUBLISHER_TOC_MANUAL_CONTENT';
  message: string;
  url?: string;
}

export interface GenerateDocxOptions {
  exportSettings: ExportSettings;
  showLineNumbers: boolean;
  meta?: DocumentMeta;
  imageRegistry?: Record<string, string>;
  onWarning?: (warning: DocxExportWarning) => void;
}

export interface DocxConfig {
  layout: ResolvedPageLayout;
  profile: DocumentStyleProfile;
  showLineNumbers: boolean;
  meta: DocumentMeta;
  imageRegistry: Record<string, string>;
  bookmarks: BookmarkAllocator;
  reportWarning: (warning: DocxExportWarning) => void;
  counters: {
    figure: number;
    qr: number;
    listInstance: number;
    outputBlock: number;
  };
}
