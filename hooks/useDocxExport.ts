import { useEffect, useState } from 'react';
import saveAs from 'file-saver';
import { ParsedBlock, DocumentMeta } from '../services/types';
import { PAGE_SIZES } from '../constants/meta';
import { validateExport, ValidationIssue } from '../services/exportValidation';

interface UseDocxExportProps {
  content: string;
  parsedBlocks: ParsedBlock[];
  documentMeta: DocumentMeta;
  imageRegistry: Record<string, string>;
}

export const useDocxExport = ({
  content,
  parsedBlocks,
  documentMeta,
  imageRegistry,
}: UseDocxExportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidatingExport, setIsValidatingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidationIssues, setShowValidationIssues] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const runExportValidation = async (revealIssues = false) => {
    if (parsedBlocks.length === 0) {
      setValidationIssues([]);
      setShowValidationIssues(false);
      return [];
    }

    setIsValidatingExport(true);
    const issues = await validateExport({
      content,
      blocks: parsedBlocks,
      meta: documentMeta,
      imageRegistry,
    });

    setValidationIssues(issues);
    if (issues.length === 0) {
      setShowValidationIssues(false);
    } else if (revealIssues) {
      setShowValidationIssues(true);
    }
    setIsValidatingExport(false);
    return issues;
  };

  useEffect(() => {
    let isActive = true;

    if (parsedBlocks.length === 0) {
      setValidationIssues([]);
      setShowValidationIssues(false);
      setIsValidatingExport(false);
      return () => {
        isActive = false;
      };
    }

    const timer = window.setTimeout(async () => {
      setIsValidatingExport(true);
      const issues = await validateExport({
        content,
        blocks: parsedBlocks,
        meta: documentMeta,
        imageRegistry,
      });

      if (isActive) {
        setValidationIssues(issues);
        setIsValidatingExport(false);
        if (issues.length === 0) {
          setShowValidationIssues(false);
        }
      }
    }, 600);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [content, parsedBlocks, documentMeta, imageRegistry]);

  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    setExportError(null);
    try {
      await runExportValidation(true);
      const { generateDocx } = await import('../services/docxGenerator');
      const sizeConfig = PAGE_SIZES[selectedSizeIndex];
      const blob = await generateDocx(parsedBlocks, {
        widthCm: sizeConfig.width,
        heightCm: sizeConfig.height,
        showLineNumbers: true,
        meta: documentMeta,
        imageRegistry,
      });

      const safeTitle = documentMeta.title
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_')
        : 'Professional_Manuscript';

      saveAs(blob, `${safeTitle}.docx`);
    } catch (error) {
      console.error('Word Generation Failed:', error);
      setExportError('DOCX 匯出失敗，請檢查 Markdown、Mermaid 或圖片內容是否有效。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!content) return;
    setExportError(null);
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });

      const safeTitle = documentMeta.title
        ? documentMeta.title.replace(/[\\/:*?"<>|]/g, '_')
        : 'manuscript';

      saveAs(blob, `${safeTitle}.md`);
    } catch (error) {
      console.error('Markdown Export Failed:', error);
      setExportError('Markdown 匯出失敗，請確認瀏覽器是否允許下載檔案。');
    }
  };

  return {
    isGenerating,
    isValidatingExport,
    exportError,
    clearExportError: () => setExportError(null),
    validationIssues,
    showValidationIssues,
    setShowValidationIssues,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    pageSizes: PAGE_SIZES,
  };
};
