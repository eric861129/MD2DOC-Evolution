/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';
import { Download, FileText, Sparkles, Settings2 } from 'lucide-react';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { BlockType, ParsedBlock } from '../types.ts';
import { parseInlineElements, InlineStyleType } from '../utils/styleParser.ts';
import { FONTS } from '../constants/theme.ts';

const MarkdownEditor: React.FC = () => {
  const {
    content,
    setContent,
    parsedBlocks,
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    wordCount,
    textareaRef,
    previewRef,
    handleScroll,
    handleDownload,
    pageSizes
  } = useMarkdownEditor();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // 在當前位置插入兩個空格
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      // 重新設定光標位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const renderPreviewContent = () => {
    const elements: JSX.Element[] = [];
    let i = 0;
    while (i < parsedBlocks.length) {
      const block = parsedBlocks[i];
      if (block.type === BlockType.BULLET_LIST) {
        const listItems: ParsedBlock[] = [];
        while (i < parsedBlocks.length && parsedBlocks[i].type === BlockType.BULLET_LIST) {
          listItems.push(parsedBlocks[i]);
          i++;
        }
        elements.push(
          <ul key={`bullet-list-${i}`} className="ml-8 mb-8">
            {listItems.map((item, idx) => (
              <li key={idx} className="relative mb-2 pl-4 leading-[1.8] list-none before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-2 before:h-2 before:bg-slate-400 before:rounded-full">
                 <RenderRichText text={item.content} />
              </li>
            ))}
          </ul>
        );
      } else if (block.type === BlockType.NUMBERED_LIST) {
        const listItems: ParsedBlock[] = [];
        while (i < parsedBlocks.length && parsedBlocks[i].type === BlockType.NUMBERED_LIST) {
          listItems.push(parsedBlocks[i]);
          i++;
        }
        elements.push(
          <ol key={`numbered-list-${i}`} className="ml-8 mb-8 list-decimal">
            {listItems.map((item, idx) => (
              <li key={idx} className="mb-2 pl-2 leading-[1.8] text-slate-800">
                 <RenderRichText text={item.content} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(<PreviewBlock key={i} block={block} />);
        i++;
      }
    }
    return elements;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-xl">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">BookPublisher <span className="text-slate-400 font-normal">MD2Docx</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">核心引擎：Markdown -&gt; Word (v2.0)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 版面尺寸選擇器 */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <select 
              value={selectedSizeIndex}
              onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {pageSizes.map((size, index) => (
                <option key={index} value={index}>
                  {size.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={isGenerating || parsedBlocks.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300"
          >
            {isGenerating ? '正在轉換...' : '匯出 Word'}
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manuscript Editor (Draft)</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {wordCount} Words
            </span>
          </div>
          <textarea
            ref={textareaRef}
            onScroll={handleScroll}
            className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 selection:bg-indigo-100"
            style={{ fontFamily: `"${FONTS.LATIN}", "${FONTS.CJK}", sans-serif` }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="在此輸入您的 Markdown 稿件..."
          />
        </div>

        <div className="w-1/2 flex flex-col bg-slate-100/50">
          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Print Layout Preview (WYSIWYG)
          </div>
          <div 
            ref={previewRef}
            className="flex-1 overflow-y-auto p-12 lg:p-16 scroll-smooth"
          >
            <div 
              className="max-w-2xl mx-auto bg-white shadow-2xl p-16 lg:p-20 min-h-screen text-slate-900 rounded-sm border border-slate-200"
              style={{ fontFamily: `"${FONTS.LATIN}", "${FONTS.CJK}", sans-serif` }}
            >
              {parsedBlocks.length > 0 ? (
                renderPreviewContent()
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 mt-20 opacity-30">
                  <Sparkles className="w-12 h-12 mb-4" />
                  <p className="font-bold tracking-widest">等待輸入內容...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const RenderRichText: React.FC<{ text: string }> = ({ text }) => {
  const segments = parseInlineElements(text);
  
  return (
    <>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case InlineStyleType.BOLD:
            return <strong key={i} className="font-bold text-slate-900">{segment.content}</strong>;
          case InlineStyleType.ITALIC:
            return <span key={i} className="italic text-blue-800">{segment.content}</span>;
          case InlineStyleType.UNDERLINE:
            return <span key={i} className="underline decoration-blue-500 text-blue-600 decoration-1 underline-offset-2">{segment.content}</span>;
          case InlineStyleType.CODE:
            return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-slate-700 border border-slate-200">{segment.content}</code>;
          case InlineStyleType.UI_BUTTON:
            return (
              <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 text-[0.8rem] font-bold bg-slate-200 border border-slate-400 rounded text-slate-800 shadow-[1px_1px_0_0_#94a3b8]">
                {segment.content}
              </span>
            );
          case InlineStyleType.SHORTCUT:
            return (
              <span key={i} className="inline-block px-1 mx-0.5 text-[0.8rem] bg-white border border-slate-300 rounded shadow-sm text-slate-600">
                {segment.content}
              </span>
            );
          case InlineStyleType.BOOK:
            return <span key={i} className="font-bold text-slate-900">{segment.content}</span>;
          case InlineStyleType.TEXT:
          default:
            return <span key={i}>{segment.content}</span>;
        }
      })}
    </>
  );
};

const PreviewBlock: React.FC<{ block: ParsedBlock }> = ({ block }) => {
  switch (block.type) {
    case BlockType.HEADING_1:
      return <h1 className="text-4xl font-black mb-12 mt-16 pb-4 border-b-4 border-slate-900 tracking-tight leading-tight"><RenderRichText text={block.content} /></h1>;
    case BlockType.HEADING_2:
      return <h2 className="text-2xl font-black mb-8 mt-12 tracking-tight flex items-center gap-3 before:w-2 before:h-8 before:bg-indigo-600"><RenderRichText text={block.content} /></h2>;
    case BlockType.HEADING_3:
      return <h3 className="text-xl font-bold mb-6 mt-10 text-slate-800 underline decoration-indigo-200 underline-offset-8 decoration-4"><RenderRichText text={block.content} /></h3>;
    case BlockType.CODE_BLOCK:
      return (
        <div className="my-10 border border-slate-300 bg-slate-50 p-8 rounded shadow-sm">
          <pre className="text-sm font-mono whitespace-pre text-slate-900 leading-relaxed overflow-x-auto">{block.content}</pre>
        </div>
      );
    case BlockType.CHAT_USER:
      return (
        <div className="flex justify-end my-12 pl-20">
          <div className="max-w-[85%] border-2 border-dashed border-slate-900 p-6 bg-white relative text-right">
            <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black tracking-widest text-indigo-600 border border-slate-200">USER</div>
            <div className="whitespace-pre-wrap leading-[1.8]"><RenderRichText text={block.content} /></div>
          </div>
        </div>
      );
    case BlockType.CHAT_AI:
      return (
        <div className="flex justify-start my-12 pr-20">
          <div className="max-w-[85%] border-2 border-dotted border-slate-900 p-6 bg-slate-100 relative text-left">
            <div className="absolute -top-3 right-4 bg-slate-100 px-2 text-[10px] font-black tracking-widest text-indigo-600 border border-slate-200">AI</div>
            <div className="whitespace-pre-wrap leading-[1.8] text-slate-800"><RenderRichText text={block.content} /></div>
          </div>
        </div>
      );
    case BlockType.CALLOUT_TIP:
      return (
        <div className="my-14 p-6 bg-slate-50 border border-slate-400 shadow-sm relative">
           <div className="absolute -top-3 left-4 bg-slate-50 px-2 text-xs font-bold text-slate-600 border border-slate-400">TIP</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-800"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.CALLOUT_WARNING:
      return (
        <div className="my-14 p-6 bg-slate-50 border-2 border-black shadow-md relative">
           <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-black text-black border-2 border-black">WARNING</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-900 font-bold"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.CALLOUT_NOTE:
      return (
        <div className="my-14 p-6 bg-white border border-dashed border-slate-400 shadow-sm relative">
           <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-500 border border-dashed border-slate-400">NOTE</div>
           <div className="whitespace-pre-wrap leading-[1.8] text-slate-800 italic"><RenderRichText text={block.content} /></div>
        </div>
      );
    case BlockType.TABLE:
      return (
        <div className="my-10 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-left shadow-sm">
            <tbody>
              {block.tableRows?.map((row, rIdx) => (
                <tr key={rIdx} className={`border-b border-slate-300 ${rIdx === 0 ? 'bg-slate-100 font-bold' : 'bg-white'}`}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-4 border-r border-slate-300 text-sm text-slate-800 last:border-r-0">
                      <RenderRichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case BlockType.HORIZONTAL_RULE:
      return <hr className="my-8 border-t-2 border-slate-900" />;
    default:
      return <p className="mb-8 leading-[2.1] text-justify text-slate-800 tracking-tight"><RenderRichText text={block.content} /></p>;
  }
};

export default MarkdownEditor;