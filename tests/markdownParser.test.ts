import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

describe('markdownParser', () => {
  it('should parse headers correctly', () => {
    const input = [
      '# Heading 1',
      '## Heading 2',
      '### Heading 3'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: BlockType.HEADING_1, content: 'Heading 1' });
    expect(blocks[1]).toEqual({ type: BlockType.HEADING_2, content: 'Heading 2' });
    expect(blocks[2]).toEqual({ type: BlockType.HEADING_3, content: 'Heading 3' });
  });

  it('should parse paragraphs correctly', () => {
    const input = [
      'Paragraph 1',
      '',
      'Paragraph 2'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: BlockType.PARAGRAPH, content: 'Paragraph 1' });
    expect(blocks[1]).toEqual({ type: BlockType.PARAGRAPH, content: 'Paragraph 2' });
  });

  it('should parse code blocks correctly', () => {
    const input = [
      '```typescript',
      'const a = 1;',
      '```'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.CODE_BLOCK);
    expect(blocks[0].content).toBe('const a = 1;');
    expect(blocks[0].language).toBe('typescript');
  });

  it('should parse chat dialogues correctly', () => {
    const input = [
      'User: Hello',
      'AI: Hi there'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: BlockType.CHAT_USER, content: 'Hello' });
    expect(blocks[1]).toEqual({ type: BlockType.CHAT_AI, content: 'Hi there' });
  });

  it('should parse callouts correctly', () => {
    const input = [
      '> [!TIP]',
      '> This is a tip.'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: BlockType.CALLOUT_TIP, content: 'This is a tip.' });
  });

  it('should parse tables correctly', () => {
    const input = [
      '| Header 1 | Header 2 |',
      '| -------- | -------- |',
      '| Cell 1   | Cell 2   |'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.TABLE);
    expect(blocks[0].tableRows).toEqual([
      ['Header 1', 'Header 2'],
      ['Cell 1', 'Cell 2']
    ]);
  });
  
  it('should parse manual TOC correctly', () => {
    const input = [
      '[TOC]',
      '- Chapter 1 1',
      '- Chapter 2 5'
    ].join('\n');
    const blocks = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.TOC);
    expect(blocks[0].content).toContain('Chapter 1 1');
    expect(blocks[0].content).toContain('Chapter 2 5');
  });
});