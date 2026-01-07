import { Paragraph, ImageRun, TextRun, AlignmentType } from "docx";
import mermaid from "mermaid";
import { DocxConfig } from "../types";

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
      // Scale for print quality (3x is standard for ~300DPI feel)
      const scale = 3; 
      
      // Ensure even dimensions to avoid compression artifacts
      let canvasWidth = Math.ceil(originalWidth * scale);
      let canvasHeight = Math.ceil(originalHeight * scale);
      if (canvasWidth % 2 !== 0) canvasWidth++;
      if (canvasHeight % 2 !== 0) canvasHeight++;

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

export const createMermaidBlock = async (chart: string, config: DocxConfig): Promise<Paragraph> => {
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
      flowchart: { useMaxWidth: false, htmlLabels: true },
    });

    const id = `mermaid-docx-${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Render SVG
    const { svg } = await mermaid.render(id, chart);

    // 2. Get precise dimensions from SVG string directly
    const { width: svgWidth, height: svgHeight } = getSvgDimensions(svg);

    // 3. Convert to PNG Uint8Array
    const { buffer, width: pxWidth, height: pxHeight } = await svgToPng(svg, svgWidth, svgHeight);

    // 4. Calculate Word dimensions
    const MAX_WIDTH_PX = 550; 
    
    let finalDisplayWidth = pxWidth / 3; 
    let finalDisplayHeight = pxHeight / 3;

    // Constrain width
    if (finalDisplayWidth > MAX_WIDTH_PX) {
        const ratio = MAX_WIDTH_PX / finalDisplayWidth;
        finalDisplayWidth = MAX_WIDTH_PX;
        finalDisplayHeight = finalDisplayHeight * ratio;
    }

    return new Paragraph({
      children: [
        new ImageRun({
          data: buffer,
          transformation: {
            width: Math.round(finalDisplayWidth),
            height: Math.round(finalDisplayHeight),
          },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
    });

  } catch (error) {
    console.warn("Mermaid generation failed for DOCX", error);
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
};