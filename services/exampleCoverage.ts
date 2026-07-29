import { parseMarkdown } from './markdownParser';
import { BlockType } from './types';
import {
  SYNTAX_FEATURES,
  type SyntaxFeatureId,
} from './syntaxSpec';

const CALLOUT_TYPES = new Set<BlockType>([
  BlockType.CALLOUT_NOTE,
  BlockType.CALLOUT_TIP,
  BlockType.CALLOUT_WARNING,
  BlockType.CALLOUT_IMPORTANT,
  BlockType.CALLOUT_CAUTION,
]);

const hasNormalLink = (markdown: string): boolean =>
  /(?<!!)\[(?!QR:)[^\]]+\]\(https?:\/\/[^)]+\)/.test(markdown);

const hasInlineFormatting = (markdown: string): boolean =>
  /\*\*[^*]+\*\*|\*[^*\n]+\*|<u>[\s\S]+?<\/u>|`[^`\n]+`|\[(?:Ctrl|Alt|Shift|Enter|Esc|Tab)\]/i
    .test(markdown);

/**
 * 以實際 Parser 結果為主、原始語法為輔，確認範例稿件涵蓋的公開功能。
 */
export const analyzeExampleCoverage = (
  markdown: string,
): SyntaxFeatureId[] => {
  const { blocks, meta } = parseMarkdown(markdown);
  const blockTypes = new Set(blocks.map(({ type }) => type));
  const covered = new Set<SyntaxFeatureId>();

  if (Object.keys(meta).length > 0) covered.add('frontmatter');
  if (blockTypes.has(BlockType.CHAPTER_OPENER)) covered.add('chapter');
  if (blockTypes.has(BlockType.TOC)) covered.add('toc');
  if (
    blockTypes.has(BlockType.HEADING_1)
    || blockTypes.has(BlockType.HEADING_2)
    || blockTypes.has(BlockType.HEADING_3)
  ) covered.add('heading');
  if (
    blockTypes.has(BlockType.BULLET_LIST)
    || blockTypes.has(BlockType.NUMBERED_LIST)
  ) covered.add('list');
  if (/^\s*-\s+\[[ xX]\]\s+/m.test(markdown)) covered.add('task-list');
  if (blockTypes.has(BlockType.QUOTE_BLOCK)) covered.add('quote');
  if (blockTypes.has(BlockType.HORIZONTAL_RULE)) covered.add('divider');
  if (blockTypes.has(BlockType.CODE_BLOCK)) covered.add('code-block');
  if (blockTypes.has(BlockType.MERMAID)) covered.add('mermaid');
  if (blocks.some(({ type }) => CALLOUT_TYPES.has(type))) covered.add('callout');
  if (blockTypes.has(BlockType.TABLE)) covered.add('table');
  if (blockTypes.has(BlockType.CHAT_CUSTOM)) covered.add('chat');
  if (blockTypes.has(BlockType.IMAGE)) covered.add('image');
  if (blockTypes.has(BlockType.QR)) covered.add('qr');
  if (hasNormalLink(markdown)) covered.add('link');
  if (hasInlineFormatting(markdown)) covered.add('inline-formatting');

  return SYNTAX_FEATURES
    .map(({ id }) => id)
    .filter((id) => covered.has(id));
};
