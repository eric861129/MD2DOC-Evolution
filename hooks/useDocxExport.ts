import { useState } from 'react';
import saveAs from 'file-saver';
import { generateDocx } from '../services/docxGenerator';
import { ParsedBlock, DocumentMeta } from '../services/types';
import { PAGE_SIZES } from '../constants/meta';

interface UseDocxExportProps {
  content: string;
  parsedBlocks: ParsedBlock[];
  documentMeta: DocumentMeta;
  imageRegistry: Record<string, string>;
}

export const useDocxExport = ({ content, parsedBlocks, documentMeta, imageRegistry }: UseDocxExportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  // DOCX Download
  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const sizeConfig = PAGE_SIZES[selectedSizeIndex];
      const blob = await generateDocx(parsedBlocks, { 
        widthCm: sizeConfig.width, 
        heightCm: sizeConfig.height,
        showLineNumbers: true, // Default to true for technical books
        meta: documentMeta,
        imageRegistry // Pass the registry here
      });
      
      const safeTitle = documentMeta.title 
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_') 
        : "Professional_Manuscript";
        
      saveAs(blob, `${safeTitle}.docx`);
    } catch (error) {
      console.error("Word Generation Failed:", error);
      alert("轉檔失敗，請確認內容格式是否正確。");
    } finally {
      setIsGenerating(false);
    }
  };

  // Markdown Export
  const handleExportMarkdown = () => {
    if (!content) return;
    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      
      const safeTitle = documentMeta.title 
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_') 
        : "manuscript";
        
      saveAs(blob, `${safeTitle}.md`);
    } catch (error) {
      console.error("Markdown Export Failed:", error);
      alert("匯出失敗");
    }
  };

  return {
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    pageSizes: PAGE_SIZES
  };
};
