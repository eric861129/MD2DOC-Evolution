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
const CONTENT_TYPES_NAMESPACE =
  'http://schemas.openxmlformats.org/package/2006/content-types';
const RELATIONSHIPS_NAMESPACE =
  'http://schemas.openxmlformats.org/package/2006/relationships';
const MEDIA_PATH_PATTERN = /(?:^|\/)media\/[^/]+$/i;
const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const INVALID_PERCENT_ENCODING_PATTERN = /%(?![0-9A-Fa-f]{2})/;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c)/i;
const URI_PATH_REFERENCE_PATTERN =
  /^[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/;
const URI_QUERY_FRAGMENT_PATTERN =
  /^[A-Za-z0-9\-._~!$&'()*+,;=:@%/?]*$/;
const DECODED_CONTROL_PATTERN = /[\u0000-\u001F\u007F-\u009F]/;
const EXPECTED_IMAGE_CONTENT_TYPES: Readonly<Record<string, readonly string[]>> = {
  png: ['image/png'],
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  gif: ['image/gif'],
};

const hasXmlParseError = (document: XMLDocument): boolean =>
  document.getElementsByTagName('parsererror').length > 0;

const asciiLowerCase = (value: string): string =>
  value.replace(/[A-Z]/g, (character) => character.toLowerCase());

const normalizePackagePath = (path: string): string =>
  asciiLowerCase(path.replace(/^\/+/, ''));

const createPackageUnreadableIssue = (
  entry?: string,
): DocxQualityIssue => ({
  severity: 'error',
  code: 'PACKAGE_UNREADABLE',
  message: entry
    ? `DOCX 項目無法解壓縮或內容已損毀：${entry}`
    : 'DOCX 封裝無法解壓縮或內容已損毀。',
  entry,
});

/**
 * 只包裝 JSZip 讀寫邊界的封裝損毀，不攔截 XML 或產品規則例外。
 */
export class DocxPackageIssueError extends Error {
  public readonly issue: DocxQualityIssue;

  public constructor(issue: DocxQualityIssue) {
    super(issue.message);
    this.name = 'DocxPackageIssueError';
    this.issue = issue;
  }
}

/** 建立可由 generator 統一轉為 DocxQualityError 的 archive corruption。 */
export const createDocxPackageUnreadableError = (
  entry?: string,
): DocxPackageIssueError =>
  new DocxPackageIssueError(createPackageUnreadableIssue(entry));

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

const decodeUriSegment = (segment: string): string => {
  if (INVALID_PERCENT_ENCODING_PATTERN.test(segment)) {
    throw new Error('Target 包含無效的 URI 編碼。');
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    throw new Error('Target 包含無效的 UTF-8 URI 編碼。');
  }
  if (DECODED_CONTROL_PATTERN.test(decoded)) {
    throw new Error('Target 解碼後不得包含控制字元。');
  }
  if (decoded.includes('/') || decoded.includes('\\')) {
    throw new Error('Target 不得以 URI encoding 隱藏路徑分隔符號。');
  }
  return decoded;
};

const assertValidUriComponent = (
  value: string,
  kind: 'path' | 'query-or-fragment',
): void => {
  if (INVALID_PERCENT_ENCODING_PATTERN.test(value)) {
    throw new Error('Target 包含無效的 URI 編碼。');
  }
  const pattern = kind === 'path'
    ? URI_PATH_REFERENCE_PATTERN
    : URI_QUERY_FRAGMENT_PATTERN;
  if (!pattern.test(value)) {
    throw new Error('Target 必須只使用合法 ASCII URI 字元；非 ASCII 字元必須 percent-encode。');
  }
};

const assertValidPackagePathReference = (reference: string): void => {
  assertValidUriComponent(reference, 'path');
  if (ENCODED_SEPARATOR_PATTERN.test(reference)) {
    throw new Error('Internal Target 不得編碼路徑分隔符號。');
  }
};

const assertSafeRelationshipReference = (reference: string): void => {
  if (
    URI_SCHEME_PATTERN.test(reference)
    || reference.startsWith('//')
    || reference.startsWith('/')
  ) {
    throw new Error('Internal Target 必須是相對 package URI。');
  }
  assertValidPackagePathReference(reference);
};

const splitRelationshipTarget = (
  target: string,
): {
  reference: string;
  query?: string;
  fragment?: string;
} => {
  const fragmentIndex = target.indexOf('#');
  const beforeFragment = fragmentIndex >= 0
    ? target.slice(0, fragmentIndex)
    : target;
  const fragment = fragmentIndex >= 0
    ? target.slice(fragmentIndex + 1)
    : undefined;
  const queryIndex = beforeFragment.indexOf('?');
  const reference = queryIndex >= 0
    ? beforeFragment.slice(0, queryIndex)
    : beforeFragment;
  const query = queryIndex >= 0
    ? beforeFragment.slice(queryIndex + 1)
    : undefined;

  if (query !== undefined) {
    assertValidUriComponent(query, 'query-or-fragment');
  }
  if (fragment !== undefined) {
    assertValidUriComponent(fragment, 'query-or-fragment');
  }
  return { reference, query, fragment };
};

const resolveRelationshipTarget = (
  relationshipsPath: string,
  target: string,
): string => {
  const { reference } = splitRelationshipTarget(target);
  assertSafeRelationshipReference(reference);
  const sourcePart = getRelationshipSourcePart(relationshipsPath);
  const segments = sourcePart ? sourcePart.split('/').slice(0, -1) : [];

  if (!reference) {
    if (!sourcePart) {
      throw new Error('Package root relationship 的 Target 不得只有 query 或 fragment。');
    }
    return normalizePackagePath(sourcePart);
  }

  for (const encodedSegment of reference.split('/')) {
    if (!encodedSegment) {
      throw new Error('Internal Target 不得包含空白路徑區段。');
    }
    const segment = decodeUriSegment(encodedSegment);
    if (segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (segments.length === 0) {
        throw new Error('Internal Target 不得越過 package root。');
      }
      segments.pop();
      continue;
    }
    if (!segment) {
      throw new Error('Internal Target 不得包含空白路徑區段。');
    }
    segments.push(segment);
  }

  return normalizePackagePath(segments.join('/'));
};

const normalizeOverridePartName = (partName: string): string => {
  if (!partName.startsWith('/')) {
    throw new Error('Override PartName 必須以 / 開頭。');
  }
  const reference = partName.slice(1);
  if (
    !reference
    || reference.includes('?')
    || reference.includes('#')
  ) {
    throw new Error('Override PartName 必須是絕對 package part name。');
  }
  assertValidPackagePathReference(reference);

  const segments = reference.split('/').map((encodedSegment) => {
    if (!encodedSegment) {
      throw new Error('Override PartName 不得包含空白路徑區段。');
    }
    const segment = decodeUriSegment(encodedSegment);
    if (!segment || segment === '.' || segment === '..') {
      throw new Error('Override PartName 不得包含相對路徑區段。');
    }
    return segment;
  });
  return normalizePackagePath(segments.join('/'));
};

const getElements = (
  document: XMLDocument,
  namespace: string,
  localName: string,
): Element[] =>
  Array.from(document.getElementsByTagNameNS(namespace, localName));

interface PackagePartIndex {
  entries: JSZip.JSZipObject[];
  byNormalizedName: Map<string, JSZip.JSZipObject[]>;
}

const createPartIndex = (
  zip: JSZip,
  issues: DocxQualityIssue[],
): PackagePartIndex => {
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const byNormalizedName = new Map<string, JSZip.JSZipObject[]>();

  for (const entry of entries) {
    const normalizedName = normalizePackagePath(entry.name);
    const equivalentEntries = byNormalizedName.get(normalizedName) ?? [];
    equivalentEntries.push(entry);
    byNormalizedName.set(normalizedName, equivalentEntries);
  }

  for (const [normalizedName, equivalentEntries] of byNormalizedName) {
    if (equivalentEntries.length > 1) {
      issues.push({
        severity: 'error',
        code: 'PART_NAME_COLLISION',
        message: `ZIP 內含大小寫不同但 OPC 等價的重複 part：${equivalentEntries
          .map((entry) => entry.name)
          .join('、')}`,
        entry: normalizedName,
      });
    }
  }

  return { entries, byNormalizedName };
};

const findPart = (
  index: PackagePartIndex,
  path: string,
): JSZip.JSZipObject | undefined =>
  index.byNormalizedName.get(normalizePackagePath(path))?.[0];

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
    return [createPackageUnreadableIssue()];
  }

  const index = createPartIndex(zip, issues);
  const entryBytes = new Map<JSZip.JSZipObject, Uint8Array>();
  for (const entry of index.entries) {
    try {
      entryBytes.set(entry, await entry.async('uint8array'));
    } catch {
      return [createPackageUnreadableIssue(entry.name)];
    }
  }

  for (const requiredPart of REQUIRED_PARTS) {
    if (!findPart(index, requiredPart)) {
      issues.push({
        severity: 'error',
        code: 'REQUIRED_PART_MISSING',
        message: `DOCX 缺少必要項目：${requiredPart}`,
        entry: requiredPart,
      });
    }
  }

  const parsedXml = new Map<JSZip.JSZipObject, XMLDocument | null>();
  const readXml = (entry: JSZip.JSZipObject): XMLDocument | undefined => {
    const cached = parsedXml.get(entry);
    if (cached !== undefined) {
      return cached ?? undefined;
    }

    const xml = new TextDecoder().decode(entryBytes.get(entry)!);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (hasXmlParseError(document)) {
      issues.push({
        severity: 'error',
        code: 'XML_PARSE_ERROR',
        message: `OOXML 項目無法解析：${entry.name}`,
        entry: entry.name,
      });
      parsedXml.set(entry, null);
      return undefined;
    }

    parsedXml.set(entry, document);
    return document;
  };

  for (const entry of index.entries) {
    if (/\.(?:xml|rels)$/i.test(entry.name)) {
      readXml(entry);
    }
  }

  for (const relationshipsEntry of index.entries.filter(
    (entry) => /\.rels$/i.test(entry.name),
  )) {
    const relationships = readXml(relationshipsEntry);
    if (!relationships) {
      continue;
    }

    for (const relationship of getElements(
      relationships,
      RELATIONSHIPS_NAMESPACE,
      'Relationship',
    )) {
      if (
        asciiLowerCase(relationship.getAttribute('TargetMode') ?? '')
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
        if (!findPart(index, resolvedTarget)) {
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

  const contentTypesEntry = findPart(index, CONTENT_TYPES_PATH);
  const contentTypes = contentTypesEntry
    ? readXml(contentTypesEntry)
    : undefined;
  if (!contentTypes) {
    return issues;
  }

  const root = contentTypes.documentElement;
  if (
    root.localName !== 'Types'
    || root.namespaceURI !== CONTENT_TYPES_NAMESPACE
  ) {
    issues.push({
      severity: 'error',
      code: 'CONTENT_TYPES_INVALID',
      message: '[Content_Types].xml 必須使用正確 namespace 與 Types 根節點。',
      entry: CONTENT_TYPES_PATH,
    });
    return issues;
  }

  const defaultContentTypes = new Map<string, string>();
  for (const element of getElements(
    contentTypes,
    CONTENT_TYPES_NAMESPACE,
    'Default',
  )) {
    const extension = element.getAttribute('Extension')?.trim();
    const contentType = element.getAttribute('ContentType')?.trim();
    if (
      !extension
      || !contentType
      || /[.\/\\%]/.test(extension)
    ) {
      issues.push({
        severity: 'error',
        code: 'CONTENT_TYPES_INVALID',
        message: 'Content Types 的 Default 缺少或含有無效必要屬性。',
        entry: CONTENT_TYPES_PATH,
      });
      continue;
    }
    defaultContentTypes.set(asciiLowerCase(extension), contentType);
  }

  const overrideContentTypes = new Map<string, string>();
  for (const element of getElements(
    contentTypes,
    CONTENT_TYPES_NAMESPACE,
    'Override',
  )) {
    const partName = element.getAttribute('PartName')?.trim();
    const contentType = element.getAttribute('ContentType')?.trim();
    if (!partName || !contentType) {
      issues.push({
        severity: 'error',
        code: 'CONTENT_TYPES_INVALID',
        message: 'Content Types 的 Override 缺少必要屬性。',
        entry: CONTENT_TYPES_PATH,
      });
      continue;
    }
    try {
      overrideContentTypes.set(
        normalizeOverridePartName(partName),
        contentType,
      );
    } catch (error) {
      issues.push({
        severity: 'error',
        code: 'CONTENT_TYPES_INVALID',
        message: error instanceof Error
          ? error.message
          : 'Content Types 的 Override PartName 無效。',
        entry: CONTENT_TYPES_PATH,
      });
    }
  }

  for (const mediaEntry of index.entries.filter(
    (entry) => MEDIA_PATH_PATTERN.test(entry.name),
  )) {
    const mediaBytes = entryBytes.get(mediaEntry)!;
    if (mediaBytes.byteLength === 0) {
      issues.push({
        severity: 'error',
        code: 'MEDIA_EMPTY',
        message: `媒體項目不可為空：${mediaEntry.name}`,
        entry: mediaEntry.name,
      });
    }

    const extension = mediaEntry.name.includes('.')
      ? asciiLowerCase(mediaEntry.name.slice(
          mediaEntry.name.lastIndexOf('.') + 1,
        ))
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
    const contentType = overrideContentTypes.get(normalizedMediaPath)
      ?? defaultContentTypes.get(extension);
    if (!contentType) {
      issues.push({
        severity: 'error',
        code: 'MEDIA_CONTENT_TYPE_MISSING',
        message: `媒體副檔名缺少 Content Type：.${extension}`,
        entry: mediaEntry.name,
      });
      continue;
    }

    const expectedContentTypes = EXPECTED_IMAGE_CONTENT_TYPES[extension];
    if (
      expectedContentTypes
      && !expectedContentTypes.includes(asciiLowerCase(contentType))
    ) {
      issues.push({
        severity: 'error',
        code: 'MEDIA_CONTENT_TYPE_INVALID',
        message: `媒體副檔名 .${extension} 與 Content Type ${contentType} 不一致。`,
        entry: mediaEntry.name,
      });
    }
  }

  return issues;
};
