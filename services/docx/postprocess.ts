import JSZip from 'jszip';
import type { ResolvedPageLayout } from './layout/types';
import {
  createDocxPackageUnreadableError,
  DocxPackageIssueError,
} from './quality';

const WORDPROCESSING_NAMESPACE =
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const SETTINGS_PATH = 'word/settings.xml';
const DOCUMENT_PATH = 'word/document.xml';
const STYLES_PATH = 'word/styles.xml';
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const NONPRINTING_PAGINATION_MARKERS = new Set([
  'keepNext',
  'keepLines',
  'pageBreakBefore',
  'suppressLineNumbers',
]);

// ISO/IEC 29500 CT_Settings child sequence.
const SETTINGS_CHILD_ORDER = [
  'writeProtection',
  'view',
  'zoom',
  'removePersonalInformation',
  'removeDateAndTime',
  'doNotDisplayPageBoundaries',
  'displayBackgroundShape',
  'printPostScriptOverText',
  'printFractionalCharacterWidth',
  'printFormsData',
  'embedTrueTypeFonts',
  'embedSystemFonts',
  'saveSubsetFonts',
  'saveFormsData',
  'mirrorMargins',
  'alignBordersAndEdges',
  'bordersDoNotSurroundHeader',
  'bordersDoNotSurroundFooter',
  'gutterAtTop',
  'hideSpellingErrors',
  'hideGrammaticalErrors',
  'activeWritingStyle',
  'proofState',
  'formsDesign',
  'attachedTemplate',
  'linkStyles',
  'stylePaneFormatFilter',
  'stylePaneSortMethod',
  'documentType',
  'mailMerge',
  'revisionView',
  'trackRevisions',
  'doNotTrackMoves',
  'doNotTrackFormatting',
  'documentProtection',
  'autoFormatOverride',
  'styleLockTheme',
  'styleLockQFSet',
  'defaultTabStop',
  'autoHyphenation',
  'consecutiveHyphenLimit',
  'hyphenationZone',
  'doNotHyphenateCaps',
  'showEnvelope',
  'summaryLength',
  'clickAndTypeStyle',
  'defaultTableStyle',
  'evenAndOddHeaders',
  'bookFoldRevPrinting',
  'bookFoldPrinting',
  'bookFoldPrintingSheets',
  'drawingGridHorizontalSpacing',
  'drawingGridVerticalSpacing',
  'displayHorizontalDrawingGridEvery',
  'displayVerticalDrawingGridEvery',
  'doNotUseMarginsForDrawingGridOrigin',
  'drawingGridHorizontalOrigin',
  'drawingGridVerticalOrigin',
  'doNotShadeFormData',
  'noPunctuationKerning',
  'characterSpacingControl',
  'printTwoOnOne',
  'strictFirstAndLastChars',
  'noLineBreaksAfter',
  'noLineBreaksBefore',
  'savePreviewPicture',
  'doNotValidateAgainstSchema',
  'saveInvalidXml',
  'ignoreMixedContent',
  'alwaysShowPlaceholderText',
  'doNotDemarcateInvalidXml',
  'saveXmlDataOnly',
  'useXSLTWhenSaving',
  'saveThroughXslt',
  'showXMLTags',
  'alwaysMergeEmptyNamespace',
  'updateFields',
  'hdrShapeDefaults',
  'footnotePr',
  'endnotePr',
  'compat',
  'docVars',
  'rsids',
  'uiCompat97To2003',
  'attachedSchema',
  'themeFontLang',
  'clrSchemeMapping',
  'doNotIncludeSubdocsInStats',
  'doNotAutoCompressPictures',
  'forceUpgrade',
  'captions',
  'readModeInkLockDown',
  'smartTagType',
  'schemaLibrary',
  'doNotEmbedSmartTags',
  'decimalSymbol',
  'listSeparator',
] as const;

const SETTINGS_ORDER = new Map<string, number>(
  SETTINGS_CHILD_ORDER.map((localName, index) => [localName, index]),
);

export interface PostProcessDocxConfig {
  layout: ResolvedPageLayout;
  removeNonprintingPaginationMarkers?: boolean;
}

const hasXmlParseError = (document: XMLDocument): boolean =>
  document.getElementsByTagName('parsererror').length > 0;

const createSettingsIssueError = (
  code: string,
  message: string,
): DocxPackageIssueError =>
  new DocxPackageIssueError({
    severity: 'error',
    code,
    message,
    entry: SETTINGS_PATH,
  });

const createXmlIssueError = (
  entry: string,
  code: string,
  message: string,
): DocxPackageIssueError =>
  new DocxPackageIssueError({
    severity: 'error',
    code,
    message,
    entry,
  });

const isWordprocessingElement = (
  element: Element,
  localName?: string,
): boolean =>
  element.namespaceURI === WORDPROCESSING_NAMESPACE
  && (localName === undefined || element.localName === localName);

const validateSettingsOrder = (settings: Element): void => {
  let previousRank = -1;
  for (const child of Array.from(settings.children)) {
    if (!isWordprocessingElement(child)) {
      continue;
    }
    const rank = SETTINGS_ORDER.get(child.localName);
    if (rank === undefined) {
      throw createSettingsIssueError(
        'SETTINGS_STRUCTURE_UNSAFE',
        `無法安全定位未知的 WordprocessingML settings 節點：${child.localName}。`,
      );
    }
    if (rank < previousRank) {
      throw createSettingsIssueError(
        'SETTINGS_ORDER_INVALID',
        `word/settings.xml 的 CT_Settings 子節點順序無效：${child.localName}。`,
      );
    }
    previousRank = rank;
  }
};

const removeWordprocessingPageSettings = (settings: Element): void => {
  Array.from(settings.children)
    .filter((child) =>
      isWordprocessingElement(child)
      && (child.localName === 'mirrorMargins'
        || child.localName === 'gutterAtTop'))
    .forEach((child) => child.remove());
};

const insertPageSetting = (
  document: XMLDocument,
  settings: Element,
  localName: 'mirrorMargins' | 'gutterAtTop',
): void => {
  const desiredRank = SETTINGS_ORDER.get(localName);
  if (desiredRank === undefined) {
    throw createSettingsIssueError(
      'SETTINGS_STRUCTURE_UNSAFE',
      `找不到 ${localName} 的 CT_Settings schema 位置。`,
    );
  }

  const element = document.createElementNS(
    WORDPROCESSING_NAMESPACE,
    `w:${localName}`,
  );
  const firstFollowingSetting = Array.from(settings.children).find((child) => {
    if (!isWordprocessingElement(child)) {
      return false;
    }
    const rank = SETTINGS_ORDER.get(child.localName);
    return rank !== undefined && rank > desiredRank;
  });

  if (firstFollowingSetting) {
    settings.insertBefore(element, firstFollowingSetting);
  } else {
    settings.appendChild(element);
  }
};

const parseXmlPart = (
  entryName: string,
  bytes: Uint8Array,
  invalidCode = 'WORDPROCESSING_XML_INVALID',
  invalidMessage = `${entryName} 無法解析。`,
): XMLDocument => {
  const xml = new TextDecoder().decode(bytes);
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (hasXmlParseError(document)) {
    throw createXmlIssueError(
      entryName,
      invalidCode,
      invalidMessage,
    );
  }
  return document;
};

const directWordprocessingChild = (
  parent: Element,
  localName: string,
): Element | undefined =>
  Array.from(parent.children).find((child) =>
    isWordprocessingElement(child, localName)
  );

/**
 * 把真正的另起頁語意轉成顯式分頁符，再移除 Word 會以黑方塊顯示的段落分頁標記。
 */
const convertParagraphPageBreaks = (document: XMLDocument): void => {
  const paragraphs = Array.from(document.getElementsByTagNameNS(
    WORDPROCESSING_NAMESPACE,
    'p',
  ));

  for (const paragraph of paragraphs) {
    const paragraphProperties = directWordprocessingChild(paragraph, 'pPr');
    if (
      !paragraphProperties
      || !directWordprocessingChild(paragraphProperties, 'pageBreakBefore')
    ) {
      continue;
    }

    const run = document.createElementNS(
      WORDPROCESSING_NAMESPACE,
      'w:r',
    );
    const pageBreak = document.createElementNS(
      WORDPROCESSING_NAMESPACE,
      'w:br',
    );
    pageBreak.setAttributeNS(
      WORDPROCESSING_NAMESPACE,
      'w:type',
      'page',
    );
    run.appendChild(pageBreak);
    paragraph.insertBefore(run, paragraphProperties.nextSibling);
  }
};

const removePaginationMarkers = (document: XMLDocument): void => {
  for (const localName of NONPRINTING_PAGINATION_MARKERS) {
    Array.from(document.getElementsByTagNameNS(
      WORDPROCESSING_NAMESPACE,
      localName,
    )).forEach((element) => element.remove());
  }
};

const normalizePaginationMarkers = (
  zip: JSZip,
  entryBytes: Map<JSZip.JSZipObject, Uint8Array>,
): void => {
  for (const path of [DOCUMENT_PATH, STYLES_PATH]) {
    const entry = Object.values(zip.files).find(
      (candidate) =>
        !candidate.dir && candidate.name.toLowerCase() === path,
    );
    if (!entry) {
      continue;
    }

    const bytes = entryBytes.get(entry);
    if (!bytes) {
      throw createDocxPackageUnreadableError(entry.name);
    }
    const document = parseXmlPart(entry.name, bytes);
    if (path === DOCUMENT_PATH) {
      convertParagraphPageBreaks(document);
    }
    removePaginationMarkers(document);
    zip.file(
      entry.name,
      new XMLSerializer().serializeToString(document),
    );
  }
};

/**
 * 在 DOCX 封裝層補上 docx 套件未提供的版面設定，並維持 CT_Settings schema 順序。
 */
export const postProcessDocx = async (
  blob: Blob,
  config: PostProcessDocxConfig,
): Promise<Blob> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await blob.arrayBuffer());
  } catch {
    throw createDocxPackageUnreadableError();
  }

  const entryBytes = new Map<JSZip.JSZipObject, Uint8Array>();
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }
    try {
      entryBytes.set(entry, await entry.async('uint8array'));
    } catch {
      throw createDocxPackageUnreadableError(entry.name);
    }
  }

  const settingsEntry = Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.toLowerCase() === SETTINGS_PATH,
  );
  if (settingsEntry) {
    const settingsBytes = entryBytes.get(settingsEntry);
    if (!settingsBytes) {
      throw createDocxPackageUnreadableError(settingsEntry.name);
    }
    const document = parseXmlPart(
      settingsEntry.name,
      settingsBytes,
      'SETTINGS_XML_INVALID',
      'word/settings.xml 無法解析。',
    );
    const settings = document.documentElement;
    if (!isWordprocessingElement(settings, 'settings')) {
      throw createSettingsIssueError(
        'SETTINGS_STRUCTURE_INVALID',
        'word/settings.xml 根節點不是 WordprocessingML settings。',
      );
    }

    removeWordprocessingPageSettings(settings);
    validateSettingsOrder(settings);

    if (config.layout.margins.mode === 'mirrored') {
      insertPageSetting(document, settings, 'mirrorMargins');
    } else if (
      config.layout.margins.gutterPosition === 'top'
      && config.layout.margins.gutterCm > 0
    ) {
      insertPageSetting(document, settings, 'gutterAtTop');
    }
    validateSettingsOrder(settings);

    zip.file(
      settingsEntry.name,
      new XMLSerializer().serializeToString(document),
    );
  }

  if (config.removeNonprintingPaginationMarkers) {
    normalizePaginationMarkers(zip, entryBytes);
  }

  try {
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    return new Blob([bytes], { type: DOCX_MIME_TYPE });
  } catch {
    throw createDocxPackageUnreadableError();
  }
};
