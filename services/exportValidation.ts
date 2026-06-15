import { BlockType, DocumentMeta, ParsedBlock } from './types';

export type ValidationSeverity = 'warning' | 'error';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  sourceLine?: number;
  blockType?: BlockType;
}

export interface ExportValidationInput {
  content: string;
  blocks: ParsedBlock[];
  meta: DocumentMeta;
  imageRegistry: Record<string, string>;
}

const hasValue = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const isRegisteredImage = (src: string, imageRegistry: Record<string, string>) =>
  Boolean(imageRegistry[src]) || src.startsWith('data:image/');

const isExternalImage = (src: string) => /^https?:\/\//i.test(src);

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
  });

  return issues;
};

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
}: ExportValidationInput): Promise<ValidationIssue[]> => [
  ...collectFrontmatterIssues(meta),
  ...collectBlockIssues(blocks, imageRegistry),
  ...collectTableIssues(content),
  ...await collectMermaidIssues(blocks),
];
