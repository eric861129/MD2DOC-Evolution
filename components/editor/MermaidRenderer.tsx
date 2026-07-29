import React, { useEffect, useState } from 'react';

let mermaidPromise: Promise<any> | null = null;
let domPurifyPromise: Promise<any> | null = null;
let mermaidInitialized = false;

const sanitizeMermaidSvg = async (svg: string): Promise<string> => {
  if (!domPurifyPromise) {
    domPurifyPromise = import('dompurify').then((module) => module.default);
  }

  const domPurify = await domPurifyPromise;
  return domPurify.sanitize(svg, {
    USE_PROFILES: {
      html: true,
      svg: true,
      svgFilters: true,
    },
  });
};

const loadMermaid = async () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((module) => module.default);
  }

  const mermaid = await mermaidPromise;

  if (!mermaidInitialized) {
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
      securityLevel: 'strict',
    });
    mermaidInitialized = true;
  }

  return mermaid;
};

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const renderChart = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const mermaid = await loadMermaid();
        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const result = await mermaid.render(id, chart);
        const safeSvg = await sanitizeMermaidSvg(result.svg);
        if (isActive) {
          setSvg(safeSvg);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        if (isActive) {
          setError('Mermaid 圖表渲染失敗，請確認語法。');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isActive = false;
    };
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
        <div className="flex w-full justify-center overflow-x-auto rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {isLoading && !svg ? (
            <span>Loading Mermaid...</span>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          )}
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer;
