import JSZip from 'jszip';
import type { ResolvedPageLayout } from './layout/types';

const WORDPROCESSING_NAMESPACE =
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const SETTINGS_PATH = 'word/settings.xml';
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface PostProcessDocxConfig {
  layout: ResolvedPageLayout;
}

const hasXmlParseError = (document: XMLDocument): boolean =>
  document.getElementsByTagName('parsererror').length > 0;

const removeDirectChildren = (
  settings: Element,
  localNames: ReadonlySet<string>,
): void => {
  Array.from(settings.children)
    .filter((child) => localNames.has(child.localName))
    .forEach((child) => child.remove());
};

const insertPageSetting = (
  document: XMLDocument,
  settings: Element,
  localName: 'mirrorMargins' | 'gutterAtTop',
): void => {
  const element = document.createElementNS(
    WORDPROCESSING_NAMESPACE,
    `w:${localName}`,
  );
  const children = Array.from(settings.children);
  const displayBackgroundShape = children.find(
    (child) => child.localName === 'displayBackgroundShape',
  );

  if (displayBackgroundShape) {
    displayBackgroundShape.after(element);
    return;
  }

  const firstFollowingSetting = children.find(
    (child) => child.localName === 'updateFields'
      || child.localName === 'compat',
  );
  if (firstFollowingSetting) {
    settings.insertBefore(element, firstFollowingSetting);
    return;
  }

  settings.appendChild(element);
};

/**
 * 正規化 DOCX 頁面設定，確保鏡像邊界與上方裝訂設定可重入且符合 CT_Settings 順序。
 */
export const postProcessDocx = async (
  blob: Blob,
  config: PostProcessDocxConfig,
): Promise<Blob> => {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const settingsEntry = zip.file(SETTINGS_PATH);
  if (!settingsEntry) {
    return blob;
  }

  const settingsXml = await settingsEntry.async('string');
  const document = new DOMParser().parseFromString(
    settingsXml,
    'application/xml',
  );
  if (hasXmlParseError(document)) {
    return blob;
  }

  const settings = document.documentElement;
  removeDirectChildren(
    settings,
    new Set(['mirrorMargins', 'gutterAtTop']),
  );

  if (config.layout.margins.mode === 'mirrored') {
    insertPageSetting(document, settings, 'mirrorMargins');
  } else if (
    config.layout.margins.gutterPosition === 'top'
    && config.layout.margins.gutterCm > 0
  ) {
    insertPageSetting(document, settings, 'gutterAtTop');
  }

  zip.file(SETTINGS_PATH, new XMLSerializer().serializeToString(document));
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return new Blob([bytes], { type: DOCX_MIME_TYPE });
};
