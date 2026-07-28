import {
  AlignmentType,
  ExternalHyperlink,
  Paragraph,
  TextRun,
  UnderlineType,
} from 'docx';
import { generateQRCode } from '../../qrCodeService';
import type { DocxConfig } from '../types';
import {
  createImageParagraph,
  resolveImageMediaBytes,
} from './image';

const QR_SIZE_CM = 2.6;
const QR_LABEL_COLOR = '9B1C1C';
const QR_LABEL_SIZE_HALF_POINTS = 18;

const createQrLabel = (label: string, url: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ExternalHyperlink({
        link: url,
        children: [
          new TextRun({
            text: label,
            size: QR_LABEL_SIZE_HALF_POINTS,
            color: QR_LABEL_COLOR,
            underline: {
              type: UnderlineType.SINGLE,
              color: QR_LABEL_COLOR,
            },
          }),
        ],
      }),
    ],
  });

/**
 * 建立獨立 QR 圖片與可點擊標籤；產生失敗時只保留標籤並回報 warning。
 */
export const createQrBlock = async (
  label: string,
  url: string,
  config: DocxConfig,
): Promise<Paragraph[]> => {
  const labelParagraph = createQrLabel(label, url);

  try {
    const qrBuffer = await generateQRCode(url);
    if (qrBuffer.byteLength === 0) {
      throw new Error('QR 產生器未回傳圖片資料。');
    }
    const media = resolveImageMediaBytes(
      new Uint8Array(qrBuffer),
      'image/png',
    );
    const imageParagraph = createImageParagraph({
      media,
      config,
      alt: `${label} QR Code`,
      title: label,
      fixedWidthCm: QR_SIZE_CM,
      spacing: { before: 200, after: 80 },
    });
    config.counters.qr += 1;
    return [imageParagraph, labelParagraph];
  } catch (error) {
    config.reportWarning({
      code: 'QR_GENERATION_FAILED',
      message: error instanceof Error
        ? `QR Code 產生失敗：${error.message}`
        : 'QR Code 產生失敗。',
      url,
    });
    return [labelParagraph];
  }
};
