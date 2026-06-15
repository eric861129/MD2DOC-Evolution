import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: '"Microsoft JhengHei", "PingFang TC", sans-serif',
    fontSize: '16px',
    primaryColor: '#F8F5EF',
    primaryTextColor: '#1F2933',
    primaryBorderColor: '#345A70',
    lineColor: '#345A70',
    secondaryColor: '#EFE7DA',
    tertiaryColor: '#FFFFFF',
  },
  themeCSS: `
    .node label { font-weight: 700 !important; }
    .label { font-weight: 700 !important; }
    .mermaid .label { font-weight: 700 !important; }
  `,
  securityLevel: 'loose',
});

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const result = await mermaid.render(id, chart);
        setSvg(result.svg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        setError('Mermaid 圖表渲染失敗，請確認語法。');
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart]);

  return (
    <div className="my-10 flex flex-col items-center">
      {error ? (
        <div className="w-full rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-bold">Mermaid error</p>
          <pre className="mt-1 whitespace-pre-wrap text-xs">{error}</pre>
          <pre className="mt-3 w-full overflow-x-auto rounded bg-white/70 p-3 text-xs text-red-900">
            {chart}
          </pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex w-full justify-center overflow-x-auto rounded-md border border-slate-200 bg-white p-5 shadow-sm"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
};

export default MermaidRenderer;
