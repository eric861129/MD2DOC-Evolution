import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readUtf8 = (path: string) => readFileSync(path, 'utf8');

describe('public repository content', () => {
  it('keeps README versions, demo URL, dev URL, and verify command in sync', () => {
    const packageJson = JSON.parse(readUtf8('package.json')) as { version: string };
    const zh = readUtf8('README.md');
    const en = readUtf8('README_EN.md');

    for (const doc of [zh, en]) {
      expect(doc).toContain(`v${packageJson.version}`);
      expect(doc).toContain('https://huangchiyu.com/MD2DOC-Evolution/');
      expect(doc).toContain('http://localhost:3000/MD2DOC-Evolution/');
      expect(doc).toContain('npm run verify');
      expect(doc).toContain('https://github.com/eric861129/MD2DOC-Evolution');
      expect(doc).not.toContain('v1.3.0');
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
});
