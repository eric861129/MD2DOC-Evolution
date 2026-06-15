/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { FileDown, Keyboard, Upload } from 'lucide-react';
import { UI_THEME } from '../../constants/theme';
import { useEditor } from '../../contexts/EditorContext';
import { useSlashCommand } from '../../hooks/editor/useSlashCommand';
import { SlashCommandMenu } from './slash-command/SlashCommandMenu';

interface EditorPaneProps {
  content: string;
  setContent: (content: string) => void;
  wordCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onScroll: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  content,
  setContent,
  wordCount,
  textareaRef,
  onScroll,
}) => {
  const { registerImage, t } = useEditor();
  const [editorScrollTop, setEditorScrollTop] = React.useState(0);
  const lineNumbers = React.useMemo(
    () => Array.from({ length: Math.max(content.split(/\r\n|\r|\n/).length, 1) }, (_, index) => index + 1),
    [content]
  );

  const {
    isOpen,
    position,
    filteredCommands,
    selectedIndex,
    handleKeyDown: handleSlashKeyDown,
    handleChange: handleSlashChange,
    insertCommand,
    closeMenu,
  } = useSlashCommand({ content, setContent, textareaRef });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleSlashKeyDown(e);
    if (e.defaultPrevented) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);

      window.setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleSlashChange(e);
    setContent(e.target.value);
  };

  const handleEditorScroll = () => {
    if (textareaRef.current) {
      setEditorScrollTop(textareaRef.current.scrollTop);
    }
    onScroll();
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    const mdFile = files.find((file) =>
      file.name.toLowerCase().endsWith('.md') ||
      file.type === 'text/markdown' ||
      file.type === 'text/x-markdown'
    );

    if (mdFile) {
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(mdFile);
      });
      setContent(text);
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    let insertedText = '';

    for (const file of imageFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      registerImage(imageId, base64);
      insertedText += `\n![${file.name}](${imageId})\n`;
    }

    setContent(content.substring(0, start) + insertedText + content.substring(end));
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <section className="workspace-panel relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md">
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-white">{t('workspace.editor')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('workspace.source')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="hidden items-center gap-1.5 md:flex">
            <Keyboard className="h-3.5 w-3.5" />
            Slash command
          </span>
          <span>{wordCount.toLocaleString()} {t('workspace.words')}</span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {content.trim().length === 0 && (
          <div className="pointer-events-none absolute left-16 right-8 top-8 z-10 max-w-md rounded-md border border-dashed border-slate-300 bg-white/80 p-5 text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300 md:left-24">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-product-glow text-product-primary">
              <Upload className="h-5 w-5" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">{t('workspace.emptyTitle')}</p>
            <p className="mt-2 text-sm leading-6">{t('workspace.emptyDescription')}</p>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 overflow-hidden border-r border-slate-200/70 bg-white/45 dark:border-slate-800 dark:bg-slate-950/20 md:w-16"
        >
          <div
            className="py-5 text-right font-mono text-xs leading-6 text-slate-400 dark:text-slate-600 md:py-8"
            style={{ transform: `translateY(-${editorScrollTop}px)` }}
          >
            {lineNumbers.map((lineNumber) => (
              <div key={lineNumber} className="h-6 pr-2 tabular-nums md:pr-3">
                {lineNumber}
              </div>
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          onScroll={handleEditorScroll}
          className="selection-product h-full w-full resize-none overflow-auto bg-transparent py-5 pl-14 pr-5 text-base leading-6 text-slate-800 caret-[var(--product-primary)] outline-none dark:text-slate-200 md:py-8 md:pl-[4.5rem] md:pr-8"
          style={{ fontFamily: UI_THEME.FONTS.PREVIEW }}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          spellCheck={false}
          wrap="off"
          placeholder="在此輸入 Markdown 書稿..."
        />

        <SlashCommandMenu
          isOpen={isOpen}
          position={position}
          items={filteredCommands}
          selectedIndex={selectedIndex}
          onSelect={insertCommand}
          onClose={closeMenu}
        />
      </div>

      <div className="hidden items-center justify-between border-t border-slate-200/70 bg-white/50 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-400 md:flex">
        <span>Tab inserts two spaces</span>
        <span className="flex items-center gap-1.5">
          <FileDown className="h-3.5 w-3.5" />
          Drag .md or images into the editor
        </span>
      </div>
    </section>
  );
};
