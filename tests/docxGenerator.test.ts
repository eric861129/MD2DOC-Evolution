import { beforeAll, describe, expect, it } from 'vitest';
import { generateDocx } from '../services/docxGenerator';
import { BlockType } from '../services/types';
import { listDocxEntries, readDocxXml } from './helpers/readDocx';

const publisherBlocks = [
  { type: BlockType.HEADING_1, content: 'Title' },
  { type: BlockType.PARAGRAPH, content: 'Hello world' },
  { type: BlockType.BULLET_LIST, content: 'Item 1' },
];

beforeAll(() => {
  if (typeof Blob.prototype.arrayBuffer === 'function') {
    return;
  }

  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
  });
});

describe('docxGenerator', () => {
  it('輸出可解包且套用出版社頁面、命名樣式、欄位更新與中繼資料', async () => {
    const blob = await generateDocx(publisherBlocks, {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      meta: {
        title: '技術書稿',
        author: '黃祈豫',
        header: true,
        footer: true,
      },
      imageRegistry: {},
    });

    expect(new Uint8Array(await blob.slice(0, 2).arrayBuffer()))
      .toEqual(new Uint8Array([0x50, 0x4b]));

    const entries = await listDocxEntries(blob);
    expect(entries).toEqual(expect.arrayContaining([
      'docProps/core.xml',
      'word/document.xml',
      'word/footer1.xml',
      'word/header1.xml',
      'word/settings.xml',
      'word/styles.xml',
    ]));

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toContain('Hello world');
    expect(documentXml).toMatch(
      /<w:pgSz(?=[^>]*w:w="9638")(?=[^>]*w:h="13039")[^>]*\/>/,
    );
    expect(documentXml).toMatch(
      /<w:pgMar(?=[^>]*w:top="1440")(?=[^>]*w:right="1440")(?=[^>]*w:bottom="1440")(?=[^>]*w:left="1440")(?=[^>]*w:header="708")(?=[^>]*w:footer="708")(?=[^>]*w:gutter="0")[^>]*\/>/,
    );

    const stylesXml = await readDocxXml(blob, 'word/styles.xml');
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="CodeBlock"/);
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="Callout"/);
    expect(stylesXml).toMatch(/<w:style[^>]*w:styleId="BookCaption"/);

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:updateFields(?:\s+w:val="true")?\s*\/>/);

    const coreXml = await readDocxXml(blob, 'docProps/core.xml');
    expect(coreXml).toContain('<dc:title>技術書稿</dc:title>');
    expect(coreXml).toContain('<dc:creator>黃祈豫</dc:creator>');

    const headerXml = await readDocxXml(blob, 'word/header1.xml');
    expect(headerXml).toContain('技術書稿');

    const footerXml = await readDocxXml(blob, 'word/footer1.xml');
    expect(footerXml).toContain('技術書稿 | ');
    expect(footerXml).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);
  });

  it('鏡像邊界在 section 寫入裝訂預留並於 settings 啟用鏡像頁邊界', async () => {
    const blob = await generateDocx([], {
      exportSettings: {
        profileId: 'publisher-binding',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-binding',
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toMatch(
      /<w:pgMar(?=[^>]*w:top="1134")(?=[^>]*w:right="1020")(?=[^>]*w:bottom="1247")(?=[^>]*w:left="1247")(?=[^>]*w:gutter="283")[^>]*\/>/,
    );

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:mirrorMargins(?:\s[^>]*)?\/>/);
    expect(settingsXml).not.toContain('<w:gutterAtTop');
  });

  it('上方裝訂預留在 settings 啟用 gutterAtTop 且不誤啟用鏡像邊界', async () => {
    const blob = await generateDocx([], {
      exportSettings: {
        profileId: 'publisher-exact',
        pageSizeId: 'tech',
        marginPresetId: 'custom',
        customMargins: {
          mode: 'standard',
          topCm: 2,
          rightCm: 2,
          bottomCm: 2,
          leftCm: 2,
          gutterCm: 0.5,
          gutterPosition: 'top',
        },
      },
      showLineNumbers: false,
    });

    const documentXml = await readDocxXml(blob, 'word/document.xml');
    expect(documentXml).toMatch(/<w:pgMar(?=[^>]*w:gutter="283")[^>]*\/>/);

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    expect(settingsXml).toMatch(/<w:gutterAtTop(?:\s[^>]*)?\/>/);
    expect(settingsXml).not.toContain('<w:mirrorMargins');
  });

  it('technical-legacy 保持頁首書名與頁尾僅頁碼的既有行為', async () => {
    const blob = await generateDocx([], {
      exportSettings: {
        profileId: 'technical-legacy',
        pageSizeId: 'tech',
        marginPresetId: 'publisher-exact',
      },
      showLineNumbers: false,
      meta: {
        title: '舊版技術書稿',
        header: true,
        footer: true,
      },
    });

    const headerXml = await readDocxXml(blob, 'word/header1.xml');
    expect(headerXml).toContain('舊版技術書稿');

    const footerXml = await readDocxXml(blob, 'word/footer1.xml');
    expect(footerXml).not.toContain('舊版技術書稿');
    expect(footerXml).toMatch(/<w:instrText[^>]*>PAGE<\/w:instrText>/);
  });
});
