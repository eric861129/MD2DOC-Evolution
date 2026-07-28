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
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableOfContents,
  TextRun,
} from 'docx';
import { BlockType, type DocumentMeta, type ParsedBlock } from './types';

// 區塊處理器註冊表
import { registerDefaultHandlers } from './docx/builders/index';
import { createBookmarkAllocator } from './docx/bookmarks';
import { resolvePageLayout } from './docx/layout/resolve';
import { getDocumentProfile } from './docx/profiles';
import { postProcessDocx } from './docx/postprocess';
import {
  DocxPackageIssueError,
  DocxQualityError,
  inspectDocxPackage,
} from './docx/quality';
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

/**
 * 建立隔離呼叫端例外的警告回報器，避免觀察端失敗中斷文件產生流程。
 */
const createWarningReporter = (
  observer: GenerateDocxOptions['onWarning'],
): DocxConfig['reportWarning'] => {
  let isReporting = false;

  return (warning) => {
    if (!observer || isReporting) {
      return;
    }

    isReporting = true;
    try {
      observer(warning);
    } catch {
      // 警告觀察端不屬於文件產生流程，例外不得回流影響降級結果。
    } finally {
      isReporting = false;
    }
  };
};

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
    bookmarks: createBookmarkAllocator(),
    reportWarning: createWarningReporter(options.onWarning),
    counters: {
      figure: 0,
      qr: 0,
      listInstance: 0,
      outputBlock: 0,
    },
  };

  const docChildren: (Paragraph | Table | TableOfContents)[] = [];

  for (const block of blocks) {
    if (
      block.type === BlockType.TABLE
      && docChildren.at(-1) instanceof Table
    ) {
      docChildren.push(new Paragraph({
        spacing: {
          before: 0,
          after: 0,
          line: 40,
          lineRule: LineRuleType.EXACT,
        },
      }));
    }
    const result = await docxRegistry.handle(block, config);
    if (result) {
      if (Array.isArray(result)) {
        docChildren.push(...result);
        if (result.length > 0) {
          config.counters.outputBlock += 1;
        }
      } else {
        docChildren.push(result);
        config.counters.outputBlock += 1;
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
            { level: 0, format: "decimal", text: "%1.", start: 1, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
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
  const packedBlob = await Packer.toBlob(doc);
  let processedBlob: Blob;
  try {
    processedBlob = await postProcessDocx(packedBlob, { layout });
  } catch (error) {
    if (error instanceof DocxPackageIssueError) {
      throw new DocxQualityError([error.issue]);
    }
    throw error;
  }
  const qualityIssues = await inspectDocxPackage(processedBlob);

  qualityIssues
    .filter((issue) => issue.severity === 'warning')
    .forEach((issue) => config.reportWarning({
      code: 'DOCX_QUALITY_WARNING',
      message: issue.message,
      issueCode: issue.code,
      entry: issue.entry,
    }));

  if (qualityIssues.some((issue) => issue.severity === 'error')) {
    throw new DocxQualityError(qualityIssues);
  }

  return processedBlob;
};
