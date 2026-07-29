import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  INITIAL_CONTENT_EN,
  INITIAL_CONTENT_ZH,
} from '../constants/defaultContent';
import { getExampleManuscript } from '../constants/exampleContent';
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

  it('publishes the round-seven publisher margins and pagination-marker policy', () => {
    const profile = readUtf8('docs/PUBLISHER_PROFILE.md');

    expect(profile).toContain('上下 2.10 cm、左右 2.30 cm');
    expect(profile).toContain('內容寬度是 13.00 cm');
    expect(profile).toContain('角色名稱獨立一行');
    expect(profile).toContain('黑方塊');
    expect(INITIAL_CONTENT_ZH)
      .toContain('上下 2.10、左右 2.30 cm');
    expect(INITIAL_CONTENT_EN)
      .toContain('2.10 cm vertical, 2.30 cm horizontal');
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
    ['繁體中文', getExampleManuscript('complete-zh').content],
    ['英文', getExampleManuscript('complete-en').content],
  ])('%s 完整功能稿示範完整出版社語法而不把一般連結轉成 QR', (
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

  it('公開文件對齊 v1.5.0 範例、教學、隱私與能力邊界', () => {
    const zh = readUtf8('README.md');
    const en = readUtf8('README_EN.md');
    const overview = readUtf8('docs/PROJECT_OVERVIEW.md');
    const guide = readUtf8('docs/USER_GUIDE.md');
    const customization = readUtf8('docs/CUSTOMIZATION.md');

    for (const content of [zh, en]) {
      expect(content).toContain('content/examples/complete.zh.md');
      expect(content).toContain('docs/USER_GUIDE.md');
      expect(content).toMatch(/隱私|Privacy/);
      expect(content).toMatch(/能力邊界|Boundaries/);
      expect(content).toMatch(/連續預覽|continuous preview/i);
    }
    expect(overview).toContain('只有真正清單才有黑點');
    expect(overview).not.toContain('連結自動轉二維碼');
    expect(overview).not.toContain('`User:`、`AI:`');
    expect(guide).toContain('Word 後製與換頁專章');
    expect(customization).toContain('不能只完成 Parser');
  });

  it('AI Guide v2 明確允許底線例外並禁止其他 HTML', () => {
    const guide = readUtf8('docs/AI_GENERATION_GUIDE.md');

    expect(guide).toContain('AI Generation Guide v2');
    expect(guide).toContain('`<u>` 是唯一正式支援');
    expect(guide).toContain('不要輸出 `<br>`');
    expect(guide).not.toContain('使用 HTML 標籤（如 `<u>`');
    expect(guide).toContain('沒有字面上的反斜線加 n');
  });

  it('歷史計畫有明確標示，不會被誤認為現行規格', () => {
    const historicalPlan = readUtf8(
      'docs/superpowers/plans/2026-07-28-publisher-docx-layout-and-quality.md',
    );

    expect(historicalPlan).toContain('歷史文件（已執行計畫）');
    expect(historicalPlan).toContain('不代表 v1.5.0 現行功能');
    expect(historicalPlan).toContain('docs/USER_GUIDE.md');
  });
});
