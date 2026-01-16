/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { 
  Heading1,
  Heading2,
  Heading3,
  Code, 
  BarChart, 
  Info, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  Table as TableIcon, 
  ListOrdered,
} from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';
import { IconButton } from '../ui/IconButton';

export const QuickActionSidebar: React.FC = () => {
  const { setContent, content, textareaRef } = useEditor();

  const insertTemplate = (template: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const savedScrollTop = textarea.scrollTop; // 記錄捲軸位置
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const newContent = before + template + after;
    setContent(newContent);

    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = savedScrollTop; // 還原捲軸位置
      
      // Determine cursor placement logic
      if (template.includes('這裡輸入')) {
        const placeholder = '這裡輸入';
        const offset = template.indexOf(placeholder);
        textarea.selectionStart = start + offset;
        textarea.selectionEnd = start + offset + placeholder.length;
      } else if (template.includes('// 程式碼貼在這裡')) {
        const placeholder = '// 程式碼貼在這裡';
        const offset = template.indexOf(placeholder);
        textarea.selectionStart = start + offset;
        textarea.selectionEnd = start + offset + placeholder.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + template.length;
      }
    }, 0);
  };

  const actions = [
    { icon: <Heading1 className="w-4 h-4" />, label: 'H1', template: '# ', title: '大標題' },
    { icon: <Heading2 className="w-4 h-4" />, label: 'H2', template: '## ', title: '中標題' },
    { icon: <Heading3 className="w-4 h-4" />, label: 'H3', template: '### ', title: '小標題' },
    { divider: true },
    { icon: <Code className="w-4 h-4" />, label: 'Code', template: '\n```javascript:ln\n// 程式碼貼在這裡\n```\n', title: '程式碼區塊' },
    { icon: <BarChart className="w-4 h-4" />, label: 'Mermaid', template: '\n```mermaid\ngraph TD;\n  A-->B;\n```\n', title: 'Mermaid 圖表' },
    { divider: true },
    { icon: <Info className="w-4 h-4" />, label: 'Tip', template: '\n> [!TIP]\n> 這裡輸入提示內容\n', title: '提示區塊' },
    { icon: <FileText className="w-4 h-4" />, label: 'Note', template: '\n> [!NOTE]\n> 這裡輸入筆記內容\n', title: '筆記區塊' },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Warning', template: '\n> [!WARNING]\n> 這裡輸入警告內容\n', title: '警告區塊' },
    { divider: true },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Chat L', template: 'User ":: 這裡輸入對話內容', title: '對話 (左)' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Chat R', template: 'AI ::" 這裡輸入對話內容', title: '對話 (右)' },
    { divider: true },
    { icon: <TableIcon className="w-4 h-4" />, label: 'Table', template: '\n| 標題1 | 標題2 |\n| :--- | :--- |\n| 內容1 | 內容2 |\n', title: '表格' },
    { icon: <ListOrdered className="w-4 h-4" />, label: 'TOC', template: '[TOC]', title: '插入目錄' },
  ];

  return (
    <aside className="w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-2 transition-colors overflow-y-auto shrink-0">
      {actions.map((action, index) => {
        if (action.divider) {
          return <div key={index} className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />;
        }
        return (
          <IconButton
            key={index}
            onClick={() => insertTemplate(action.template!)}
            title={action.title}
            className="w-10 h-10 hover:scale-110 active:scale-95 transition-transform"
          >
            {action.icon}
          </IconButton>
        );
      })}
    </aside>
  );
};
