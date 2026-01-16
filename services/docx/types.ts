/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---
import { DocumentMeta } from "../types";

export interface DocxConfig {
  widthCm: number;
  heightCm: number;
  showLineNumbers?: boolean;
  meta?: DocumentMeta;
  imageRegistry?: Record<string, string>;
}
