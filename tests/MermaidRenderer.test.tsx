import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));

const chart = 'flowchart LR\n A[校準鏡頭] --> B[記錄星點]\n B --> C[繪製星圖]\n C --> D[發布摘要]';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  let htmlLabels = true;

  mermaidMock.initialize.mockImplementation((config: { htmlLabels?: boolean }) => {
    htmlLabels = config.htmlLabels !== false;
  });
  mermaidMock.render.mockImplementation(async (id: string, source: string) => {
    const labels = [...source.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
    const labelMarkup = (label: string) => htmlLabels
      ? `<foreignObject width="120" height="40"><div xmlns="http://www.w3.org/1999/xhtml">${label}</div></foreignObject>`
      : `<text><tspan>${label}</tspan></text>`;

    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" onload="alert(1)">
        <script>alert(1)</script>
        ${labels.map((label) => `<g class="node">${labelMarkup(label)}</g>`).join('')}
        <g class="edgeLabel">${labelMarkup('確認完成')}</g>
        <a href="javascript:alert(1)">不安全連結</a>
      </svg>`,
    };
  });
});

afterEach(cleanup);

describe('Mermaid 預覽文字', () => {
  it('安全清理後保留中文節點與連線文字，並移除可執行內容', async () => {
    const { default: MermaidRenderer } = await import('../components/editor/MermaidRenderer');
    const { container } = render(<MermaidRenderer chart={chart} />);

    expect(await screen.findByText('校準鏡頭')).toBeVisible();
    for (const label of ['記錄星點', '繪製星圖', '發布摘要', '確認完成']) {
      expect(screen.getByText(label)).toBeVisible();
    }
    expect(container.querySelector('foreignObject')).toBeNull();
    expect(container.querySelector('script, [onload], [href^="javascript:"]')).toBeNull();
  });

  it('Word 匯出重設共用設定後，編輯圖表仍能保留預覽文字', async () => {
    const { default: MermaidRenderer } = await import('../components/editor/MermaidRenderer');
    const { rerender } = render(<MermaidRenderer chart={chart} />);
    expect(await screen.findByText('校準鏡頭')).toBeVisible();

    mermaidMock.initialize({ htmlLabels: true });
    rerender(<MermaidRenderer chart={chart.replace('校準鏡頭', '重新校準')} />);

    expect(await screen.findByText('重新校準')).toBeVisible();
    expect(screen.getByText('發布摘要')).toBeVisible();
  });
});
