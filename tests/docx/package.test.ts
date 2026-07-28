import JSZip from 'jszip';
import { Packer } from 'docx';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateDocx } from '../../services/docxGenerator';
import { resolvePageLayout } from '../../services/docx/layout/resolve';
import { postProcessDocx } from '../../services/docx/postprocess';
import {
  DocxQualityError,
  inspectDocxPackage,
} from '../../services/docx/quality';
import { readDocxXml } from '../helpers/readDocx';

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p/></w:body>
</w:document>`;

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:displayBackgroundShape/>
  <w:updateFields w:val="true"/>
  <w:compat/>
</w:settings>`;

const bindingSettings = {
  profileId: 'publisher-binding',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-binding',
} as const;

const exactSettings = {
  profileId: 'publisher-exact',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-exact',
} as const;

const topGutterSettings = {
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
} as const;

const createPackage = async (
  mutate?: (zip: JSZip) => void,
  compression: 'STORE' | 'DEFLATE' = 'STORE',
): Promise<Blob> => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('word/document.xml', DOCUMENT_XML);
  zip.file('word/settings.xml', SETTINGS_XML);
  mutate?.(zip);
  return new Blob(
    [await zip.generateAsync({ type: 'uint8array', compression })],
    {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  );
};

const corruptCompressedEntry = async (
  entryName: string,
): Promise<Blob> => {
  const source = new Uint8Array(
    await (await createPackage(undefined, 'DEFLATE')).arrayBuffer(),
  );
  const view = new DataView(source.buffer);
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset + 30 <= source.length && view.getUint32(offset, true) === 0x04034b50) {
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(source.subarray(nameStart, nameStart + nameLength));

    if (name === entryName) {
      if (compressedSize === 0) {
        throw new Error(`測試項目沒有 compressed payload：${entryName}`);
      }
      source[dataStart] = (source[dataStart] & 0xf8) | 0x07;
      return new Blob([source], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
    offset = dataStart + compressedSize;
  }

  throw new Error(`測試封裝找不到項目：${entryName}`);
};

const readSettingsChildren = async (blob: Blob): Promise<string[]> => {
  const settingsXml = await readDocxXml(blob, 'word/settings.xml');
  const settings = new DOMParser().parseFromString(
    settingsXml,
    'application/xml',
  );
  return Array.from(settings.documentElement.children)
    .map((element) => element.localName);
};

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

describe('postProcessDocx', () => {
  it('重複處理鏡像版面仍只保留一個 mirrorMargins，且位於合法 CT_Settings 順序', async () => {
    const source = await createPackage((zip) => {
      zip.file(
        'word/settings.xml',
        SETTINGS_XML.replace(
          '<w:updateFields w:val="true"/>',
          '<w:mirrorMargins/><w:updateFields w:val="true"/>',
        ),
      );
    });
    const layout = resolvePageLayout(bindingSettings);

    const once = await postProcessDocx(source, { layout });
    const twice = await postProcessDocx(once, { layout });
    const children = await readSettingsChildren(twice);

    expect(children.filter((name) => name === 'mirrorMargins')).toHaveLength(1);
    expect(children.indexOf('mirrorMargins'))
      .toBe(children.indexOf('displayBackgroundShape') + 1);
    expect(children.indexOf('mirrorMargins'))
      .toBeLessThan(children.indexOf('updateFields'));
    expect(children.indexOf('mirrorMargins'))
      .toBeLessThan(children.indexOf('compat'));
    expect(children).not.toContain('gutterAtTop');
  });

  it('非鏡像版面會移除殘留 mirrorMargins，且不破壞 gutterAtTop 互斥規則', async () => {
    const source = await createPackage((zip) => {
      zip.file(
        'word/settings.xml',
        SETTINGS_XML.replace(
          '<w:updateFields w:val="true"/>',
          '<w:mirrorMargins/><w:gutterAtTop/><w:updateFields w:val="true"/>',
        ),
      );
    });

    const processed = await postProcessDocx(source, {
      layout: resolvePageLayout(exactSettings),
    });

    await expect(readSettingsChildren(processed)).resolves.not.toContain(
      'mirrorMargins',
    );
    await expect(readSettingsChildren(processed)).resolves.not.toContain(
      'gutterAtTop',
    );
  });

  it('只正規化 WordprocessingML namespace，不移除同 localName 的 foreign 節點', async () => {
    const source = await createPackage((zip) => {
      zip.file(
        'word/settings.xml',
        SETTINGS_XML
          .replace(
            'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
            'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:x="urn:foreign"',
          )
          .replace(
            '<w:updateFields w:val="true"/>',
            '<x:mirrorMargins/><x:gutterAtTop/><w:updateFields w:val="true"/>',
          ),
      );
    });

    const processed = await postProcessDocx(source, {
      layout: resolvePageLayout(exactSettings),
    });
    const settingsXml = await readDocxXml(processed, 'word/settings.xml');

    expect(settingsXml).toContain('<x:mirrorMargins');
    expect(settingsXml).toContain('<x:gutterAtTop');
  });

  it('缺少 displayBackgroundShape 時仍依完整 CT_Settings 順序把 mirror 放在 saveFormsData 與 alignBordersAndEdges 間', async () => {
    const source = await createPackage((zip) => {
      zip.file(
        'word/settings.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:saveFormsData/>
  <w:alignBordersAndEdges/>
  <w:updateFields w:val="true"/>
  <w:compat/>
</w:settings>`,
      );
    });

    const processed = await postProcessDocx(source, {
      layout: resolvePageLayout(bindingSettings),
    });
    const children = await readSettingsChildren(processed);

    expect(children).toEqual([
      'saveFormsData',
      'mirrorMargins',
      'alignBordersAndEdges',
      'updateFields',
      'compat',
    ]);
  });

  it('top gutter 依正式 schema 放在 border settings 後、updateFields 前', async () => {
    const source = await createPackage((zip) => {
      zip.file(
        'word/settings.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:displayBackgroundShape/>
  <w:alignBordersAndEdges/>
  <w:bordersDoNotSurroundHeader/>
  <w:bordersDoNotSurroundFooter/>
  <w:updateFields w:val="true"/>
  <w:compat/>
</w:settings>`,
      );
    });

    const processed = await postProcessDocx(source, {
      layout: resolvePageLayout(topGutterSettings),
    });
    const children = await readSettingsChildren(processed);

    expect(children).toEqual([
      'displayBackgroundShape',
      'alignBordersAndEdges',
      'bordersDoNotSurroundHeader',
      'bordersDoNotSurroundFooter',
      'gutterAtTop',
      'updateFields',
      'compat',
    ]);
  });

  it('publisher-binding 的真實封裝包含鏡像設定與 283 twips gutter', async () => {
    const blob = await generateDocx([], {
      exportSettings: bindingSettings,
      showLineNumbers: false,
    });

    const settingsXml = await readDocxXml(blob, 'word/settings.xml');
    const documentXml = await readDocxXml(blob, 'word/document.xml');

    expect(settingsXml.match(/<w:mirrorMargins(?:\s[^>]*)?\/>/g)).toHaveLength(1);
    expect(documentXml).toMatch(
      /<w:pgMar(?=[^>]*w:gutter="283")[^>]*\/>/,
    );
  });
});

describe('inspectDocxPackage', () => {
  it.each([
    {
      name: '缺少 Content Types',
      mutate: (zip: JSZip) => zip.remove('[Content_Types].xml'),
      code: 'REQUIRED_PART_MISSING',
      entry: '[Content_Types].xml',
    },
    {
      name: '缺少主文件',
      mutate: (zip: JSZip) => zip.remove('word/document.xml'),
      code: 'REQUIRED_PART_MISSING',
      entry: 'word/document.xml',
    },
  ])('$name 時回傳 error', async ({ mutate, code, entry }) => {
    const issues = await inspectDocxPackage(await createPackage(mutate));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code,
      entry,
    }));
  });

  it('媒體副檔名為 undefined 時回傳明確錯誤', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('word/media/cover.undefined', new Uint8Array([1, 2, 3]));
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'MEDIA_EXTENSION_UNDEFINED',
      entry: 'word/media/cover.undefined',
    }));
  });

  it('媒體沒有 Default 或 Override MIME 時回傳錯誤，但副檔名比對不分大小寫', async () => {
    const missingIssues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('word/media/cover.webp', new Uint8Array([1, 2, 3]));
    }));
    const supportedIssues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('word/media/COVER.PNG', new Uint8Array([1, 2, 3]));
    }));

    expect(missingIssues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'MEDIA_CONTENT_TYPE_MISSING',
      entry: 'word/media/cover.webp',
    }));
    expect(supportedIssues).not.toContainEqual(expect.objectContaining({
      code: 'MEDIA_CONTENT_TYPE_MISSING',
    }));
  });

  it('媒體 Override 的 PartName 支援 URI encoding 與不分大小寫比對', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        '[Content_Types].xml',
        CONTENT_TYPES.replace(
          '</Types>',
          '  <Override PartName="/WORD/MEDIA/Cover%20Art.WEBP" ContentType="image/webp"/>\n</Types>',
        ),
      );
      zip.file('word/media/cover art.webp', new Uint8Array([1, 2, 3]));
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'MEDIA_CONTENT_TYPE_MISSING',
    }));
  });

  it('由 relationship 所屬來源 part 解析相對 URI，允許 external、大小寫、編碼、query 與 fragment', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        'word/_rels/document.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="image" Target="../customXml/%E5%9C%96%20%E7%89%87.xml?version=%E4%B8%80#section-%E4%BA%8C"/>
  <Relationship Id="rId2" Type="hyperlink" Target="https://example.com/docs" TargetMode="External"/>
</Relationships>`,
      );
      zip.file('customxml/圖 片.XML', '<root/>');
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'RELATIONSHIP_TARGET_MISSING',
    }));
  });

  it('internal relationship 指向不存在 part 時回傳錯誤', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        'word/_rels/document.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId9" Type="image" Target="media/missing.png"/>
</Relationships>`,
      );
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'RELATIONSHIP_TARGET_MISSING',
      entry: 'word/_rels/document.xml.rels',
    }));
  });

  it('必要 XML 無法解析時回傳穩定錯誤', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('word/document.xml', '<w:document>');
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'XML_PARSE_ERROR',
      entry: 'word/document.xml',
    }));
  });

  it('實際 compressed entry 損毀時不 reject generic，而回傳 PACKAGE_UNREADABLE', async () => {
    const corrupted = await corruptCompressedEntry('word/document.xml');
    const rawZip = await JSZip.loadAsync(await corrupted.arrayBuffer());

    await expect(rawZip.file('word/document.xml')!.async('string')).rejects
      .toBeInstanceOf(Error);
    await expect(inspectDocxPackage(corrupted)).resolves.toContainEqual(
      expect.objectContaining({
        severity: 'error',
        code: 'PACKAGE_UNREADABLE',
        entry: 'word/document.xml',
      }),
    );
  });

  it.each([
    '../word/document.xml',
    'https://example.com/word/document.xml',
    '//example.com/word/document.xml',
    'word\\document.xml',
    'word%2Fdocument.xml',
    'word%5Cdocument.xml',
    'word/document%ZZ.xml',
  ])('root relationship 的不安全 internal Target 回傳 RELATIONSHIP_TARGET_INVALID：%s', async (target) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="officeDocument" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'RELATIONSHIP_TARGET_INVALID',
      entry: '_rels/.rels',
    }));
  });

  it.each([
    {
      relationshipsPath: '_rels/.rels',
      target: '1:foo.bin',
      entry: '1:foo.bin',
    },
    {
      relationshipsPath: '_rels/.rels',
      target: ':foo.bin',
      entry: ':foo.bin',
    },
    {
      relationshipsPath: '_rels/.rels',
      target: '%31:foo.bin',
      entry: '1:foo.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: '1:foo.bin',
      entry: 'word/1:foo.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: ':foo.bin',
      entry: 'word/:foo.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: '%31:foo.bin',
      entry: 'word/1:foo.bin',
    },
  ])('relative-ref 第一個 raw segment 含 literal colon 時回傳 RELATIONSHIP_TARGET_INVALID：$relationshipsPath / $target', async ({
    relationshipsPath,
    target,
    entry,
  }) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(entry, new Uint8Array([1]));
      zip.file(
        relationshipsPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="custom" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'RELATIONSHIP_TARGET_INVALID',
      entry: relationshipsPath,
    }));
  });

  it.each([
    {
      relationshipsPath: '_rels/.rels',
      target: 'word/a:b.bin',
      entry: 'word/a:b.bin',
    },
    {
      relationshipsPath: '_rels/.rels',
      target: './1:foo.bin',
      entry: '1:foo.bin',
    },
    {
      relationshipsPath: '_rels/.rels',
      target: 'a%3Ab.bin',
      entry: 'a:b.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: 'word/a:b.bin',
      entry: 'word/word/a:b.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: './1:foo.bin',
      entry: 'word/1:foo.bin',
    },
    {
      relationshipsPath: 'word/_rels/document.xml.rels',
      target: 'a%3Ab.bin',
      entry: 'word/a:b.bin',
    },
  ])('relative-ref path-noscheme 保留非首段或 encoded colon：$relationshipsPath / $target', async ({
    relationshipsPath,
    target,
    entry,
  }) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(entry, new Uint8Array([1]));
      zip.file(
        relationshipsPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="custom" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'RELATIONSHIP_TARGET_INVALID',
      entry: relationshipsPath,
    }));
    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'RELATIONSHIP_TARGET_MISSING',
      entry: relationshipsPath,
    }));
  });

  it.each([
    'word/document%00.xml',
    'word/space document.xml',
    'word/tab\tdocument.xml',
    `word/control${String.fromCharCode(0x7f)}document.xml`,
    'word/文件.xml',
  ])('即使同名 ZIP entry 存在，raw/decoded 非 URI 字元仍回傳 RELATIONSHIP_TARGET_INVALID：%s', async (target) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(target, DOCUMENT_XML);
      zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="officeDocument" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'RELATIONSHIP_TARGET_INVALID',
      entry: '_rels/.rels',
    }));
  });

  it.each([
    'word/document.xml?bad query',
    'word/document.xml?bad=%ZZ',
    'word/document.xml#raw-文件',
  ])('relationship query/fragment 的無效 URI 字元回傳 RELATIONSHIP_TARGET_INVALID：%s', async (target) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="officeDocument" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'RELATIONSHIP_TARGET_INVALID',
      entry: '_rels/.rels',
    }));
  });

  it.each([
    {
      target: "word/media/a:@!$&amp;'()*+,;=.bin",
      entry: "word/media/a:@!$&'()*+,;=.bin",
    },
    {
      target: 'word/media/a%3Fb%23c.bin',
      entry: 'word/media/a?b#c.bin',
    },
  ])('relationship segment 保留合法 pchar 或 encoded ?/#：$entry', async ({ target, entry }) => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(entry, new Uint8Array([1]));
      zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="custom" Target="${target}"/>
</Relationships>`,
      );
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'RELATIONSHIP_TARGET_INVALID',
    }));
    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'RELATIONSHIP_TARGET_MISSING',
    }));
  });

  it('大小寫不同但 OPC 等價的 ZIP part 回傳 PART_NAME_COLLISION', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('WORD/DOCUMENT.XML', DOCUMENT_XML);
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'PART_NAME_COLLISION',
      entry: 'word/document.xml',
    }));
  });

  it('required part 以 OPC ASCII case-insensitive index 判定存在', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.remove('word/document.xml');
      zip.file('WORD/DOCUMENT.XML', DOCUMENT_XML);
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'REQUIRED_PART_MISSING',
      entry: 'word/document.xml',
    }));
  });

  it.each([
    {
      name: 'Content Types namespace 錯誤',
      xml: CONTENT_TYPES.replace(
        'http://schemas.openxmlformats.org/package/2006/content-types',
        'urn:wrong-content-types',
      ),
    },
    {
      name: 'Content Types root 錯誤',
      xml: CONTENT_TYPES
        .replace('<Types ', '<WrongTypes ')
        .replace('</Types>', '</WrongTypes>'),
    },
    {
      name: 'Default 缺少必要屬性',
      xml: CONTENT_TYPES.replace(
        '<Default Extension="png" ContentType="image/png"/>',
        '<Default Extension="" ContentType="image/png"/>',
      ),
    },
    {
      name: 'Override PartName URI 無效',
      xml: CONTENT_TYPES.replace(
        '</Types>',
        '<Override PartName="/word/media/cover%ZZ.png" ContentType="image/png"/></Types>',
      ),
    },
    {
      name: 'Override PartName 不是絕對 part name',
      xml: CONTENT_TYPES.replace(
        '</Types>',
        '<Override PartName="word/media/cover.png" ContentType="image/png"/></Types>',
      ),
    },
  ])('$name 時回傳 CONTENT_TYPES_INVALID 且 inspect 不 reject', async ({ xml }) => {
    const inspection = inspectDocxPackage(await createPackage((zip) => {
      zip.file('[Content_Types].xml', xml);
    }));

    await expect(inspection).resolves.toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'CONTENT_TYPES_INVALID',
      entry: '[Content_Types].xml',
    }));
  });

  it.each([
    '/word/media/cover%00.png',
    '/word/media/space cover.png',
    '/word/media/tab\tcover.png',
    `/word/media/control${String.fromCharCode(0x7f)}cover.png`,
    '/word/media/封面.png',
  ])('Override 即使同名 ZIP entry 存在，raw/decoded 非 URI 字元仍回傳 CONTENT_TYPES_INVALID：%s', async (partName) => {
    const xml = CONTENT_TYPES.replace(
      '</Types>',
      `<Override PartName="${partName}" ContentType="image/png"/></Types>`,
    );
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('[Content_Types].xml', xml);
      zip.file(partName.slice(1), new Uint8Array([1]));
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'CONTENT_TYPES_INVALID',
      entry: '[Content_Types].xml',
    }));
  });

  it.each([
    {
      partName: '/word/media/%E5%B0%81%E9%9D%A2.webp',
      entry: 'word/media/封面.webp',
    },
    {
      partName: "/word/media/a:@!$&amp;'()*+,;=.webp",
      entry: "word/media/a:@!$&'()*+,;=.webp",
    },
    {
      partName: '/word/media/a%3Fb%23c.webp',
      entry: 'word/media/a?b#c.webp',
    },
  ])('Override 保留 percent-encoded Unicode、合法 pchar 或 encoded ?/#：$entry', async ({ partName, entry }) => {
    const xml = CONTENT_TYPES.replace(
      '</Types>',
      `<Override PartName="${partName}" ContentType="image/webp"/></Types>`,
    );
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('[Content_Types].xml', xml);
      zip.file(entry, new Uint8Array([1]));
    }));

    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'CONTENT_TYPES_INVALID',
    }));
    expect(issues).not.toContainEqual(expect.objectContaining({
      code: 'MEDIA_CONTENT_TYPE_MISSING',
      entry,
    }));
  });

  it('常見圖片副檔名的有效 ContentType 不一致時回傳 MEDIA_CONTENT_TYPE_INVALID', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file(
        '[Content_Types].xml',
        CONTENT_TYPES.replace('image/png', 'image/jpeg'),
      );
      zip.file('word/media/cover.png', new Uint8Array([1, 2, 3]));
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'MEDIA_CONTENT_TYPE_INVALID',
      entry: 'word/media/cover.png',
    }));
  });

  it('任何空媒體即使未被 relationship 引用仍回傳 MEDIA_EMPTY', async () => {
    const issues = await inspectDocxPackage(await createPackage((zip) => {
      zip.file('word/media/empty.png', new Uint8Array());
    }));

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'MEDIA_EMPTY',
      entry: 'word/media/empty.png',
    }));
  });
});

describe('generateDocx 的品質閘門', () => {
  it('依序在 Packer 後執行 schema-aware 後處理，再檢查並回傳處理後 Blob', async () => {
    const packer = vi.spyOn(Packer, 'toBlob')
      .mockResolvedValueOnce(await createPackage());

    try {
      const blob = await generateDocx([], {
        exportSettings: bindingSettings,
        showLineNumbers: false,
      });

      const children = await readSettingsChildren(blob);
      expect(children.filter((name) => name === 'mirrorMargins')).toHaveLength(1);
      expect(children.indexOf('mirrorMargins'))
        .toBe(children.indexOf('displayBackgroundShape') + 1);
    } finally {
      packer.mockRestore();
    }
  });

  it('品質檢查有 error 時拋出保留 issues 的 DocxQualityError', async () => {
    const corruptPackage = await createPackage((zip) => {
      zip.remove('word/document.xml');
    });
    const packer = vi.spyOn(Packer, 'toBlob')
      .mockResolvedValueOnce(corruptPackage);

    try {
      const generation = generateDocx([], {
        exportSettings: exactSettings,
        showLineNumbers: false,
      });

      await expect(generation).rejects.toBeInstanceOf(DocxQualityError);
      await expect(generation).rejects.toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: 'REQUIRED_PART_MISSING',
            entry: 'word/document.xml',
          }),
        ]),
      });
    } finally {
      packer.mockRestore();
    }
  });

  it('Packer 產生的壓縮內容損毀時統一拋出 PACKAGE_UNREADABLE DocxQualityError', async () => {
    const packer = vi.spyOn(Packer, 'toBlob')
      .mockResolvedValueOnce(await corruptCompressedEntry('word/document.xml'));

    try {
      const generation = generateDocx([], {
        exportSettings: exactSettings,
        showLineNumbers: false,
      });

      await expect(generation).rejects.toBeInstanceOf(DocxQualityError);
      await expect(generation).rejects.toMatchObject({
        issues: [expect.objectContaining({
          code: 'PACKAGE_UNREADABLE',
          entry: 'word/document.xml',
        })],
      });
    } finally {
      packer.mockRestore();
    }
  });
});
