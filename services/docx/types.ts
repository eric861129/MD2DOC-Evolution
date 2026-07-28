/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---
import type { DocumentMeta } from '../types';
import type { ExportSettings, ResolvedPageLayout } from './layout/types';
import type { DocumentStyleProfile } from './profiles';

export interface GenerateDocxOptions {
  exportSettings: ExportSettings;
  showLineNumbers: boolean;
  meta?: DocumentMeta;
  imageRegistry?: Record<string, string>;
}

export interface DocxConfig {
  layout: ResolvedPageLayout;
  profile: DocumentStyleProfile;
  showLineNumbers: boolean;
  meta: DocumentMeta;
  imageRegistry: Record<string, string>;
  counters: {
    figure: number;
    qr: number;
    bookmark: number;
    listInstance: number;
  };
}
