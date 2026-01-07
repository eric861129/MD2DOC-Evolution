import { Paragraph, ImageRun, TextRun, AlignmentType } from "docx";
import mermaid from "mermaid";
import { DocxConfig } from "../types";

// Helper: Convert SVG string to PNG Uint8Array with dimensions
const svgToPng = (svg: string): Promise<{ buffer: Uint8Array; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svg64 = btoa(unescape(encodeURIComponent(svg)));
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // High resolution scale
      const scale = 3; 
      const width = img.width;
      const height = img.height;
      
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            resolve({ buffer: new Uint8Array(arrayBuffer), width, height });
        } else {
            reject(new Error("Canvas to Blob failed"));
        }
      }, 'image/png');
    };
    
    img.onerror = (e) => reject(e);
    
    img.src = image64;
  });
};

export const createMermaidBlock = async (chart: string, config: DocxConfig): Promise<Paragraph> => {
  try {
    // Ensure initialized
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
    });

    const id = `mermaid-docx-${Math.random().toString(36).substr(2, 9)}`;
    // Render SVG
    const { svg } = await mermaid.render(id, chart);

    // Convert to PNG Buffer
    const { buffer, width, height } = await svgToPng(svg);

    // Calculate dimensions for Word (max width ~500px to fit A5/B5 margins)
    const MAX_WIDTH = 550;
    let finalWidth = width;
    let finalHeight = height;

    if (finalWidth > MAX_WIDTH) {
        const ratio = MAX_WIDTH / finalWidth;
        finalWidth = MAX_WIDTH;
        finalHeight = height * ratio;
    }

    return new Paragraph({
      children: [
        new ImageRun({
          data: buffer,
          transformation: {
            width: Math.round(finalWidth),
            height: Math.round(finalHeight),
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