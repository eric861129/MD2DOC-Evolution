/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ParsedBlock, BlockType } from '../../types';
import { PreviewBlock, RenderRichText } from './PreviewRenderers';
import { FONTS } from '../../constants/theme';

interface PreviewPaneProps {
  parsedBlocks: ParsedBlock[];
  previewRef: React.RefObject<HTMLDivElement>;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  parsedBlocks,
  previewRef
}) => {
  const renderPreviewContent = () => {
    //const elements: JSX.Element[] = [];
    const elements: React.ReactNode[] = [];
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
      } else if (block.type === BlockType.TOC) {

        const headings = parsedBlocks.filter(b => 
          [BlockType.HEADING_1, BlockType.HEADING_2, BlockType.HEADING_3].includes(b.type)
        );

        elements.push(
          <div key={`toc-${i}`} className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-lg select-none">
            <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
              目錄預覽 (Table of Contents)
            </p>
            
            {headings.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                尚未偵測到標題...
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {headings.map((h, idx) => {
                  // 簡單的縮排邏輯
                  let indent = "pl-0";
                  if (h.type === BlockType.HEADING_2) indent = "pl-4";
                  if (h.type === BlockType.HEADING_3) indent = "pl-8";
                  
                  return (
                    <div key={idx} className={`${indent} text-sm text-slate-600 flex items-center`}>
                       <span className="text-slate-300 mr-2 text-[10px]">#</span>
                       <RenderRichText text={h.content} />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-4 text-[10px] text-slate-400 text-center">
              * 此區塊匯出 Word 時將自動轉換為功能變數目錄
            </p>
          </div>
        );
        i++; 

      } else {
        elements.push(<PreviewBlock key={i} block={block} />);
        i++;
      }
    }
    return elements;
  };

  return (
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
  );
};
