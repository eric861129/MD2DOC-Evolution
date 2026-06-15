import { describe, it, expect, vi } from 'vitest';
import { generateDocx } from '../services/docxGenerator';
import { BlockType } from '../services/types';
import { Packer } from 'docx';

// Mock Packer to avoid actual generation and to capture the document
vi.mock('docx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('docx')>();
  return {
    ...actual,
    Packer: {
      toBlob: vi.fn().mockResolvedValue(new Blob(['mock-docx'])),
    },
  };
});

describe('docxGenerator', () => {
  it('should generate correct document structure for given blocks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));

    const blocks = [
      { type: BlockType.HEADING_1, content: 'Title' },
      { type: BlockType.PARAGRAPH, content: 'Hello world' },
      { type: BlockType.BULLET_LIST, content: 'Item 1' },
    ];

    await generateDocx(blocks, {
      widthCm: 17,
      heightCm: 23,
      meta: {
        title: '技術書稿',
        author: 'Eric',
        header: true,
        footer: true,
      },
    });

    expect(Packer.toBlob).toHaveBeenCalledTimes(1);
    const doc = vi.mocked(Packer.toBlob).mock.calls[0][0];

    const serialized = JSON.stringify(doc);
    expect(serialized).toContain('Title');
    expect(serialized).toContain('Hello world');
    expect(serialized).toContain('Item 1');
    expect(serialized).toContain('技術書稿');
    expect(serialized).toContain('Eric');
    expect(serialized).toContain('default-bullet');
    expect(serialized).toContain('Microsoft JhengHei');

    vi.useRealTimers();
  });
});
