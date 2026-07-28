import { Blob as NodeBlob } from 'node:buffer';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';
import { BlockType, type ParsedBlock } from '../../services/types';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html?: string) => {
    window: {
      DOMParser: typeof DOMParser;
      XMLSerializer: typeof XMLSerializer;
    };
  };
};
const { PNG } = require('pngjs') as {
  PNG: {
    new (options: { width: number; height: number }): {
      width: number;
      height: number;
      data: Uint8Array;
    };
    sync: {
      read(data: Uint8Array): {
        width: number;
        height: number;
        data: Uint8Array;
      };
      write(png: { width: number; height: number; data: Uint8Array }): Buffer;
    };
  };
};

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE_PATH = path.join(
  REPOSITORY_ROOT,
  'tests',
  'fixtures',
  'publisher-manuscript.md',
);
const ARTIFACT_ROOT = path.join(REPOSITORY_ROOT, 'artifacts', 'docx-qa');
const OUTPUT_PATH = path.join(ARTIFACT_ROOT, 'publisher-fixture.docx');
const GENERATED_IMAGE_KEY = 'fixture-generated-image';
const MERMAID_IMAGE_KEY = 'fixture-mermaid-image';
const IMAGE_PATTERN = /^!\[([^\]]*)\]\((\S+)(?:\s+"([^"]*)")?\)$/;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const installNodeDocumentRuntime = (): void => {
  const xmlDom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = xmlDom.window.DOMParser;
  globalThis.XMLSerializer = xmlDom.window.XMLSerializer;
  globalThis.Blob = NodeBlob as typeof Blob;
  globalThis.atob = (value: string): string =>
    Buffer.from(value, 'base64').toString('binary');
  globalThis.btoa = (value: string): string =>
    Buffer.from(value, 'binary').toString('base64');
};

const toDataUrl = (bytes: Uint8Array): string =>
  `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;

const createGeneratedFixturePng = (): Buffer => {
  const width = 900;
  const height = 420;
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const isGridLine = x % 90 < 2 || y % 70 < 2;
      const isStar = (
        ((x - 180) ** 2 + (y - 130) ** 2 < 120)
        || ((x - 560) ** 2 + (y - 210) ** 2 < 180)
        || ((x - 730) ** 2 + (y - 95) ** 2 < 90)
      );
      png.data[offset] = isStar ? 236 : isGridLine ? 115 : 15;
      png.data[offset + 1] = isStar ? 190 : isGridLine ? 154 : 45;
      png.data[offset + 2] = isStar ? 70 : isGridLine ? 178 : 72;
      png.data[offset + 3] = 255;
    }
  }
  return PNG.sync.write(png);
};

const findMermaidBrowser = (): string => {
  const configuredPath = process.env.MERMAID_BROWSER_PATH?.trim();
  if (configuredPath) {
    return path.resolve(configuredPath);
  }
  const commonPaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const fs = require('node:fs') as typeof import('node:fs');
  const detected = commonPaths.find((candidate) =>
    fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );
  if (!detected) {
    throw new Error(
      '找不到可用的 Edge/Chrome；請將 MERMAID_BROWSER_PATH 設為明確瀏覽器執行檔。',
    );
  }
  return detected;
};

const runProcess = async (
  executable: string,
  args: string[],
): Promise<void> => new Promise((resolve, reject) => {
  const child = spawn(executable, args, {
    cwd: REPOSITORY_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(
      `Headless browser 結束碼 ${code}。`
      + `${stdout ? ` stdout=${stdout.trim()}` : ''}`
      + `${stderr ? ` stderr=${stderr.trim()}` : ''}`,
    ));
  });
});

const createMermaidHtml = (
  mermaidSource: string,
  mermaidScriptUrl: string,
): string => {
  const serializedSource = JSON.stringify(mermaidSource)
    .replaceAll('<', '\\u003c');
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; width: 1000px; height: 560px; overflow: hidden; }
    body { display: grid; place-items: center; background: #ffffff; }
    .mermaid { width: 920px; font-family: "Noto Sans TC", sans-serif; }
    svg { display: block; max-width: 920px !important; max-height: 500px; margin: auto; }
  </style>
</head>
<body>
  <pre id="diagram" class="mermaid"></pre>
  <script src="${mermaidScriptUrl}"></script>
  <script>
    const diagram = document.getElementById('diagram');
    diagram.textContent = ${serializedSource};
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'strict',
      themeVariables: {
        fontFamily: '"Noto Sans TC", sans-serif',
        primaryColor: '#edf3f7',
        primaryBorderColor: '#0b2545',
        primaryTextColor: '#0b2545',
        lineColor: '#2e747b'
      }
    });
    mermaid.run({ nodes: [diagram] })
      .then(() => { document.body.dataset.rendered = 'true'; })
      .catch((error) => {
        document.body.textContent = 'MERMAID_RENDER_FAILED: ' + error.message;
      });
  </script>
</body>
</html>`;
};

const assertMermaidPng = (bytes: Buffer): void => {
  const png = PNG.sync.read(bytes);
  let nonWhitePixels = 0;
  for (let offset = 0; offset < png.data.length; offset += 4) {
    if (
      png.data[offset] < 245
      || png.data[offset + 1] < 245
      || png.data[offset + 2] < 245
    ) {
      nonWhitePixels += 1;
    }
  }
  if (
    png.width !== 1000
    || png.height !== 560
    || nonWhitePixels < 2_000
  ) {
    throw new Error(
      `Mermaid PNG 驗證失敗：${png.width}x${png.height}，`
      + `非白色像素 ${nonWhitePixels}。`,
    );
  }
};

const renderMermaidPng = async (
  mermaidSource: string,
  runtimeDirectory: string,
): Promise<Buffer> => {
  const browserPath = findMermaidBrowser();
  const mermaidScriptPath = path.join(
    REPOSITORY_ROOT,
    'node_modules',
    'mermaid',
    'dist',
    'mermaid.min.js',
  );
  const htmlPath = path.join(runtimeDirectory, 'mermaid.html');
  const pngPath = path.join(runtimeDirectory, 'mermaid.png');
  const browserProfile = path.join(runtimeDirectory, 'browser-profile');
  const html = createMermaidHtml(
    mermaidSource,
    pathToFileURL(mermaidScriptPath).href,
  );
  await writeFile(htmlPath, html, 'utf8');
  await mkdir(browserProfile);

  await runProcess(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--user-data-dir=${browserProfile}`,
    '--window-size=1000,560',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=5000',
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ]);
  const bytes = await readFile(pngPath);
  assertMermaidPng(bytes);
  return bytes;
};

const prepareFixtureBlocks = (
  blocks: ParsedBlock[],
): { blocks: ParsedBlock[]; mermaidSource: string } => {
  let mermaidSource = '';
  let chapterNeedsContentPage = false;
  const preparedBlocks = blocks.map((block): ParsedBlock => {
    if (block.type === BlockType.CHAPTER_OPENER) {
      chapterNeedsContentPage = true;
      return block;
    }
    if (
      chapterNeedsContentPage
      && block.type === BlockType.HEADING_1
    ) {
      chapterNeedsContentPage = false;
      return {
        ...block,
        metadata: {
          ...block.metadata,
          pageBreakBefore: true,
        },
      };
    }
    if (block.type === BlockType.MERMAID) {
      if (mermaidSource) {
        throw new Error('公開 fixture 目前只允許一個 Mermaid 圖表。');
      }
      mermaidSource = block.content;
      return {
        ...block,
        type: BlockType.IMAGE,
        content: MERMAID_IMAGE_KEY,
        metadata: {
          alt: '星圖工坊 Mermaid 觀測流程',
          title: '星圖工坊 Mermaid 圖表',
        },
      };
    }

    if (block.type === BlockType.PARAGRAPH) {
      const imageMatch = block.content.match(IMAGE_PATTERN);
      if (imageMatch) {
        return {
          ...block,
          type: BlockType.IMAGE,
          content: imageMatch[2],
          metadata: {
            alt: imageMatch[1],
            title: imageMatch[3] ?? imageMatch[1],
          },
        };
      }
    }
    return block;
  });
  if (!mermaidSource) {
    throw new Error('公開 fixture 缺少 Mermaid 區塊。');
  }
  return { blocks: preparedBlocks, mermaidSource };
};

const assertDocxFixture = async (docxBytes: Buffer): Promise<void> => {
  const zip = await JSZip.loadAsync(docxBytes);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('fixture DOCX 缺少 word/document.xml。');
  }
  const requiredAccessibleText = [
    '星圖工坊觀測面板',
    '星圖工坊測試圖片',
    '星圖工坊 Mermaid 觀測流程',
    '星圖工坊 Mermaid 圖表',
    '星圖工坊公開頁面 QR Code',
  ];
  for (const text of requiredAccessibleText) {
    if (!documentXml.includes(text)) {
      throw new Error(`fixture DOCX 缺少媒體 alt/title：${text}`);
    }
  }
  if (documentXml.includes('[Mermaid Chart Error]')) {
    throw new Error('fixture DOCX 包含 Mermaid error fallback。');
  }

  const mediaEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && entry.name.startsWith('word/media/'),
  );
  if (mediaEntries.length < 3) {
    throw new Error(`fixture DOCX 僅有 ${mediaEntries.length} 個媒體檔。`);
  }
  for (const entry of mediaEntries) {
    const mediaBytes = Buffer.from(await entry.async('uint8array'));
    if (!mediaBytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      throw new Error(`fixture DOCX 媒體不是有效 PNG：${entry.name}`);
    }
  }
};

export const generatePublisherFixture = async (): Promise<string> => {
  installNodeDocumentRuntime();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runtimeDirectory = path.join(
    ARTIFACT_ROOT,
    'fixture-runtime',
    timestamp,
  );
  await mkdir(runtimeDirectory, { recursive: true });

  const markdown = await readFile(FIXTURE_PATH, 'utf8');
  const [{ parseMarkdown }, { generateDocx }] = await Promise.all([
    import('../../services/markdownParser'),
    import('../../services/docxGenerator'),
  ]);
  const parsed = parseMarkdown(markdown);
  const prepared = prepareFixtureBlocks(parsed.blocks);
  const generatedPng = createGeneratedFixturePng();
  const mermaidPng = await renderMermaidPng(
    prepared.mermaidSource,
    runtimeDirectory,
  );
  const warnings: string[] = [];
  const blob = await generateDocx(prepared.blocks, {
    exportSettings: {
      profileId: 'publisher-exact',
      pageSizeId: 'tech',
      marginPresetId: 'publisher-exact',
    },
    showLineNumbers: true,
    meta: parsed.meta,
    imageRegistry: {
      [GENERATED_IMAGE_KEY]: toDataUrl(generatedPng),
      [MERMAID_IMAGE_KEY]: toDataUrl(mermaidPng),
    },
    onWarning: (warning) => warnings.push(
      `${warning.code}: ${warning.message}`,
    ),
  });
  const docxBytes = Buffer.from(await blob.arrayBuffer());
  await assertDocxFixture(docxBytes);
  await mkdir(ARTIFACT_ROOT, { recursive: true });
  await writeFile(OUTPUT_PATH, docxBytes);

  console.log(`Fixture Markdown：${FIXTURE_PATH}`);
  console.log(`Mermaid PNG：${path.join(runtimeDirectory, 'mermaid.png')}`);
  console.log(`Fixture DOCX：${OUTPUT_PATH}`);
  console.log(`DOCX bytes：${docxBytes.byteLength}`);
  if (warnings.length > 0) {
    console.warn(`DOCX warnings：\n${warnings.join('\n')}`);
  }
  return OUTPUT_PATH;
};

generatePublisherFixture().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
