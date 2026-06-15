/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { getQuickActions } from './editorCommands';

export const QuickActionSidebar: React.FC = () => {
  const { setContent, content, textareaRef } = useEditor();
  const actions = getQuickActions();

  const insertTemplate = (template: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const savedScrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const needsLineBreakBefore = before.length > 0 && !before.endsWith('\n');
    const needsLineBreakAfter = after.length > 0 && !template.endsWith('\n');
    const insertion = `${needsLineBreakBefore ? '\n' : ''}${template}${needsLineBreakAfter ? '\n' : ''}`;

    setContent(before + insertion + after);

    window.setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = savedScrollTop;

      const placeholder = ['這裡輸入', '程式碼貼在這裡', '書稿標題'].find((target) =>
        insertion.includes(target)
      );

      if (placeholder) {
        const offset = insertion.indexOf(placeholder);
        textarea.selectionStart = start + offset;
        textarea.selectionEnd = start + offset + placeholder.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      }
    }, 0);
  };

  return (
    <aside className="workspace-panel relative z-30 hidden w-[4.5rem] shrink-0 flex-col items-center gap-2 rounded-md p-2 lg:flex">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const previous = actions[index - 1];
        const showDivider = previous && previous.group !== action.group;

        return (
          <React.Fragment key={action.id}>
            {showDivider && <div className="my-1 h-px w-8 bg-slate-200 dark:bg-slate-800" />}
            <button
              type="button"
              onClick={() => insertTemplate(action.insertText)}
              className="tool-tip group flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:text-product-primary hover:shadow-lg active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              data-tooltip={action.description || action.label}
              aria-label={action.description || action.label}
            >
              <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </button>
          </React.Fragment>
        );
      })}
    </aside>
  );
};
