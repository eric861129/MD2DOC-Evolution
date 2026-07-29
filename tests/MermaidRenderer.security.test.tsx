import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MermaidRenderer from '../components/editor/MermaidRenderer';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onload="alert(2)" width="10" height="10" /></svg>',
    }),
  },
}));

describe('Mermaid 預覽安全邊界', () => {
  it('插入預覽 DOM 前移除 script 與事件處理器', async () => {
    const { container } = render(<MermaidRenderer chart="graph TD; A-->B" />);

    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onload]')).toBeNull();
  });
});
