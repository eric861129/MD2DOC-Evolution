import JSZip from 'jszip';
import { inspectDocxPackage } from './quality';
import type { ExportSettings } from './layout/types';

const WORDPROCESSING_NAMESPACE =
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const RELATIONSHIPS_NAMESPACE =
  'http://schemas.openxmlformats.org/package/2006/relationships';
const NONPRINTING_PAGINATION_MARKERS = [
  'keepNext',
  'keepLines',
  'pageBreakBefore',
  'suppressLineNumbers',
] as const;

export interface PublisherAcceptanceProfile {
  profileId: 'publisher-exact' | 'publisher-narrow' | 'publisher-binding';
  fileStem: 'exact' | 'narrow' | 'binding';
  exportSettings: ExportSettings;
  expectedPage: {
    widthTwips: number;
    heightTwips: number;
    topTwips: number;
    rightTwips: number;
    bottomTwips: number;
    leftTwips: number;
    gutterTwips: number;
    mirrored: boolean;
  };
}

export interface PublisherAcceptanceOptions {
  expectedBulletTexts: readonly string[];
  expectedTaskTexts: readonly string[];
  minimumMediaCount: number;
}

export interface PublisherAcceptanceCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PublisherAcceptanceMetrics {
  packageIssueCount: number;
  relationshipCount: number;
  mediaCount: number;
  tocFieldCount: number;
  bookmarkPairCount: number;
  explicitPageBreakCount: number;
  bulletParagraphCount: number;
  taskParagraphCount: number;
  nonprintingPaginationMarkerCount: number;
}

export interface PublisherAcceptanceResult {
  profileId: PublisherAcceptanceProfile['profileId'];
  status: 'passed' | 'failed';
  checks: PublisherAcceptanceCheck[];
  metrics: PublisherAcceptanceMetrics;
}

export const PUBLISHER_ACCEPTANCE_PROFILES =
  [
    {
      profileId: 'publisher-exact',
      fileStem: 'exact',
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      expectedPage: {
        widthTwips: 9978,
        heightTwips: 13380,
        topTwips: 1191,
        rightTwips: 1304,
        bottomTwips: 1191,
        leftTwips: 1304,
        gutterTwips: 0,
        mirrored: false,
      },
    },
    {
      profileId: 'publisher-narrow',
      fileStem: 'narrow',
      exportSettings: {
        profileId: 'publisher-narrow',
        pageSizeId: 'tech',
        marginPresetId: 'narrow',
      },
      expectedPage: {
        widthTwips: 9978,
        heightTwips: 13380,
        topTwips: 720,
        rightTwips: 720,
        bottomTwips: 720,
        leftTwips: 720,
        gutterTwips: 0,
        mirrored: false,
      },
    },
    {
      profileId: 'publisher-binding',
      fileStem: 'binding',
      exportSettings: {
        profileId: 'publisher-binding',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-binding',
      },
      expectedPage: {
        widthTwips: 9978,
        heightTwips: 13380,
        topTwips: 1134,
        rightTwips: 1020,
        bottomTwips: 1247,
        leftTwips: 1247,
        gutterTwips: 283,
        mirrored: true,
      },
    },
  ] as const satisfies readonly PublisherAcceptanceProfile[];

const parseXml = (xml: string, entry: string): XMLDocument => {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`${entry} 無法解析。`);
  }
  return document;
};

const wordElements = (
  root: Document | Element,
  localName: string,
): Element[] => Array.from(root.getElementsByTagNameNS(
  WORDPROCESSING_NAMESPACE,
  localName,
));

const wordAttribute = (
  element: Element | undefined,
  localName: string,
): string | undefined =>
  element?.getAttributeNS(WORDPROCESSING_NAMESPACE, localName)
  ?? element?.getAttribute(`w:${localName}`)
  ?? undefined;

const numericWordAttribute = (
  element: Element | undefined,
  localName: string,
): number | undefined => {
  const value = wordAttribute(element, localName);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const paragraphText = (paragraph: Element): string =>
  wordElements(paragraph, 't')
    .map((text) => text.textContent ?? '')
    .join('')
    .trim();

const hasNumbering = (paragraph: Element): boolean =>
  wordElements(paragraph, 'numPr').length > 0;

const createCheck = (
  id: string,
  label: string,
  passed: boolean,
  detail: string,
): PublisherAcceptanceCheck => ({
  id,
  label,
  passed,
  detail,
});

const countRelationships = (xmlParts: readonly string[]): number =>
  xmlParts.reduce((count, xml) => {
    const document = parseXml(xml, 'relationships');
    const root = document.documentElement;
    if (
      root.localName !== 'Relationships'
      || root.namespaceURI !== RELATIONSHIPS_NAMESPACE
    ) {
      return count;
    }
    return count + Array.from(root.children).filter(
      (element) =>
        element.localName === 'Relationship'
        && element.namespaceURI === RELATIONSHIPS_NAMESPACE,
    ).length;
  }, 0);

/**
 * 檢查出版社 DOCX 的固定版面契約、封裝完整性與清單語意。
 */
export const inspectPublisherDocx = async (
  blob: Blob,
  profile: PublisherAcceptanceProfile,
  options: PublisherAcceptanceOptions,
): Promise<PublisherAcceptanceResult> => {
  const bytes = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(bytes);
  const [documentXml, stylesXml, settingsXml] = await Promise.all([
    zip.file('word/document.xml')?.async('string'),
    zip.file('word/styles.xml')?.async('string'),
    zip.file('word/settings.xml')?.async('string'),
  ]);
  if (!documentXml || !stylesXml || !settingsXml) {
    throw new Error('DOCX 缺少 document.xml、styles.xml 或 settings.xml。');
  }

  const document = parseXml(documentXml, 'word/document.xml');
  const settings = parseXml(settingsXml, 'word/settings.xml');
  const section = wordElements(document, 'sectPr').at(-1);
  const pageSize = section ? wordElements(section, 'pgSz')[0] : undefined;
  const pageMargins = section ? wordElements(section, 'pgMar')[0] : undefined;
  const paragraphs = wordElements(document, 'p');
  const paragraphsByText = new Map(
    paragraphs.map((paragraph) => [paragraphText(paragraph), paragraph]),
  );

  const matchedBulletParagraphs = options.expectedBulletTexts
    .map((text) => paragraphsByText.get(text))
    .filter((paragraph): paragraph is Element => paragraph !== undefined);
  const matchedTaskParagraphs = options.expectedTaskTexts
    .map((text) => paragraphs.find((paragraph) =>
      paragraphText(paragraph).includes(text)
    ))
    .filter((paragraph): paragraph is Element => paragraph !== undefined);

  const tocFieldCount = [
    ...wordElements(document, 'fldSimple').map(
      (field) => wordAttribute(field, 'instr') ?? '',
    ),
    ...wordElements(document, 'instrText').map(
      (field) => field.textContent ?? '',
    ),
  ].filter((instruction) => /\bTOC\b/i.test(instruction)).length;

  const bookmarkStarts = wordElements(document, 'bookmarkStart');
  const bookmarkEnds = wordElements(document, 'bookmarkEnd');
  const bookmarkStartIds = bookmarkStarts
    .map((bookmark) => wordAttribute(bookmark, 'id'))
    .filter((id): id is string => id !== undefined);
  const bookmarkEndIds = new Set(
    bookmarkEnds
      .map((bookmark) => wordAttribute(bookmark, 'id'))
      .filter((id): id is string => id !== undefined),
  );
  const bookmarkPairCount = bookmarkStartIds.filter(
    (id) => bookmarkEndIds.has(id),
  ).length;

  const explicitPageBreakCount = wordElements(document, 'br').filter(
    (element) => wordAttribute(element, 'type') === 'page',
  ).length;
  const nonprintingPaginationMarkerCount =
    NONPRINTING_PAGINATION_MARKERS.reduce(
      (count, marker) =>
        count
        + wordElements(document, marker).length
        + wordElements(parseXml(stylesXml, 'word/styles.xml'), marker).length,
      0,
    );

  const mediaCount = Object.values(zip.files).filter(
    (entry) => !entry.dir && /^word\/media\/[^/]+$/i.test(entry.name),
  ).length;
  const relationshipXmlParts = await Promise.all(
    Object.values(zip.files)
      .filter(
        (entry) =>
          !entry.dir
          && /(?:^|\/)_rels\/[^/]+\.rels$/i.test(entry.name),
      )
      .map((entry) => entry.async('string')),
  );
  const relationshipCount = countRelationships(relationshipXmlParts);
  const packageIssues = await inspectDocxPackage(blob);

  const actualPage = {
    widthTwips: numericWordAttribute(pageSize, 'w'),
    heightTwips: numericWordAttribute(pageSize, 'h'),
    topTwips: numericWordAttribute(pageMargins, 'top'),
    rightTwips: numericWordAttribute(pageMargins, 'right'),
    bottomTwips: numericWordAttribute(pageMargins, 'bottom'),
    leftTwips: numericWordAttribute(pageMargins, 'left'),
    gutterTwips: numericWordAttribute(pageMargins, 'gutter') ?? 0,
    mirrored: wordElements(settings, 'mirrorMargins').length === 1,
  };

  const checks = [
    createCheck(
      'package-quality',
      'OOXML 封裝品質',
      packageIssues.length === 0,
      packageIssues.length === 0
        ? 'relationships、content types 與媒體項目皆有效。'
        : packageIssues.map(({ code }) => code).join(', '),
    ),
    createCheck(
      'page-layout',
      '頁面大小與邊界',
      Object.entries(profile.expectedPage).every(
        ([key, value]) => actualPage[key as keyof typeof actualPage] === value,
      ),
      `預期 ${JSON.stringify(profile.expectedPage)}；實際 ${JSON.stringify(actualPage)}。`,
    ),
    createCheck(
      'toc-field',
      'Word 動態目錄欄位',
      tocFieldCount >= 1,
      `TOC 欄位 ${tocFieldCount} 個。`,
    ),
    createCheck(
      'bookmark-pairs',
      '書籤起訖配對',
      bookmarkStartIds.length > 0
        && bookmarkPairCount === bookmarkStartIds.length
        && bookmarkEnds.length === bookmarkStarts.length
        && new Set(bookmarkStartIds).size === bookmarkStartIds.length,
      `起點 ${bookmarkStarts.length}、終點 ${bookmarkEnds.length}、配對 ${bookmarkPairCount}。`,
    ),
    createCheck(
      'relationships',
      'Relationships',
      relationshipCount > 0,
      `Relationships ${relationshipCount} 筆。`,
    ),
    createCheck(
      'media',
      '媒體資源',
      mediaCount >= options.minimumMediaCount,
      `媒體 ${mediaCount} 個，最低要求 ${options.minimumMediaCount} 個。`,
    ),
    createCheck(
      'real-bullet-list',
      '真正無序清單才有項目符號',
      matchedBulletParagraphs.length === options.expectedBulletTexts.length
        && matchedBulletParagraphs.every(hasNumbering),
      `找到 ${matchedBulletParagraphs.length}/${options.expectedBulletTexts.length} 個預期項目，且 ${matchedBulletParagraphs.filter(hasNumbering).length} 個具有 numPr。`,
    ),
    createCheck(
      'task-list-without-bullets',
      '待辦清單沒有 Word 項目符號',
      matchedTaskParagraphs.length === options.expectedTaskTexts.length
        && matchedTaskParagraphs.every((paragraph) => !hasNumbering(paragraph)),
      `找到 ${matchedTaskParagraphs.length}/${options.expectedTaskTexts.length} 個待辦項目，具有 numPr 的數量為 ${matchedTaskParagraphs.filter(hasNumbering).length}。`,
    ),
    createCheck(
      'nonprinting-pagination-markers',
      '無非列印分頁黑點標記',
      nonprintingPaginationMarkerCount === 0,
      `keepNext／keepLines／pageBreakBefore／suppressLineNumbers 共 ${nonprintingPaginationMarkerCount} 個。`,
    ),
    createCheck(
      'explicit-page-breaks',
      '顯式換頁符號',
      explicitPageBreakCount >= 1,
      `顯式 page break ${explicitPageBreakCount} 個。`,
    ),
  ];

  return {
    profileId: profile.profileId,
    status: checks.every(({ passed }) => passed) ? 'passed' : 'failed',
    checks,
    metrics: {
      packageIssueCount: packageIssues.length,
      relationshipCount,
      mediaCount,
      tocFieldCount,
      bookmarkPairCount,
      explicitPageBreakCount,
      bulletParagraphCount: matchedBulletParagraphs.length,
      taskParagraphCount: matchedTaskParagraphs.length,
      nonprintingPaginationMarkerCount,
    },
  };
};
