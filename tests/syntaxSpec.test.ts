import { describe, expect, it } from 'vitest';
import { buildAIPromptFromSyntaxSpec } from '../services/aiPrompt';
import {
  AI_PROMPT_FEATURE_IDS,
  GITHUB_REPO_URL,
  QUICK_ACTION_IDS,
  SYNTAX_COMMANDS,
  SYNTAX_FEATURES,
} from '../services/syntaxSpec';

describe('syntaxSpec', () => {
  it('讓指令與快捷操作都能回溯到語法功能', () => {
    const featureIds = new Set(SYNTAX_FEATURES.map((feature) => feature.id));
    const commandIds = SYNTAX_COMMANDS.map((command) => command.id);

    expect(new Set(commandIds).size).toBe(commandIds.length);
    expect(SYNTAX_COMMANDS.every((command) => featureIds.has(command.featureId))).toBe(true);
    expect(QUICK_ACTION_IDS.every((id) => commandIds.includes(id))).toBe(true);
  });

  it('每一項語法都具備支援狀態與完整覆蓋矩陣', () => {
    expect(SYNTAX_FEATURES.map(({ id }) => id)).toContain('task-list');

    for (const feature of SYNTAX_FEATURES) {
      const commands = SYNTAX_COMMANDS.filter(({ featureId }) => featureId === feature.id);

      expect(feature.status).toMatch(/^(supported|experimental|legacy)$/);
      expect(feature.coverage.slashCommand, feature.id).toBe(commands.length > 0);
      expect(feature.coverage.quickAction, feature.id)
        .toBe(commands.some(({ quickAction }) => quickAction));

      if (feature.status === 'supported') {
        expect(feature.coverage, feature.id).toMatchObject({
          completeExample: true,
          readme: true,
          userGuide: true,
        });
      }
    }
  });

  it('語法與範例必須使用真正換行，不可出現字面上的反斜線加 n', () => {
    for (const feature of SYNTAX_FEATURES) {
      expect(feature.syntax, feature.id).not.toContain('\\n');
      expect(feature.example, feature.id).not.toContain('\\n');
    }
  });

  it('明確區分一般連結、QR 與 Word 目錄契約', () => {
    const linkFeature = SYNTAX_FEATURES.find(({ id }) => id === 'link');
    const qrFeature = SYNTAX_FEATURES.find(({ id }) => id === 'qr');
    const tocFeature = SYNTAX_FEATURES.find(({ id }) => id === 'toc');

    expect(linkFeature?.description).toContain('hyperlink');
    expect(linkFeature?.description).not.toContain('QR');
    expect(qrFeature?.description).toContain('獨占一行');
    expect(tocFeature?.description).toContain('Publisher Profile');
    expect(tocFeature?.description).toContain('legacy');
  });

  it('依 AI 覆蓋矩陣建立 repo-aware Prompt v2', () => {
    for (const mode of ['transform', 'draft'] as const) {
      const prompt = buildAIPromptFromSyntaxSpec(mode);

      expect(prompt).toContain(GITHUB_REPO_URL);
      expect(prompt).toContain('Non-negotiable Output Contract');
      expect(prompt).toContain('只輸出「轉換後的 Markdown 原稿」');
      expect(prompt).toContain('Profile and Pagination Boundary');
      expect(prompt).toContain('Silent Quality Check Before Answering');

      for (const featureId of AI_PROMPT_FEATURE_IDS) {
        const feature = SYNTAX_FEATURES.find((item) => item.id === featureId);
        expect(prompt).toContain(feature?.name);
      }
    }
  });

  it('AI Prompt 不得出現字面上的反斜線加 n', () => {
    expect(buildAIPromptFromSyntaxSpec('transform')).not.toContain('\\n');
    expect(buildAIPromptFromSyntaxSpec('draft')).not.toContain('\\n');
  });

  it('不包含 replacement character 或 private-use 亂碼標記', () => {
    expect(JSON.stringify({ SYNTAX_FEATURES, SYNTAX_COMMANDS }))
      .not.toMatch(/\uFFFD|[\uE000-\uF8FF]/);
  });

  it('IMPORTANT 與 CAUTION 的語法、指令與 Prompt 保持一致', () => {
    const calloutFeature = SYNTAX_FEATURES.find(({ id }) => id === 'callout');
    const commandsById = Object.fromEntries(
      SYNTAX_COMMANDS.map((command) => [command.id, command]),
    );

    expect(calloutFeature?.syntax).toContain('> [!IMPORTANT]');
    expect(calloutFeature?.syntax).toContain('> [!CAUTION]');
    expect(commandsById['callout-important'].insertText).toContain('> [!IMPORTANT]');
    expect(commandsById['callout-caution'].insertText).toContain('> [!CAUTION]');
    expect(QUICK_ACTION_IDS).toEqual(expect.arrayContaining([
      'callout-important',
      'callout-caution',
    ]));
    expect(buildAIPromptFromSyntaxSpec()).toContain(
      '> [!NOTE] / > [!TIP] / > [!WARNING] / > [!IMPORTANT] / > [!CAUTION]',
    );
  });

  it('QR 語法與插入指令保持一致', () => {
    const qrFeature = SYNTAX_FEATURES.find(({ id }) => id === 'qr');
    const qrCommand = SYNTAX_COMMANDS.find(({ id }) => id === 'qr');

    expect(qrFeature?.syntax).toBe('[QR:標籤](url)');
    expect(qrCommand?.insertText).toBe('[QR:連結標籤](https://example.com)');
  });

  it('章首頁 YAML 語法與插入指令保持一致', () => {
    const chapterFeature = SYNTAX_FEATURES.find(({ id }) => id === 'chapter');
    const chapterCommand = SYNTAX_COMMANDS.find(({ id }) => id === 'chapter');

    expect(chapterFeature?.syntax).toContain('[CHAPTER]');
    expect(chapterFeature?.syntax).toContain('goals:');
    expect(chapterCommand?.insertText).toContain('number: "01"');
    expect(chapterCommand?.insertText).toContain('[/CHAPTER]');
    expect(QUICK_ACTION_IDS).toContain('chapter');
  });
});
