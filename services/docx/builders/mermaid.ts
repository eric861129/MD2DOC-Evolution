import { Paragraph, TextRun } from "docx";
import mermaid from "mermaid";
import { DocxConfig } from "../types";
import {
  createImageParagraph,
  resolveImageMediaBytes,
} from './image';

/**
 * Concurrency-limited Queue for Mermaid conversions
 * This ensures that when exporting many diagrams at once, 
 * we don't overwhelm the browser's Canvas/rendering engine.
 */
class MermaidQueue {
  private queue: (() => Promise<any>)[] = [];
  private activeCount = 0;
  private maxConcurrency = 2; // Limit to 2 concurrent conversions

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.next();
    });
  }

  private async next() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      this.activeCount++;
      try {
        await task();
      } finally {
        this.activeCount--;
        this.next();
      }
    }
  }
}

const mermaidQueue = new MermaidQueue();
const MERMAID_CANVAS_SCALE = 3;
const MAX_MERMAID_CANVAS_SIDE = 8192;
const MAX_MERMAID_CANVAS_PIXELS = 16_000_000;

/**
 * 計算列印用 Mermaid Canvas 尺寸，並拒絕可能耗盡瀏覽器資源的圖表。
 */
export const resolveMermaidCanvasDimensions = (
  originalWidth: number,
  originalHeight: number,
): { width: number; height: number } => {
  if (
    !Number.isFinite(originalWidth)
    || !Number.isFinite(originalHeight)
    || originalWidth <= 0
    || originalHeight <= 0
  ) {
    throw new Error('Mermaid 圖表尺寸無效。');
  }

  let width = Math.ceil(originalWidth * MERMAID_CANVAS_SCALE);
  let height = Math.ceil(originalHeight * MERMAID_CANVAS_SCALE);
  if (width % 2 !== 0) width++;
  if (height % 2 !== 0) height++;

  if (
    width > MAX_MERMAID_CANVAS_SIDE
    || height > MAX_MERMAID_CANVAS_SIDE
    || width * height > MAX_MERMAID_CANVAS_PIXELS
  ) {
    throw new Error(
      'Mermaid 圖表尺寸過大，請簡化圖表或拆分成多張圖。',
    );
  }

  return { width, height };
};

// Helper: Extract dimensions from SVG string
const getSvgDimensions = (svg: string): { width: number; height: number } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgEl = doc.documentElement;

  let width = parseFloat(svgEl.getAttribute("width") || "0");
  let height = parseFloat(svgEl.getAttribute("height") || "0");

  if (!width || !height) {
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/\s+|,/).filter(Boolean).map(parseFloat);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }
  }
  
  // Fallback if extraction fails
  return { width: width || 800, height: height || 600 };
};

// Helper: Convert SVG string to PNG Uint8Array
const svgToPng = (svg: string, originalWidth: number, originalHeight: number): Promise<{ buffer: Uint8Array; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Encode SVG safely
    const svg64 = btoa(unescape(encodeURIComponent(svg)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const {
        width: canvasWidth,
        height: canvasHeight,
      } = resolveMermaidCanvasDimensions(originalWidth, originalHeight);

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      
      // White background for Word
      ctx.fillStyle = '#FFFFFF'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image stretched to canvas size
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
            try {
                const arrayBuffer = await blob.arrayBuffer();
                resolve({ buffer: new Uint8Array(arrayBuffer), width: canvasWidth, height: canvasHeight });
            } catch (err) {
                reject(err);
            }
        } else {
            reject(new Error("Canvas to Blob failed"));
        }
      }, 'image/png');
    };
    
    img.onerror = (e) => reject(new Error("Failed to load SVG Image"));
    
    img.src = image64;
  });
};

export const createMermaidBlock = async (
  chart: string,
  config: DocxConfig,
  alt = 'Mermaid 圖表',
  title = 'Mermaid 圖表',
): Promise<Paragraph> => {
  return mermaidQueue.add(async () => {
    try {
      // Ensure initialized with grayscale theme and custom font
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
        securityLevel: 'strict',
        flowchart: { useMaxWidth: false, htmlLabels: true },
      });

      const id = `mermaid-docx-${Math.random().toString(36).substr(2, 9)}`;
      
      // 1. Render SVG
      const { svg } = await mermaid.render(id, chart);

      // 2. Get precise dimensions from SVG string directly
      const { width: svgWidth, height: svgHeight } = getSvgDimensions(svg);

      // 3. Convert to PNG Uint8Array
      const { buffer } = await svgToPng(svg, svgWidth, svgHeight);
      const media = resolveImageMediaBytes(buffer, 'image/png');

      return createImageParagraph({
        media,
        config,
        alt,
        title,
        spacing: { before: 400, after: 400 },
      });

    } catch (error) {
      config.reportWarning({
        code: 'MERMAID_GENERATION_FAILED',
        message: error instanceof Error
          ? `Mermaid 圖表產生失敗：${error.message}`
          : 'Mermaid 圖表產生失敗。',
      });
      return new Paragraph({
        children: [
          new TextRun({
            text: "[Mermaid Chart Error]",
            color: "FF0000",
            bold: true
          }),
          new TextRun({
              text: " (Syntax might be invalid)",
              size: 16,
              italics: true,
              color: "666666"
          })
        ],
        spacing: { before: 200, after: 200 }
      });
    }
  });
};
