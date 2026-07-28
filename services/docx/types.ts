/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---
import type { DocumentMeta } from '../types';
import type { ExportSettings, ResolvedPageLayout } from './layout/types';
import type { DocumentStyleProfile } from './profiles';

export interface DocxExportWarning {
  code: 'QR_GENERATION_FAILED' | 'MERMAID_GENERATION_FAILED';
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
  reportWarning: (warning: DocxExportWarning) => void;
  counters: {
    figure: number;
    qr: number;
    bookmark: number;
    listInstance: number;
  };
}
