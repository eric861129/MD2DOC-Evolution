import { describe, expect, it } from 'vitest';
import { buildAIPromptFromSyntaxSpec } from '../services/aiPrompt';
import {
  CORE_SYNTAX_FEATURE_IDS,
  GITHUB_REPO_URL,
  QUICK_ACTION_IDS,
  SYNTAX_COMMANDS,
  SYNTAX_FEATURES,
} from '../services/syntaxSpec';

describe('syntaxSpec', () => {
  it('keeps command ids and quick actions backed by syntax features', () => {
    const featureIds = new Set(SYNTAX_FEATURES.map((feature) => feature.id));
    const commandIds = SYNTAX_COMMANDS.map((command) => command.id);

    expect(new Set(commandIds).size).toBe(commandIds.length);
    expect(SYNTAX_COMMANDS.every((command) => featureIds.has(command.featureId))).toBe(true);
    expect(QUICK_ACTION_IDS.every((id) => commandIds.includes(id))).toBe(true);
  });

  it('builds a repo-aware prompt from the core syntax contract', () => {
    const prompt = buildAIPromptFromSyntaxSpec();

    expect(prompt).toContain(GITHUB_REPO_URL);
    expect(prompt).toContain('Non-negotiable Output Contract');
    expect(prompt).toContain('只輸出「轉換後的 Markdown 原稿」');
    expect(prompt).toContain('Silent Quality Check Before Answering');
    for (const featureId of CORE_SYNTAX_FEATURE_IDS) {
      const feature = SYNTAX_FEATURES.find((item) => item.id === featureId);
      expect(prompt).toContain(feature?.name);
    }
  });

  it('does not contain replacement or private-use mojibake markers', () => {
    expect(JSON.stringify({ SYNTAX_FEATURES, SYNTAX_COMMANDS })).not.toMatch(/\uFFFD|[\uE000-\uF8FF]/);
  });

  it('公開 IMPORTANT 與 CAUTION 的語法及快速插入命令', () => {
    const calloutFeature = SYNTAX_FEATURES.find(({ id }) => id === 'callout');
    const commandsById = Object.fromEntries(
      SYNTAX_COMMANDS.map((command) => [command.id, command]),
    );

    expect(calloutFeature?.syntax).toContain('> [!IMPORTANT]');
    expect(calloutFeature?.syntax).toContain('> [!CAUTION]');
    expect(commandsById['callout-important'].insertText)
      .toContain('> [!IMPORTANT]');
    expect(commandsById['callout-caution'].insertText)
      .toContain('> [!CAUTION]');
    expect(QUICK_ACTION_IDS).toEqual(expect.arrayContaining([
      'callout-important',
      'callout-caution',
    ]));
    const prompt = buildAIPromptFromSyntaxSpec();
    expect(prompt).toContain(
      '> [!NOTE]、> [!TIP]、> [!WARNING]、> [!IMPORTANT]、> [!CAUTION]',
    );
  });

  it('公開獨立 QR 語法與插入命令', () => {
    const qrFeature = SYNTAX_FEATURES.find(({ id }) => id === 'qr');
    const qrCommand = SYNTAX_COMMANDS.find(({ id }) => id === 'qr');

    expect(qrFeature?.syntax).toBe('[QR:標籤](url)');
    expect(qrCommand?.insertText).toBe(
      '[QR:連結標籤](https://example.com)',
    );
  });

  it('公開章首頁 YAML 語法與快速插入命令', () => {
    const chapterFeature = SYNTAX_FEATURES.find(({ id }) => id === 'chapter');
    const chapterCommand = SYNTAX_COMMANDS.find(({ id }) => id === 'chapter');

    expect(chapterFeature?.syntax).toContain('[CHAPTER]');
    expect(chapterFeature?.syntax).toContain('goals:');
    expect(chapterCommand?.insertText).toContain('number: "01"');
    expect(chapterCommand?.insertText).toContain('[/CHAPTER]');
    expect(QUICK_ACTION_IDS).toContain('chapter');
  });
});
