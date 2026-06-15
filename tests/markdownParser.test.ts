import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../services/markdownParser';
import { BlockType } from '../services/types';

describe('markdownParser', () => {
  it('should parse frontmatter correctly', () => {
    const input = [
      '---',
      'title: My Book',
      'author: Eric',
      '---',
      '# Heading 1'
    ].join('\n');
    const { blocks, meta } = parseMarkdown(input);
    expect(meta.title).toBe('My Book');
    expect(meta.author).toBe('Eric');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toBe('Heading 1');
  });

  it('should parse headers correctly', () => {
    const input = [
      '# Heading 1',
      '## Heading 2',
      '### Heading 3'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ type: BlockType.HEADING_1, content: 'Heading 1' });
    expect(blocks[1]).toMatchObject({ type: BlockType.HEADING_2, content: 'Heading 2' });
    expect(blocks[2]).toMatchObject({ type: BlockType.HEADING_3, content: 'Heading 3' });
  });

  it('should parse paragraphs correctly', () => {
    const input = [
      'Paragraph 1',
      '',
      'Paragraph 2'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: BlockType.PARAGRAPH, content: 'Paragraph 1' });
    expect(blocks[1]).toMatchObject({ type: BlockType.PARAGRAPH, content: 'Paragraph 2' });
  });

  it('should parse code blocks correctly', () => {
    const input = [
      '```typescript',
      'const a = 1;',
      '```'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.CODE_BLOCK);
    expect(blocks[0].content).toBe('const a = 1;');
    expect(blocks[0].metadata?.language).toBe('typescript');
  });

  it('should parse code block metadata (line numbers)', () => {
    const input = [
      '```ts:ln',
      'line 1',
      '```',
      '```js:no-ln',
      'line 2',
      '```'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    
    expect(blocks[0].metadata?.showLineNumbers).toBe(true);
    expect(blocks[0].metadata?.language).toBe('ts');
    
    expect(blocks[1].metadata?.showLineNumbers).toBe(false);
    expect(blocks[1].metadata?.language).toBe('js');
  });

  it('should parse custom chat dialogues correctly', () => {
    const input = [
      'Gemini ":: Left message', 
      'User ::" Right message',
      'System :": Center message'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(3);
    
    expect(blocks[0].type).toBe(BlockType.CHAT_CUSTOM);
    expect(blocks[0].role).toBe('Gemini');
    expect(blocks[0].content).toBe('Left message'); 
    expect(blocks[0].alignment).toBe('left'); 

    expect(blocks[1].type).toBe(BlockType.CHAT_CUSTOM);
    expect(blocks[1].role).toBe('User');
    expect(blocks[1].content).toBe('Right message');
    expect(blocks[1].alignment).toBe('right');

    expect(blocks[2].type).toBe(BlockType.CHAT_CUSTOM);
    expect(blocks[2].role).toBe('System');
    expect(blocks[2].content).toBe('Center message');
    expect(blocks[2].alignment).toBe('center');
  });

  it('should parse callouts correctly', () => {
    const input = [
      '> [!TIP]',
      '> This is a tip.'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.CALLOUT_TIP);
    expect(blocks[0].content).toBe('This is a tip.');
  });

  it('should parse tables correctly', () => {
    const input = [
      '| Header 1 | Header 2 |',
      '| -------- | -------- |',
      '| Cell 1   | Cell 2   |'
    ].join('\n');
    const { blocks } = parseMarkdown(input);
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
    const { blocks } = parseMarkdown(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe(BlockType.TOC);
    expect(blocks[0].content).toContain('Chapter 1 1');
    expect(blocks[0].content).toContain('Chapter 2 5');
  });

  it('should parse a full MD2DOC manuscript fixture', () => {
    const input = [
      '---',
      'title: 技術書稿',
      'author: Eric',
      'header: true',
      'footer: true',
      '---',
      '[TOC]',
      '- 第一章 1',
      '',
      '# 技術書稿',
      '## 第一章',
      '### 安裝',
      '> [!NOTE]',
      '> 請先確認 Node.js 版本。',
      '',
      '```ts:ln',
      'const version = "1.4.0";',
      '```',
      '',
      '```json:no-ln',
      '{"name":"md2doc"}',
      '```',
      '',
      'User ":: 我該如何匯出？',
      'AI ::" 點擊【匯出 DOCX】。',
      'System :": 匯出完成',
      '',
      '| 欄位 | 說明 |',
      '| :--- | :--- |',
      '| title | 文件標題 |',
    ].join('\n');

    const { blocks, meta } = parseMarkdown(input);

    expect(meta).toMatchObject({
      title: '技術書稿',
      author: 'Eric',
      header: true,
      footer: true,
    });
    expect(blocks.map((block) => block.type)).toEqual([
      BlockType.TOC,
      BlockType.HEADING_1,
      BlockType.HEADING_2,
      BlockType.HEADING_3,
      BlockType.CALLOUT_NOTE,
      BlockType.CODE_BLOCK,
      BlockType.CODE_BLOCK,
      BlockType.CHAT_CUSTOM,
      BlockType.CHAT_CUSTOM,
      BlockType.CHAT_CUSTOM,
      BlockType.TABLE,
    ]);
    expect(blocks[5].metadata).toMatchObject({ language: 'ts', showLineNumbers: true });
    expect(blocks[6].metadata).toMatchObject({ language: 'json', showLineNumbers: false });
    expect(blocks[7]).toMatchObject({ role: 'User', alignment: 'left' });
    expect(blocks[8]).toMatchObject({ role: 'AI', alignment: 'right' });
    expect(blocks[9]).toMatchObject({ role: 'System', alignment: 'center' });
    expect(blocks[10].tableRows).toEqual([
      ['欄位', '說明'],
      ['title', '文件標題'],
    ]);
  });
});
