import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AIPromptMode,
  buildAIPromptFromSyntaxSpec,
} from '../services/aiPrompt';

interface PromptGolden {
  commonSectionOrder: string[];
  modes: Record<AIPromptMode, {
    label: string;
    inputHeading: string;
    criticalContract: string;
  }>;
}

const goldenPath = resolve(process.cwd(), 'tests', 'golden', 'ai-prompt-v2.json');
const golden = JSON.parse(readFileSync(goldenPath, 'utf8')) as PromptGolden;

describe('AI Prompt v2 golden contract', () => {
  it.each(['transform', 'draft'] as const)(
    '%s 模式維持核准的章節順序與模式契約',
    (mode) => {
      const prompt = buildAIPromptFromSyntaxSpec(mode);
      const expected = golden.modes[mode];

      const expectedHeadings = [
        ...golden.commonSectionOrder,
        expected.inputHeading,
      ];
      let lastPosition = -1;
      for (const heading of expectedHeadings) {
        const position = prompt.indexOf(`${heading}\n`, lastPosition + 1);
        expect(position, heading).toBeGreaterThan(lastPosition);
        lastPosition = position;
      }
      expect(prompt).toContain(expected.label);
      expect(prompt).toContain(expected.criticalContract);
      expect(prompt).not.toContain('\\n');
    },
  );
});
