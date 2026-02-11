/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import { Paragraph, ImageRun, AlignmentType, TextRun } from "docx";
import { DocxConfig } from "../types";
import { WORD_THEME } from "../../../constants/theme";

const { SPACING } = WORD_THEME;

/**
 * Helper to get image dimensions in browser
 */
const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64;
  });
};

/**
 * Helper to convert base64 to Uint8Array
 */
const base64ToUint8Array = (base64Str: string): Uint8Array => {
  const parts = base64Str.split(',');
  const base64Data = parts.length > 1 ? parts[1] : parts[0];
  const binaryData = atob(base64Data);
  const buffer = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    buffer[i] = binaryData.charCodeAt(i);
  }
  return buffer;
};

export const createImageBlock = async (src: string, alt: string, config: DocxConfig): Promise<Paragraph[]> => {
  try {
    // 1. Resolve ID to Base64 if needed
    const realSrc = (config.imageRegistry && config.imageRegistry[src]) ? config.imageRegistry[src] : src;

    // 2. Convert to Buffer
    let imageData: Uint8Array;
    let type: "png" | "jpg" | "gif" | "bmp" = "png";

    if (realSrc.startsWith('data:image/')) {
      const match = realSrc.match(/^data:image\/(\w+);base64,/);
      if (match) {
        type = (match[1] === 'jpeg' ? 'jpg' : match[1]) as any;
      }
      imageData = base64ToUint8Array(realSrc);
    } else {
      // For external URLs, we might need to fetch them (not implemented for simplicity)
      return [new Paragraph({ text: `[Image: ${alt || src}]`, spacing: SPACING.PARAGRAPH })];
    }

    // 3. Get Dimensions and Scale
    const dims = await getImageDimensions(realSrc);
    if (dims.width === 0) return [];

    // Increment Figure Counter
    if (config.counters) {
        config.counters.figure++;
    }
    const figNum = config.counters ? config.counters.figure : 0;

    // Publisher Requirement 09 & 10
    // Max width is 13cm. Full page is 13x18cm.
    const isFullPage = alt.includes('full-page');
    const cleanAlt = alt.replace('full-page', '').trim();
    
    const MAX_WIDTH_CM = 13;
    const MAX_HEIGHT_CM = isFullPage ? 18 : 20; // Limit height too to avoid breaking layout

    const maxWidthPx = MAX_WIDTH_CM * 37.8; // 1cm approx 37.8px (96dpi)
    const maxHeightPx = MAX_HEIGHT_CM * 37.8;

    let targetWidth = dims.width;
    let targetHeight = dims.height;

    // Scale to fit max width
    if (targetWidth > maxWidthPx) {
        const ratio = maxWidthPx / targetWidth;
        targetWidth = maxWidthPx;
        targetHeight = targetHeight * ratio;
    }

    // Scale to fit max height if still too large
    if (targetHeight > maxHeightPx) {
        const ratio = maxHeightPx / targetHeight;
        targetHeight = maxHeightPx;
        targetWidth = targetWidth * ratio;
    }

    // 4. Create Paragraphs
    const imagePara = new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: imageData,
          transformation: {
            width: targetWidth,
            height: targetHeight,
          },
          type: type
        })
      ],
      spacing: { before: 200, after: 100 }
    });

    const result = [imagePara];

    // 4. Add Caption with Figure Number (Requirement 05)
    result.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
          new TextRun({
              text: `圖 ${figNum} ${cleanAlt}`,
              bold: true,
              size: 20, // 10pt
          })
      ],
      spacing: { before: 0, after: 200 },
    }));

    return result;
  } catch (e) {
    console.error("Failed to create image block", e);
    return [];
  }
};
