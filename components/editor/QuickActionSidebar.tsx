/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { createEditorInsertion } from '../../utils/editor/insertTemplate';
import { getQuickActionGroups } from './editorCommands';

export const QuickActionSidebar: React.FC = () => {
  const { setContent, content, textareaRef } = useEditor();
  const groups = getQuickActionGroups();

  const insertTemplate = (template: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const savedScrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertion = createEditorInsertion(content, template, start, end);
    setContent(insertion.content);

    window.setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = savedScrollTop;

      const placeholder = ['這裡輸入', '程式碼貼在這裡', '書稿標題'].find((target) =>
        insertion.insertedText.includes(target)
      );

      if (placeholder) {
        const offset = insertion.insertedText.indexOf(placeholder);
        textarea.selectionStart = start + offset;
        textarea.selectionEnd = start + offset + placeholder.length;
      } else {
        textarea.selectionStart = insertion.selectionStart;
        textarea.selectionEnd = insertion.selectionEnd;
      }
    }, 0);
  };

  return (
    <aside className="workspace-panel relative z-30 hidden w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-md p-2 lg:flex">
      {groups.map((group) => {
        const GroupIcon = group.icon;

        return (
          <details key={group.id} className="group/tool relative">
            <summary
              className="tool-tip flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:text-product-primary hover:shadow-lg active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 [&::-webkit-details-marker]:hidden"
              data-tooltip={group.label}
              aria-label={group.label}
            >
              <GroupIcon className="h-4 w-4 transition-transform duration-300 group-hover/tool:scale-110" />
            </summary>
            <div className="absolute left-[3.25rem] top-0 z-50 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {group.label}
              </p>
              {group.actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={(event) => {
                      insertTemplate(action.insertText);
                      event.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-product-primary" />
                    {action.description || action.label}
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </aside>
  );
};
