/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License. 
 */

import React from 'react';
import { ParsedBlock, BlockType } from '../../services/types';
import { parseInlineElements, InlineStyleType } from '../../utils/styleParser';

export const RenderRichText: React.FC<{ text: string }> = ({ text }) => {
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

export const PreviewBlock: React.FC<{ block: ParsedBlock; showLineNumbers?: boolean }> = ({ block, showLineNumbers: globalShowLineNumbers = true }) => {
  // 決定是否顯示行號：Metadata 優先，否則使用 Global 設定
  let showLineNumbers = globalShowLineNumbers;
  if (block.metadata?.showLineNumbers !== undefined) {
    showLineNumbers = block.metadata.showLineNumbers;
  }

  switch (block.type) {
    case BlockType.TOC:
      const tocLines = block.content.split('\n');
      return (
        <div className="my-12">
          <h2 className="text-3xl font-black mb-8 text-center tracking-widest text-slate-900 uppercase">目 錄</h2>
          <div className="space-y-3">
            {tocLines.map((line, idx) => {
              const cleanText = line.replace(/^[-*\d\.]+\s*/, '').trim();
              if (!cleanText) return null;
              return (
                <div key={idx} className="flex items-end gap-2 group">
                  <span className="text-slate-800 font-medium whitespace-nowrap"><RenderRichText text={cleanText} /></span>
                  <div className="flex-1 border-b-2 border-dotted border-slate-300 mb-1 opacity-50 group-hover:border-slate-400 transition-colors"></div>
                  <span className="text-slate-400 font-mono text-sm mb-0.5">...</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    case BlockType.HEADING_1:
      return <h1 className="text-4xl font-black mb-12 mt-16 pb-4 border-b-4 border-slate-900 tracking-tight leading-tight"><RenderRichText text={block.content} /></h1>;
    case BlockType.HEADING_2:
      return <h2 className="text-2xl font-black mb-8 mt-12 tracking-tight flex items-center gap-3 before:w-2 before:h-8 before:bg-indigo-600"><RenderRichText text={block.content} /></h2>;
    case BlockType.HEADING_3:
      return <h3 className="text-xl font-bold mb-6 mt-10 text-slate-800 underline decoration-indigo-200 underline-offset-8 decoration-4"><RenderRichText text={block.content} /></h3>;
    case BlockType.CODE_BLOCK:
      const codeLines = block.content.split('\n');
      return (
        <div className="my-10 border border-slate-300 bg-slate-50 rounded shadow-sm overflow-hidden relative group text-sm">
          {block.metadata?.language && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-200 text-[10px] font-bold text-slate-500 uppercase rounded-bl border-b border-l border-slate-300 z-10">
              {block.metadata.language}
            </div>
          )}
          <div className="flex font-mono">
            {showLineNumbers && (
              <div className="bg-slate-100/50 border-r border-slate-200 px-2 py-4 text-right select-none text-slate-400 leading-relaxed min-w-[2.5rem]">
                {codeLines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <pre className="flex-1 p-4 whitespace-pre text-slate-900 leading-relaxed overflow-x-auto m-0 pt-8">
              {block.content}
            </pre>
          </div>
        </div>
      );
    case BlockType.CHAT_CUSTOM:
      const isRight = block.alignment === 'right';
      const isCenter = block.alignment === 'center';
      return (
        <div className={`flex ${isRight ? 'justify-end pl-20' : isCenter ? 'justify-center px-10' : 'justify-start pr-20'} my-12`}>
          <div className={`
            ${isCenter ? 'max-w-[90%]' : 'max-w-[85%]'} 
            border-2 p-6 relative 
            ${isRight ? 'border-dashed border-slate-900 bg-white text-right' : 
              isCenter ? 'border-double border-indigo-400 bg-indigo-50/30 text-center' : 
              'border-dotted border-slate-900 bg-slate-100 text-left'}
          `}>
            <div className={`absolute -top-3 ${isRight ? 'left-4' : isCenter ? 'left-1/2 -translate-x-1/2' : 'right-4'} bg-inherit px-2 text-[10px] font-black tracking-widest text-indigo-600 border border-slate-200 uppercase`}>
              {block.role}
            </div>
            <div className="whitespace-pre-wrap leading-[1.8] text-slate-900"><RenderRichText text={block.content} /></div>
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
