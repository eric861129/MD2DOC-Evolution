/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TextRun,
} from 'docx';
import type { DocumentMeta, ParsedBlock } from './types';

// 區塊處理器註冊表
import { registerDefaultHandlers } from './docx/builders/index';
import { resolvePageLayout } from './docx/layout/resolve';
import { getDocumentProfile } from './docx/profiles';
import { docxRegistry } from './docx/registry';
import { applyPageSettings } from './docx/settings';
import { createDocumentStyles } from './docx/styles';
import type {
  DocxConfig,
  DocxExportWarning,
  GenerateDocxOptions,
} from './docx/types';

// 初始化預設區塊處理器
registerDefaultHandlers();

// 重新匯出生成器合約，供既有呼叫端使用
export type { DocxConfig, DocxExportWarning, GenerateDocxOptions };

const createHeaders = (
  meta: DocumentMeta,
  config: DocxConfig,
): { default?: Header } => {
  if (
    meta.header === false
    || !meta.title
    || !config.profile.headerFooter.showTitle
  ) {
    return {};
  }

  return {
    default: new Header({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: meta.title,
              font: config.profile.fonts.body,
              size: 18,
              color: '808080',
            }),
          ],
          alignment: AlignmentType.RIGHT,
          border: {
            bottom: {
              style: 'single',
              size: 6,
              color: 'E0E0E0',
              space: 6,
            },
          },
        }),
      ],
    }),
  };
};

const createFooters = (
  meta: DocumentMeta,
  config: DocxConfig,
): { default?: Footer } => {
  if (meta.footer === false) {
    return {};
  }

  const showBookAndPage = config.profile.headerFooter.showBookAndPage && meta.title;
  return {
    default: new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              children: [
                ...(showBookAndPage ? [`${meta.title} | `] : []),
                PageNumber.CURRENT,
              ],
              font: config.profile.fonts.body,
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }),
  };
};

// --- 主生成函式 ---
export const generateDocx = async (
  blocks: ParsedBlock[],
  options: GenerateDocxOptions,
): Promise<Blob> => {
  const layout = resolvePageLayout(options.exportSettings);
  const profile = getDocumentProfile(options.exportSettings.profileId);
  const config: DocxConfig = {
    layout,
    profile,
    showLineNumbers: options.showLineNumbers,
    meta: options.meta ?? {},
    imageRegistry: options.imageRegistry ?? {},
    reportWarning: options.onWarning ?? (() => undefined),
    counters: {
      figure: 0,
      qr: 0,
      bookmark: 0,
      listInstance: 0,
    },
  };

  const docChildren: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    const result = await docxRegistry.handle(block, config);
    if (result) {
      if (Array.isArray(result)) {
        docChildren.push(...result);
      } else {
        docChildren.push(result);
      }
    }
  }

  const headers = createHeaders(config.meta, config);
  const footers = createFooters(config.meta, config);
  const { margins, page } = layout;
  const headerFooterDistanceTwips = Math.round(
    profile.headerFooter.distanceCm / 2.54 * 1440,
  );

  const doc = new Document({
    creator: config.meta.author,
    title: config.meta.title,
    description: config.meta.subject,
    features: { updateFields: true },
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            { level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: "decimal", text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: "decimal", text: "%3.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ],
        },
        {
          reference: "default-bullet",
          levels: [
            { level: 0, format: "bullet", text: "●", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: "bullet", text: "○", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: "bullet", text: "■", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: page.widthTwips,
            height: page.heightTwips,
          },
          margin: {
            top: margins.topTwips,
            right: margins.rightTwips,
            bottom: margins.bottomTwips,
            left: margins.leftTwips,
            header: headerFooterDistanceTwips,
            footer: headerFooterDistanceTwips,
            gutter: margins.gutterTwips,
          },
        },
      },
      headers,
      footers,
      children: docChildren,
    }],
    styles: createDocumentStyles(profile),
  });

  applyPageSettings(doc.Settings, layout);
  return Packer.toBlob(doc);
};
