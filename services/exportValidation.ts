import {
  BlockType,
  type DocumentMeta,
  type ParsedBlock,
  type ValidationIssue,
} from './types';
import { DEFAULT_EXPORT_SETTINGS } from './docx/layout/presets';
import { resolvePageLayout } from './docx/layout/resolve';
import type {
  ExportSettings,
  ResolvedPageLayout,
} from './docx/layout/types';

export type { ValidationIssue, ValidationSeverity } from './types';

export interface ExportValidationInput {
  content: string;
  blocks: ParsedBlock[];
  meta: DocumentMeta;
  imageRegistry: Record<string, string>;
  exportSettings?: ExportSettings;
  resolvedPageLayout?: ResolvedPageLayout;
}

const hasValue = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const isRegisteredImage = (src: string, imageRegistry: Record<string, string>) =>
  Boolean(imageRegistry[src]) || src.startsWith('data:image/');

const isExternalImage = (src: string) => /^https?:\/\//i.test(src);

const isValidQrUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const splitTableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const isPipeRow = (line: string) => {
  const cells = splitTableCells(line);
  return line.includes('|') && cells.length >= 2 && cells.every((cell) => cell.length > 0);
};

const isSeparatorCell = (cell: string) => /^:?-{3,}:?$/.test(cell.trim());

const isTableSeparator = (line: string) => {
  const cells = splitTableCells(line);
  return cells.length >= 2 && cells.every(isSeparatorCell);
};

const collectFrontmatterIssues = (meta: DocumentMeta): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (!hasValue(meta.title)) {
    issues.push({
      id: 'frontmatter-title',
      severity: 'warning',
      title: 'Frontmatter 缺少 title',
      message: '建議在 YAML Frontmatter 補上 title，讓 DOCX 檔名與頁首資訊更完整。',
    });
  }

  if (!hasValue(meta.author)) {
    issues.push({
      id: 'frontmatter-author',
      severity: 'warning',
      title: 'Frontmatter 缺少 author',
      message: '建議在 YAML Frontmatter 補上 author，讓文件 metadata 更完整。',
    });
  }

  return issues;
};

const collectBlockIssues = (
  blocks: ParsedBlock[],
  imageRegistry: Record<string, string>,
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  blocks.forEach((block, index) => {
    issues.push(...(block.validationIssues ?? []));

    if (block.type === BlockType.CODE_BLOCK && !hasValue(block.metadata?.language)) {
      issues.push({
        id: `code-language-${index}`,
        severity: 'warning',
        title: 'Code block 缺少語言',
        message: '建議在 code fence 補上語言，例如 ```typescript:ln，讓預覽與 DOCX 樣式更清楚。',
        sourceLine: block.sourceLine,
        blockType: block.type,
      });
    }

    if (block.type === BlockType.IMAGE) {
      if (isExternalImage(block.content)) {
        issues.push({
          id: `image-external-${index}`,
          severity: 'warning',
          title: '圖片使用外部 URL',
          message: '外部圖片可能因 CORS 或網路限制無法匯出到 DOCX，建議改用上傳圖片。',
          sourceLine: block.sourceLine,
          blockType: block.type,
        });
      } else if (!isRegisteredImage(block.content, imageRegistry)) {
        issues.push({
          id: `image-missing-${index}`,
          severity: 'warning',
          title: '圖片尚未登錄',
          message: '找不到此圖片對應的本機資料，匯出時可能只會保留圖片提示文字。',
          sourceLine: block.sourceLine,
          blockType: block.type,
        });
      }
    }

    if (block.type === BlockType.CHAPTER_OPENER) {
      const image = block.metadata?.chapter?.image;
      if (image && !isRegisteredImage(image, imageRegistry)) {
        issues.push({
          id: `chapter-image-missing-${index}`,
          severity: 'error',
          title: '章首頁圖片不存在',
          message: `找不到章首頁圖片「${image}」，請重新上傳或使用有效的 data URL。`,
          sourceLine: block.sourceLine,
          blockType: block.type,
        });
      }
    }

    if (block.type === BlockType.QR && !isValidQrUrl(block.metadata?.url)) {
      issues.push({
        id: `qr-url-invalid-${index}`,
        severity: 'error',
        title: 'QR URL 無效',
        message: 'QR URL 必須是可解析的 http 或 https 網址。',
        sourceLine: block.sourceLine,
        blockType: block.type,
      });
    }
  });

  return issues;
};

const createLayoutErrorIssue = (error: unknown): ValidationIssue => {
  const message = error instanceof Error ? error.message : '未知的版面設定錯誤';
  const id = message.includes('有效內容寬度')
    ? 'layout-content-width'
    : message.includes('有效內容高度')
      ? 'layout-content-height'
      : 'layout-invalid';

  return {
    id,
    severity: 'error',
    title: id === 'layout-content-width'
      ? '有效內容寬度不足'
      : id === 'layout-content-height'
        ? '有效內容高度不足'
        : '版面設定無效',
    message,
  };
};

const collectLayoutIssues = (
  exportSettings: ExportSettings,
  resolvedPageLayout?: ResolvedPageLayout,
): ValidationIssue[] => {
  let layout: ResolvedPageLayout;
  try {
    layout = resolvedPageLayout ?? resolvePageLayout(exportSettings);
  } catch (error) {
    return [createLayoutErrorIssue(error)];
  }

  const { margins } = layout;
  const physicalMargins = margins.mode === 'mirrored'
    ? [
        margins.topCm,
        margins.bottomCm,
        margins.insideCm!,
        margins.outsideCm!,
      ]
    : [
        margins.topCm,
        margins.rightCm,
        margins.bottomCm,
        margins.leftCm,
      ];
  const issues: ValidationIssue[] = [];

  if (physicalMargins.some((margin) => margin < 1)) {
    issues.push({
      id: 'layout-margin-print-risk',
      severity: 'warning',
      title: '實體邊界小於 1 公分',
      message: '頁面實體邊界小於 1 公分，列印時可能有裁切風險。',
    });
  }

  if (
    exportSettings.profileId === 'publisher-exact'
    && layout.isCustomizedFromProfile
  ) {
    issues.push({
      id: 'layout-publisher-exact-overridden',
      severity: 'warning',
      title: '出版社精確版型已覆寫',
      message: '紙張或邊界已偏離出版社精確版型預設，不保證參考稿頁碼一致。',
    });
  }

  return issues;
};

const deduplicateIssues = (
  issues: ValidationIssue[],
): ValidationIssue[] => Array.from(
  new Map(issues.map((issue) => [issue.id, issue])).values(),
);

const collectTableIssues = (content: string): ValidationIssue[] => {
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    if (!isPipeRow(lines[index])) {
      index++;
      continue;
    }

    const tableLikeRows: { line: string; index: number }[] = [];
    while (index < lines.length && isPipeRow(lines[index])) {
      tableLikeRows.push({ line: lines[index], index });
      index++;
    }

    if (tableLikeRows.length >= 2 && !isTableSeparator(tableLikeRows[1].line)) {
      return [{
        id: `table-separator-${tableLikeRows[1].index}`,
        severity: 'warning',
        title: '疑似表格分隔列格式錯誤',
        message: 'Markdown 表格第二列應使用 | :--- | :--- | 這類分隔格式，否則可能無法被解析成表格。',
        sourceLine: tableLikeRows[1].index,
        blockType: BlockType.TABLE,
      }];
    }
  }

  return [];
};

const collectMermaidIssues = async (blocks: ParsedBlock[]): Promise<ValidationIssue[]> => {
  const mermaidBlocks = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === BlockType.MERMAID);

  if (mermaidBlocks.length === 0) return [];

  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ startOnLoad: false });

  const issues: ValidationIssue[] = [];

  for (const { block, index } of mermaidBlocks) {
    try {
      const parseResult = await mermaid.parse(block.content, { suppressErrors: true });
      if (!parseResult) {
        issues.push({
          id: `mermaid-syntax-${index}`,
          severity: 'warning',
          title: 'Mermaid 語法可能有誤',
          message: '此 Mermaid 圖表無法通過語法檢查，匯出時可能會顯示錯誤提示。',
          sourceLine: block.sourceLine,
          blockType: block.type,
        });
      }
    } catch {
      issues.push({
        id: `mermaid-syntax-${index}`,
        severity: 'warning',
        title: 'Mermaid 語法可能有誤',
        message: '此 Mermaid 圖表無法通過語法檢查，匯出時可能會顯示錯誤提示。',
        sourceLine: block.sourceLine,
        blockType: block.type,
      });
    }
  }

  return issues;
};

export const validateExport = async ({
  content,
  blocks,
  meta,
  imageRegistry,
  exportSettings = DEFAULT_EXPORT_SETTINGS,
  resolvedPageLayout,
}: ExportValidationInput): Promise<ValidationIssue[]> => deduplicateIssues([
  ...collectLayoutIssues(exportSettings, resolvedPageLayout),
  ...collectFrontmatterIssues(meta),
  ...collectBlockIssues(blocks, imageRegistry),
  ...collectTableIssues(content),
  ...await collectMermaidIssues(blocks),
]);
