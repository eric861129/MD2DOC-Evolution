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

    await generateDocx(blocks);

    expect(Packer.toBlob).toHaveBeenCalledTimes(1);
    const doc = vi.mocked(Packer.toBlob).mock.calls[0][0];
    
    // We can't easily snapshot the whole Document instance as it might be huge and contain internal state.
    // Instead, we can verify that the structure passed to Document constructor was correct.
    // But since we didn't mock Document, we have the real instance.
    // We can try to serialize it or check specific properties if they are public.
    // docx `Document` usually has public properties mirroring the input options or a `root` array.
    
    // Attempt to snapshot the JSON representation if possible
    expect(JSON.stringify(doc, null, 2)).toMatchSnapshot();
    
    vi.useRealTimers();
  });
});
