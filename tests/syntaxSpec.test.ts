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
});
