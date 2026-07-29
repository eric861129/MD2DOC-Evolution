import { describe, expect, it } from 'vitest';
import { getExampleManuscript } from '../constants/exampleContent';
import { analyzeExampleCoverage } from '../services/exampleCoverage';
import { SYNTAX_FEATURES } from '../services/syntaxSpec';

describe('example coverage matrix', () => {
  it.each(['zh', 'en'] as const)(
    '%s 快速範例符合單一語法規格宣告',
    (language) => {
      const expected = SYNTAX_FEATURES
        .filter(({ coverage }) => coverage.quickExample)
        .map(({ id }) => id)
        .sort();
      const actual = analyzeExampleCoverage(
        getExampleManuscript(`quick-${language}`).content,
      ).sort();

      expect(actual).toEqual(expected);
    },
  );

  it.each(['zh', 'en'] as const)(
    '%s 完整稿涵蓋所有宣告為 completeExample 的語法',
    (language) => {
      const expected = SYNTAX_FEATURES
        .filter(({ coverage }) => coverage.completeExample)
        .map(({ id }) => id)
        .sort();
      const actual = analyzeExampleCoverage(
        getExampleManuscript(`complete-${language}`).content,
      ).sort();

      expect(actual).toEqual(expected);
    },
  );
});
