import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import saveAs from 'file-saver';
import { ParsedBlock, DocumentMeta } from '../services/types';
import { validateExport, ValidationIssue } from '../services/exportValidation';
import { DEFAULT_EXPORT_SETTINGS } from '../services/docx/layout/presets';
import { resolvePageLayout } from '../services/docx/layout/resolve';
import type { ExportSettings } from '../services/docx/layout/types';

interface UseDocxExportProps {
  content: string;
  parsedBlocks: ParsedBlock[];
  documentMeta: DocumentMeta;
  imageRegistry: Record<string, string>;
  initialExportSettings?: ExportSettings;
}

interface AppliedExportSettings {
  settings: ExportSettings;
  layout: ReturnType<typeof resolvePageLayout>;
}

interface InitialAppliedExportSettings {
  applied: AppliedExportSettings;
  error: string | null;
}

const getLayoutErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '未知的版面設定錯誤';

const resolveAppliedExportSettings = (
  settings: ExportSettings,
): AppliedExportSettings => ({
  settings,
  layout: resolvePageLayout(settings),
});

const resolveInitialAppliedExportSettings = (
  settings: ExportSettings,
): InitialAppliedExportSettings => {
  try {
    return {
      applied: resolveAppliedExportSettings(settings),
      error: null,
    };
  } catch (error) {
    return {
      applied: resolveAppliedExportSettings(DEFAULT_EXPORT_SETTINGS),
      error: `版面設定無效：${getLayoutErrorMessage(error)}；已改用預設版面`,
    };
  }
};

export const useDocxExport = ({
  content,
  parsedBlocks,
  documentMeta,
  imageRegistry,
  initialExportSettings = DEFAULT_EXPORT_SETTINGS,
}: UseDocxExportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidatingExport, setIsValidatingExport] = useState(false);
  const [initialApplied] = useState(
    () => resolveInitialAppliedExportSettings(initialExportSettings),
  );
  const [exportError, setExportError] = useState<string | null>(
    initialApplied.error,
  );
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidationIssues, setShowValidationIssues] = useState(false);
  const [appliedExportSettings, setAppliedExportSettings] = useState(
    initialApplied.applied,
  );
  const appliedExportSettingsRef = useRef(initialApplied.applied);
  const exportSettings = appliedExportSettings.settings;
  const resolvedPageLayout = appliedExportSettings.layout;

  const setExportSettings = useCallback<Dispatch<SetStateAction<ExportSettings>>>(
    (update) => {
      const currentSettings = appliedExportSettingsRef.current.settings;

      try {
        const candidate = typeof update === 'function'
          ? update(currentSettings)
          : update;
        const nextAppliedSettings = resolveAppliedExportSettings(candidate);
        appliedExportSettingsRef.current = nextAppliedSettings;
        setAppliedExportSettings(nextAppliedSettings);
        setExportError(null);
      } catch (error) {
        setExportError(`版面設定無效：${getLayoutErrorMessage(error)}`);
      }
    },
    [],
  );

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
      const blob = await generateDocx(parsedBlocks, {
        exportSettings: appliedExportSettingsRef.current.settings,
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
    exportSettings,
    setExportSettings,
    resolvedPageLayout,
    handleDownload,
    handleExportMarkdown,
  };
};
