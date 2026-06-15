import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readUtf8 = (path: string) => readFileSync(path, 'utf8');

describe('lazy bundle boundaries', () => {
  it('keeps the DOCX generator out of the initial export hook module graph', () => {
    const source = readUtf8('hooks/useDocxExport.ts');

    expect(source).not.toMatch(/import\s+\{\s*generateDocx\s*\}\s+from\s+['"]\.\.\/services\/docxGenerator['"]/);
    expect(source).toContain("import('../services/docxGenerator')");
  });

  it('loads Mermaid from preview and DOCX registry only when needed', () => {
    const previewRenderer = readUtf8('components/editor/MermaidRenderer.tsx');
    const docxRegistry = readUtf8('services/docx/builders/index.ts');

    expect(previewRenderer).not.toMatch(/import\s+mermaid\s+from\s+['"]mermaid['"]/);
    expect(previewRenderer).toContain("import('mermaid')");
    expect(docxRegistry).not.toMatch(/from\s+['"]\.\/mermaid['"]/);
    expect(docxRegistry).toContain('import("./mermaid")');
  });
});
