import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: '"Microsoft JhengHei", "Heiti TC", sans-serif',
    fontSize: '16px',
    primaryColor: '#F9F9F9',          // Even lighter Gray background
    primaryTextColor: '#000000',      // Pure black text
    primaryBorderColor: '#333333',    // Darker border for contrast
    lineColor: '#333333',             // Lines
    secondaryColor: '#EEEEEE',        // Secondary nodes
    tertiaryColor: '#FFFFFF',         // Background
  },
  themeCSS: `
    .node label { font-weight: bold !important; }
    .label { font-weight: bold !important; }
    .mermaid .label { font-weight: bold !important; }
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
        // Generate a unique ID for this chart instance
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        setError('Failed to render Mermaid chart. Please check syntax.');
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart]);

  return (
    <div className="my-4 flex flex-col items-center">
      {error ? (
        <div className="w-full p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          <p className="font-bold text-sm">Mermaid Error:</p>
          <pre className="text-xs mt-1 whitespace-pre-wrap">{error}</pre>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded text-gray-500 overflow-x-auto w-full">
            {chart}
          </pre>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="w-full overflow-x-auto flex justify-center p-4 bg-white rounded border border-gray-100 shadow-sm"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
};

export default MermaidRenderer;
