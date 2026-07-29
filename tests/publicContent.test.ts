import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  INITIAL_CONTENT_EN,
  INITIAL_CONTENT_ZH,
} from '../constants/defaultContent';
import { buildAIPromptFromSyntaxSpec } from '../services/aiPrompt';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

const readUtf8 = (path: string) => readFileSync(path, 'utf8');

describe('public repository content', () => {
  it('keeps package, lockfile, and README versions in sync', () => {
    const packageJson = JSON.parse(readUtf8('package.json')) as { version: string };
    const packageLock = JSON.parse(readUtf8('package-lock.json')) as {
      version: string;
      packages: {
        '': {
          version: string;
        };
      };
    };
    const zh = readUtf8('README.md');
    const en = readUtf8('README_EN.md');

    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages[''].version).toBe(packageJson.version);

    for (const doc of [zh, en]) {
      expect(doc).toContain(`v${packageJson.version}`);
      expect(doc).toContain('https://huangchiyu.com/MD2DOC-Evolution/');
      expect(doc).toContain('http://localhost:3000/MD2DOC-Evolution/');
      expect(doc).toContain('npm run verify');
      expect(doc).toContain('https://github.com/eric861129/MD2DOC-Evolution');
      expect(doc).not.toContain('v1.3.0');
    }
  });

  it('keeps bilingual AI guidance aligned on publisher syntax and link policy', () => {
    const getAiGuidance = (path: string) => readUtf8(path)
      .split('## AI Assisted Generation')[1]
      ?.split('## Documentation')[0] ?? '';
    const zh = getAiGuidance('README.md');
    const en = getAiGuidance('README_EN.md');

    expect(zh).toContain('章首頁');
    expect(zh).toContain('五種 callout');
    expect(zh).toContain('明確 QR');
    expect(zh).toContain('一般 Markdown 連結保持 hyperlink');

    expect(en).toContain('chapter opener');
    expect(en).toContain('five callouts');
    expect(en).toContain('explicit QR');
    expect(en).toContain('normal Markdown links remain hyperlinks');
  });

  it('publishes the 17.6 × 23.6 cm technical-book preset consistently', () => {
    const zh = readUtf8('README.md');
    const en = readUtf8('README_EN.md');
    const profile = readUtf8('docs/PUBLISHER_PROFILE.md');

    for (const content of [
      zh,
      en,
      profile,
      INITIAL_CONTENT_ZH,
      INITIAL_CONTENT_EN,
    ]) {
      expect(content).toContain('17.6 × 23.6 cm');
      expect(content).not.toContain('17 × 23 cm');
    }
  });

  it('keeps key public strings valid UTF-8 without replacement or private-use characters', () => {
    const files = [
      'README.md',
      'README_EN.md',
      'components/AIPromptModal.tsx',
      'components/editor/editorCommands.ts',
      'services/aiPrompt.ts',
      'services/syntaxSpec.ts',
    ];

    for (const path of files) {
      expect(readUtf8(path)).not.toMatch(/\uFFFD|[\uE000-\uF8FF]/);
    }
    expect(readUtf8('README.md')).toContain('專業工具台 UI');
    expect(readUtf8('services/aiPrompt.ts')).toContain('只輸出「轉換後的 Markdown 原稿」');
  });

  it.each([
    ['繁體中文', INITIAL_CONTENT_ZH],
    ['英文', INITIAL_CONTENT_EN],
  ])('%s 預設內容示範完整出版社語法而不把一般連結轉成 QR', (
    _language,
    markdown,
  ) => {
    const { blocks } = parseMarkdown(markdown);
    const blockTypes = blocks.map(({ type }) => type);
    const chatAlignments = blocks
      .filter(({ type }) => type === BlockType.CHAT_CUSTOM)
      .map(({ alignment }) => alignment);

    expect(markdown).toContain('publisher-exact');
    expect(markdown).toContain('publisher-narrow');
    expect(markdown).toContain('publisher-binding');
    expect(blockTypes).toEqual(expect.arrayContaining([
      BlockType.CHAPTER_OPENER,
      BlockType.CALLOUT_NOTE,
      BlockType.CALLOUT_TIP,
      BlockType.CALLOUT_WARNING,
      BlockType.CALLOUT_IMPORTANT,
      BlockType.CALLOUT_CAUTION,
      BlockType.TABLE,
      BlockType.QR,
    ]));
    expect(chatAlignments).toEqual(expect.arrayContaining([
      'left',
      'right',
      'center',
    ]));
    expect(markdown).toContain('[MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution)');
    expect(markdown).toContain('[QR:');
    expect(markdown).not.toContain('會自動在 Word 中生成 QR Code');
    expect(markdown).not.toContain('will automatically generate a QR Code');
  });

  it('AI prompt 僅對重要連結要求明確 QR，普通連結保留 hyperlink', () => {
    const prompt = buildAIPromptFromSyntaxSpec();

    expect(prompt).toContain('只有需要紙本掃描的重要連結');
    expect(prompt).toContain('[QR:標籤](URL)');
    expect(prompt).toContain('一般 Markdown 連結保持 hyperlink');
  });
});
