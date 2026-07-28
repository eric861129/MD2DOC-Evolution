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
const MAX_DECODED_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_IMAGE_DIMENSION_PX = 65_535;
const MAX_IMAGE_PIXELS = 100_000_000;
const MAX_IMAGE_ASPECT_RATIO = 200;
const MAX_WORD_IMAGE_EMU = 2_147_483_647;

export type SupportedImageType = 'png' | 'jpg' | 'gif';

export interface ResolvedImageMedia {
  data: Uint8Array;
  type: SupportedImageType;
  width: number;
  height: number;
}

export interface ImageParagraphOptions {
  media: ResolvedImageMedia;
  config: DocxConfig;
  alt: string;
  title: string;
  fixedWidthCm?: number;
  spacing?: {
    before: number;
    after: number;
  };
  keepNext?: boolean;
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
  const normalizedValue = value.replace(/\s/g, '');
  const paddingLength = normalizedValue.endsWith('==')
    ? 2
    : normalizedValue.endsWith('=')
      ? 1
      : 0;
  const decodedLength = Math.floor(normalizedValue.length * 3 / 4)
    - paddingLength;
  if (decodedLength > MAX_DECODED_IMAGE_BYTES) {
    throw new Error('圖片解碼後不得超過 64 MiB。');
  }

  let binary: string;
  try {
    binary = atob(normalizedValue);
  } catch {
    throw new Error('圖片 data URL 的 Base64 內容無效。');
  }

  if (binary.length > MAX_DECODED_IMAGE_BYTES) {
    throw new Error('圖片解碼後不得超過 64 MiB。');
  }

  const buffer = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }
  return buffer;
};

const readPngDimensions = (
  data: Uint8Array,
): { width: number; height: number } | undefined => {
  if (data.length < 45 || !startsWithBytes(data, [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])) {
    return undefined;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const hasIhdr = view.getUint32(8) === 13
    && startsWithBytes(data.subarray(12), [0x49, 0x48, 0x44, 0x52]);
  const iendOffset = data.length - 12;
  const hasIend = view.getUint32(iendOffset) === 0
    && startsWithBytes(
      data.subarray(iendOffset + 4),
      [0x49, 0x45, 0x4e, 0x44],
    );
  if (!hasIhdr || !hasIend) {
    return undefined;
  }
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
};

const readGifDimensions = (
  data: Uint8Array,
): { width: number; height: number } | undefined => {
  if (data.length < 14 || data[data.length - 1] !== 0x3b) {
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
  if (
    data.length < 11
    || data[data.length - 2] !== 0xff
    || data[data.length - 1] !== 0xd9
  ) {
    return undefined;
  }

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

  if (!dimensions) {
    throw new Error(`圖片結構不完整：${type}。`);
  }
  const { width, height } = dimensions;
  if (
    !Number.isInteger(width)
    || !Number.isInteger(height)
    || width <= 0
    || height <= 0
    || width > MAX_IMAGE_DIMENSION_PX
    || height > MAX_IMAGE_DIMENSION_PX
    || width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error('圖片尺寸超出安全上限。');
  }
  if (Math.max(width, height) / Math.min(width, height) > MAX_IMAGE_ASPECT_RATIO) {
    throw new Error('圖片長寬比超出安全上限。');
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
  if (data.byteLength > MAX_DECODED_IMAGE_BYTES) {
    throw new Error('圖片解碼後不得超過 64 MiB。');
  }
  const magicType = detectMagicType(data);
  const mimeImageType = normalizeMimeType(mimeType);
  const declaredMimeType = mimeType?.trim().toLowerCase();

  if (declaredMimeType && !mimeImageType) {
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
    /^data:([^;,]*)(?:;[^,]*)*;base64,([\s\S]+)$/i,
  );
  if (!match) {
    throw new Error('圖片來源必須是 Base64 data URL。');
  }
  return resolveImageMediaBytes(
    decodeBase64(match[2]),
    match[1] || undefined,
  );
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
  const targetWidthEmu = targetWidth * EMUS_PER_PIXEL;
  const targetHeightEmu = targetHeight * EMUS_PER_PIXEL;
  if (
    !Number.isFinite(targetWidthEmu)
    || !Number.isFinite(targetHeightEmu)
    || targetWidthEmu <= 0
    || targetHeightEmu <= 0
    || targetWidthEmu > MAX_WORD_IMAGE_EMU
    || targetHeightEmu > MAX_WORD_IMAGE_EMU
  ) {
    throw new Error('圖片輸出尺寸超出 Word 安全上限。');
  }
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
  keepNext: options.keepNext,
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
