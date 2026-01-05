/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// --- Docx Configuration Types ---

export interface DocxConfig {
  widthCm: number;
  heightCm: number;
  showLineNumbers?: boolean;
  qrCodeMap?: Map<string, ArrayBuffer>;
}
