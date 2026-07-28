import JSZip from 'jszip';

export interface DocxQualityIssue {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  entry?: string;
}

const REQUIRED_PARTS = [
  '[Content_Types].xml',
  'word/document.xml',
] as const;

const CONTENT_TYPES_PATH = '[Content_Types].xml';
const MEDIA_PATH_PATTERN = /(?:^|\/)media\/[^/]+$/i;

const hasXmlParseError = (document: XMLDocument): boolean =>
  document.getElementsByTagName('parsererror').length > 0;

const normalizePackagePath = (path: string): string =>
  path.replaceAll('\\', '/').replace(/^\/+/, '').toLocaleLowerCase('en-US');

const decodePackagePath = (path: string): string => {
  try {
    return decodeURIComponent(path);
  } catch {
    throw new Error('Relationship Target 包含無效的 URI 編碼。');
  }
};

const getRelationshipSourcePart = (relationshipsPath: string): string => {
  if (normalizePackagePath(relationshipsPath) === '_rels/.rels') {
    return '';
  }

  const match = relationshipsPath.match(
    /^(.*\/)?_rels\/([^/]+)\.rels$/i,
  );
  if (!match) {
    return '';
  }
  return `${match[1] ?? ''}${match[2]}`;
};

const resolveRelationshipTarget = (
  relationshipsPath: string,
  target: string,
): string => {
  const sourcePart = getRelationshipSourcePart(relationshipsPath);
  const baseUrl = new URL(
    sourcePart.replaceAll('\\', '/'),
    'https://docx.package/',
  );
  const targetUrl = new URL(target.replaceAll('\\', '/'), baseUrl);
  return normalizePackagePath(decodePackagePath(targetUrl.pathname));
};

const getElementsByLocalName = (
  document: XMLDocument,
  localName: string,
): Element[] => Array.from(document.getElementsByTagNameNS('*', localName));

/**
 * DOCX 品質錯誤會保留完整 issues，供呼叫端顯示可讀訊息或診斷封裝項目。
 */
export class DocxQualityError extends Error {
  public readonly issues: DocxQualityIssue[];

  public constructor(issues: DocxQualityIssue[]) {
    const errors = issues.filter((issue) => issue.severity === 'error');
    super(`DOCX 封裝品質檢查失敗：${errors
      .map((issue) => issue.message)
      .join('；')}`);
    this.name = 'DocxQualityError';
    this.issues = issues;
  }
}

/**
 * 檢查會造成 Word 無法正確開啟或載入資源的高價值 OOXML 封裝問題。
 */
export const inspectDocxPackage = async (
  blob: Blob,
): Promise<DocxQualityIssue[]> => {
  const issues: DocxQualityIssue[] = [];
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(await blob.arrayBuffer());
  } catch {
    return [{
      severity: 'error',
      code: 'PACKAGE_UNREADABLE',
      message: 'DOCX 封裝無法解壓縮或內容已損毀。',
    }];
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const entriesByNormalizedPath = new Map(
    entries.map((entry) => [normalizePackagePath(entry.name), entry]),
  );

  for (const requiredPart of REQUIRED_PARTS) {
    if (!zip.file(requiredPart)) {
      issues.push({
        severity: 'error',
        code: 'REQUIRED_PART_MISSING',
        message: `DOCX 缺少必要項目：${requiredPart}`,
        entry: requiredPart,
      });
    }
  }

  const parsedXml = new Map<string, XMLDocument | null>();
  const readXml = async (
    entry: JSZip.JSZipObject,
  ): Promise<XMLDocument | undefined> => {
    const cacheKey = normalizePackagePath(entry.name);
    const cached = parsedXml.get(cacheKey);
    if (cached !== undefined) {
      return cached ?? undefined;
    }

    const xml = await entry.async('string');
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (hasXmlParseError(document)) {
      issues.push({
        severity: 'error',
        code: 'XML_PARSE_ERROR',
        message: `OOXML 項目無法解析：${entry.name}`,
        entry: entry.name,
      });
      parsedXml.set(cacheKey, null);
      return undefined;
    }

    parsedXml.set(cacheKey, document);
    return document;
  };

  for (const entry of entries) {
    if (/\.(?:xml|rels)$/i.test(entry.name)) {
      await readXml(entry);
    }
  }

  for (const relationshipsEntry of entries.filter(
    (entry) => /\.rels$/i.test(entry.name),
  )) {
    const relationships = await readXml(relationshipsEntry);
    if (!relationships) {
      continue;
    }

    for (const relationship of getElementsByLocalName(
      relationships,
      'Relationship',
    )) {
      if (
        relationship.getAttribute('TargetMode')?.toLocaleLowerCase('en-US')
        === 'external'
      ) {
        continue;
      }

      const target = relationship.getAttribute('Target');
      if (!target) {
        issues.push({
          severity: 'error',
          code: 'RELATIONSHIP_TARGET_INVALID',
          message: `Relationship 缺少 Target：${relationshipsEntry.name}`,
          entry: relationshipsEntry.name,
        });
        continue;
      }

      try {
        const resolvedTarget = resolveRelationshipTarget(
          relationshipsEntry.name,
          target,
        );
        if (!entriesByNormalizedPath.has(resolvedTarget)) {
          issues.push({
            severity: 'error',
            code: 'RELATIONSHIP_TARGET_MISSING',
            message: `Relationship 指向不存在的項目：${target}`,
            entry: relationshipsEntry.name,
          });
        }
      } catch (error) {
        issues.push({
          severity: 'error',
          code: 'RELATIONSHIP_TARGET_INVALID',
          message: error instanceof Error
            ? error.message
            : `Relationship Target 無法解析：${target}`,
          entry: relationshipsEntry.name,
        });
      }
    }
  }

  const contentTypesEntry = zip.file(CONTENT_TYPES_PATH);
  const contentTypes = contentTypesEntry
    ? await readXml(contentTypesEntry)
    : undefined;
  if (!contentTypes) {
    return issues;
  }

  const defaultContentTypes = new Map<string, string>();
  for (const element of getElementsByLocalName(contentTypes, 'Default')) {
    const extension = element.getAttribute('Extension')
      ?.toLocaleLowerCase('en-US');
    const contentType = element.getAttribute('ContentType');
    if (extension && contentType) {
      defaultContentTypes.set(extension, contentType);
    }
  }

  const overrideContentTypes = new Map<string, string>();
  for (const element of getElementsByLocalName(contentTypes, 'Override')) {
    const partName = normalizePackagePath(
      decodePackagePath(element.getAttribute('PartName') ?? ''),
    );
    const contentType = element.getAttribute('ContentType');
    if (partName && contentType) {
      overrideContentTypes.set(partName, contentType);
    }
  }

  for (const mediaEntry of entries.filter(
    (entry) => MEDIA_PATH_PATTERN.test(entry.name),
  )) {
    const extension = mediaEntry.name.includes('.')
      ? mediaEntry.name.slice(mediaEntry.name.lastIndexOf('.') + 1)
        .toLocaleLowerCase('en-US')
      : '';

    if (extension === 'undefined') {
      issues.push({
        severity: 'error',
        code: 'MEDIA_EXTENSION_UNDEFINED',
        message: `媒體項目含有無效的 .undefined 副檔名：${mediaEntry.name}`,
        entry: mediaEntry.name,
      });
      continue;
    }

    if (!extension) {
      issues.push({
        severity: 'error',
        code: 'MEDIA_EXTENSION_MISSING',
        message: `媒體項目缺少副檔名：${mediaEntry.name}`,
        entry: mediaEntry.name,
      });
      continue;
    }

    const normalizedMediaPath = normalizePackagePath(mediaEntry.name);
    if (
      !overrideContentTypes.has(normalizedMediaPath)
      && !defaultContentTypes.has(extension)
    ) {
      issues.push({
        severity: 'error',
        code: 'MEDIA_CONTENT_TYPE_MISSING',
        message: `媒體副檔名缺少 Content Type：.${extension}`,
        entry: mediaEntry.name,
      });
    }
  }

  return issues;
};
