/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---
import { DocumentMeta } from "../types";
import type { ExportSettings } from './layout/types';

export interface DocxConfig {
  widthCm: number;
  heightCm: number;
  /** 匯出時使用者選擇的版面設定；生成器切換至新合約前暫作型別橋接。 */
  exportSettings?: ExportSettings;
  showLineNumbers?: boolean;
  meta?: DocumentMeta;
  imageRegistry?: Record<string, string>;
  counters?: {
    figure: number;
    qr: number;
  };
}
