/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import {
  AlignmentType,
  ImageRun,
  Paragraph,
  type IImageOptions,
} from 'docx';
import { WORD_THEME } from '../../../constants/theme';
import { DOCUMENT_STYLE_IDS } from '../styles';
import type { DocxConfig } from '../types';

const { SPACING } = WORD_THEME;
const EMUS_PER_CENTIMETRE = 360_000;
const EMUS_PER_PIXEL = 9_525;

export type SupportedImageType = 'png' | 'jpg' | 'gif';

export interface ResolvedImageMedia {
  data: Uint8Array;
  type: SupportedImageType;
  width: number;
  height: number;
}

interface ImageParagraphOptions {
  media: ResolvedImageMedia;
  config: DocxConfig;
  alt: string;
  title: string;
  fixedWidthCm?: number;
  spacing?: {
    before: number;
    after: number;
  };
}

const startsWithBytes = (
  data: Uint8Array,
  signature: readonly number[],
): boolean => signature.every((byte, index) => data[index] === byte);

const detectMagicType = (
  data: Uint8Array,
): SupportedImageType | undefined => {
  if (startsWithBytes(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }
  if (startsWithBytes(data, [0xff, 0xd8, 0xff])) {
    return 'jpg';
  }
  if (
    startsWithBytes(data, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
    || startsWithBytes(data, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return 'gif';
  }
  return undefined;
};

const normalizeMimeType = (
  mimeType: string | undefined,
): SupportedImageType | undefined => {
  switch (mimeType?.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/gif':
      return 'gif';
    default:
      return undefined;
  }
};

const decodeBase64 = (value: string): Uint8Array => {
  try {
    const binary = atob(value);
    const buffer = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      buffer[index] = binary.charCodeAt(index);
    }
    return buffer;
  } catch {
    throw new Error('圖片 data URL 的 Base64 內容無效。');
  }
};

const readPngDimensions = (
  data: Uint8Array,
): { width: number; height: number } | undefined => {
  if (data.length < 24 || !startsWithBytes(data, [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])) {
    return undefined;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
};

const readGifDimensions = (
  data: Uint8Array,
): { width: number; height: number } | undefined => {
  if (data.length < 10) {
    return undefined;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    width: view.getUint16(6, true),
    height: view.getUint16(8, true),
  };
};

const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

const readJpegDimensions = (
  data: Uint8Array,
): { width: number; height: number } | undefined => {
  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (offset + 3 >= data.length) {
      return undefined;
    }

    const segmentLength = (data[offset + 2] << 8) | data[offset + 3];
    if (segmentLength < 2 || offset + 2 + segmentLength > data.length) {
      return undefined;
    }
    if (JPEG_START_OF_FRAME_MARKERS.has(marker) && segmentLength >= 7) {
      return {
        height: (data[offset + 5] << 8) | data[offset + 6],
        width: (data[offset + 7] << 8) | data[offset + 8],
      };
    }
    offset += 2 + segmentLength;
  }
  return undefined;
};

const readImageDimensions = (
  data: Uint8Array,
  type: SupportedImageType,
): { width: number; height: number } => {
  const dimensions = type === 'png'
    ? readPngDimensions(data)
    : type === 'gif'
      ? readGifDimensions(data)
      : readJpegDimensions(data);

  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    throw new Error(`無法讀取 ${type} 圖片的原始尺寸。`);
  }
  return dimensions;
};

/**
 * 依 magic bytes 判定實際媒體格式；若宣告 MIME 與內容衝突則拒絕匯出。
 */
export const resolveImageMediaBytes = (
  data: Uint8Array,
  mimeType?: string,
): ResolvedImageMedia => {
  const magicType = detectMagicType(data);
  const mimeImageType = normalizeMimeType(mimeType);
  const declaredMimeType = mimeType?.toLowerCase();

  if (
    declaredMimeType?.startsWith('image/')
    && !mimeImageType
  ) {
    throw new Error(`不支援的圖片 MIME：${mimeType}。`);
  }
  if (mimeImageType && magicType && mimeImageType !== magicType) {
    throw new Error(
      `圖片 MIME (${mimeType}) 與 magic bytes (${magicType}) 不一致。`,
    );
  }
  if (!magicType) {
    throw new Error(`不支援的圖片格式${mimeType ? `：${mimeType}` : ''}。`);
  }

  return {
    data,
    type: magicType,
    ...readImageDimensions(data, magicType),
  };
};

/**
 * 解析 Base64 data URL，並以內容簽章驗證 png、jpeg 或 gif。
 */
export const resolveImageMedia = (source: string): ResolvedImageMedia => {
  const match = source.match(
    /^data:([^;,]+)(?:;[^,]*)*;base64,([\s\S]+)$/i,
  );
  if (!match) {
    throw new Error('圖片來源必須是 Base64 data URL。');
  }
  return resolveImageMediaBytes(decodeBase64(match[2]), match[1]);
};

const centimetresToPixels = (centimetres: number): number =>
  centimetres * EMUS_PER_CENTIMETRE / EMUS_PER_PIXEL;

/**
 * 計算一般圖片可使用的最大寬度，包含版型允許侵入左右邊界的額度。
 */
export const getMaximumImageWidthCm = (config: DocxConfig): number =>
  Math.min(
    config.profile.image.maxWidthCm,
    config.layout.content.widthCm
      + config.profile.image.allowedMarginIntrusionCm * 2,
  );

const createImageRun = ({
  media,
  config,
  alt,
  title,
  fixedWidthCm,
}: ImageParagraphOptions): ImageRun => {
  const maximumWidthPx = centimetresToPixels(
    fixedWidthCm ?? getMaximumImageWidthCm(config),
  );
  const targetWidth = fixedWidthCm
    ? maximumWidthPx
    : Math.min(media.width, maximumWidthPx);
  const targetHeight = targetWidth * media.height / media.width;
  const accessibleName = title || alt || '圖片';

  const options: IImageOptions = {
    data: media.data,
    type: media.type,
    transformation: {
      width: targetWidth,
      height: targetHeight,
    },
    altText: {
      name: accessibleName,
      description: alt || accessibleName,
      title: title || accessibleName,
    },
  };
  return new ImageRun(options);
};

/**
 * 以共用的尺寸與替代文字規則建立置中的媒體段落。
 */
export const createImageParagraph = (
  options: ImageParagraphOptions,
): Paragraph => new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [createImageRun(options)],
  spacing: options.spacing ?? { before: 200, after: 100 },
});

export const createImageBlock = async (
  source: string,
  alt: string,
  title: string,
  config: DocxConfig,
): Promise<Paragraph[]> => {
  const realSource = config.imageRegistry[source] ?? source;
  if (!realSource.startsWith('data:')) {
    return [
      new Paragraph({
        text: `[Image: ${alt || source}]`,
        spacing: SPACING.PARAGRAPH,
      }),
    ];
  }

  const media = resolveImageMedia(realSource);
  config.counters.figure += 1;
  const figureNumber = config.counters.figure;
  const cleanAlt = alt.replace('full-page', '').trim();
  const imageParagraph = createImageParagraph({
    media,
    config,
    alt: cleanAlt,
    title,
  });
  const caption = new Paragraph({
    style: DOCUMENT_STYLE_IDS.bookCaption,
    alignment: AlignmentType.CENTER,
    text: `圖 ${figureNumber}${cleanAlt ? ` ${cleanAlt}` : ''}`,
  });

  return [imageParagraph, caption];
};
