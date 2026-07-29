import { describe, expect, it } from 'vitest';
import { resolveMermaidCanvasDimensions } from '../../services/docx/builders/mermaid';

describe('Mermaid DOCX 資源限制', () => {
  it('正常圖表維持三倍列印尺寸', () => {
    expect(resolveMermaidCanvasDimensions(800, 600)).toEqual({
      width: 2400,
      height: 1800,
    });
  });

  it('拒絕超過 Canvas 像素上限的圖表', () => {
    expect(() => resolveMermaidCanvasDimensions(6000, 6000))
      .toThrow('Mermaid 圖表尺寸過大');
  });
});
