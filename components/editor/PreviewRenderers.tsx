/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { QrCode } from 'lucide-react';
import { BlockType, ParsedBlock } from '../../services/types';
import { InlineStyleType, parseInlineElements } from '../../utils/styleParser';
import { useEditor } from '../../contexts/EditorContext';
import MermaidRenderer from './MermaidRenderer';

export const RenderRichText: React.FC<{ text: string }> = ({ text }) => {
  const segments = parseInlineElements(text);
  const { imageRegistry } = useEditor();

  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case InlineStyleType.BOLD:
            return <strong key={index} className="font-bold text-slate-950">{segment.content}</strong>;
          case InlineStyleType.ITALIC:
            return <span key={index} className="italic text-sky-900">{segment.content}</span>;
          case InlineStyleType.UNDERLINE:
            return <span key={index} className="underline decoration-product-primary underline-offset-4">{segment.content}</span>;
          case InlineStyleType.IMAGE: {
            const imageUrl = segment.url && imageRegistry[segment.url] ? imageRegistry[segment.url] : segment.url;
            return (
              <img
                key={index}
                src={imageUrl}
                alt={segment.content}
                className="mx-1 inline-block max-h-9 rounded-md border border-slate-200 align-middle shadow-sm"
              />
            );
          }
          case InlineStyleType.LINK:
            return (
              <span key={index} className="mx-0.5 inline-flex items-baseline gap-1 align-middle">
                <a
                  href={segment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 underline decoration-sky-300 underline-offset-4 transition-colors hover:text-sky-950"
                >
                  {segment.content}
                </a>
                <span className="inline-flex translate-y-[1px] items-center justify-center rounded border border-slate-200 bg-slate-50 p-[2px]">
                  <QrCode className="h-3 w-3 text-slate-500" />
                </span>
              </span>
            );
          case InlineStyleType.CODE:
            return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{segment.content}</code>;
          case InlineStyleType.UI_BUTTON:
            return (
              <span key={index} className="mx-0.5 inline-block rounded border border-slate-400 bg-slate-200 px-1.5 py-0.5 text-[0.8rem] font-bold text-slate-900 shadow-[1px_1px_0_0_#94a3b8]">
                {segment.content}
              </span>
            );
          case InlineStyleType.SHORTCUT:
            return (
              <span key={index} className="mx-0.5 inline-block rounded border border-slate-300 bg-white px-1 py-0.5 text-[0.8rem] text-slate-700 shadow-sm">
                {segment.content}
              </span>
            );
          case InlineStyleType.BOOK:
          case InlineStyleType.UI_EMPHASIS:
            return <span key={index} className="font-semibold text-slate-950">{segment.content}</span>;
          case InlineStyleType.TEXT:
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </>
  );
};

type PreviewRenderer = (block: ParsedBlock, showLineNumbers: boolean) => React.ReactElement;

const renderTOC: PreviewRenderer = (block) => {
  const tocLines = block.content.split('\n');

  return (
    <div className="my-12">
      <h2 className="mb-8 text-center text-3xl font-black tracking-[0.22em] text-slate-950">目錄</h2>
      <div className="space-y-3">
        {tocLines.map((line, index) => {
          const cleanText = line.replace(/^[-*\d.]+\s*/, '').trim();
          if (!cleanText) return null;

          return (
            <div key={index} className="group flex items-end gap-2">
              <span className="whitespace-nowrap font-medium text-slate-800">
                <RenderRichText text={cleanText} />
              </span>
              <div className="mb-1 flex-1 border-b-2 border-dotted border-slate-300 opacity-70 transition-colors group-hover:border-slate-500" />
              <span className="mb-0.5 font-mono text-sm text-slate-400">...</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderHeading1: PreviewRenderer = (block) => (
  <h1 className="mb-12 mt-16 border-b-4 border-slate-950 pb-4 text-4xl font-black leading-tight text-slate-950">
    <RenderRichText text={block.content} />
  </h1>
);

const renderHeading2: PreviewRenderer = (block) => (
  <h2 className="before-bg-product mb-8 mt-12 flex items-center gap-3 text-2xl font-black text-slate-950 before:h-8 before:w-2">
    <RenderRichText text={block.content} />
  </h2>
);

const renderHeading3: PreviewRenderer = (block) => (
  <h3 className="mb-6 mt-10 text-xl font-bold text-slate-800 underline decoration-product-primary decoration-4 underline-offset-8">
    <RenderRichText text={block.content} />
  </h3>
);

const renderCodeBlock: PreviewRenderer = (block, globalShowLineNumbers) => {
  const codeLines = block.content.split('\n');
  const showLineNumbers = block.metadata?.showLineNumbers ?? globalShowLineNumbers;

  return (
    <div className="group relative my-10 overflow-hidden rounded-md border border-slate-300 bg-slate-50 text-sm shadow-sm">
      {block.metadata?.language && (
        <div className="absolute right-0 top-0 z-10 rounded-bl border-b border-l border-slate-300 bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase text-slate-500">
          {block.metadata.language}
        </div>
      )}
      <div className="flex font-mono">
        {showLineNumbers && (
          <div className="min-w-10 select-none border-r border-slate-200 bg-slate-100/70 px-2 py-4 text-right leading-relaxed text-slate-400">
            {codeLines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        )}
        <pre className="m-0 flex-1 overflow-x-auto whitespace-pre p-4 pt-8 leading-relaxed text-slate-950">
          {block.content}
        </pre>
      </div>
    </div>
  );
};

const renderChat: PreviewRenderer = (block) => {
  const isRight = block.alignment === 'right';
  const isCenter = block.alignment === 'center';

  return (
    <div className={`my-12 flex ${isRight ? 'justify-end pl-16' : isCenter ? 'justify-center px-8' : 'justify-start pr-16'}`}>
      <div
        className={`relative max-w-[90%] border-2 p-6 ${
          isRight
            ? 'border-dashed border-slate-950 bg-white text-right'
            : isCenter
              ? 'border-double border-product bg-product-glow text-center'
              : 'border-dotted border-slate-950 bg-slate-100 text-left'
        }`}
      >
        <div
          className={`absolute -top-3 bg-inherit px-2 text-[10px] font-black uppercase tracking-[0.18em] text-product ${
            isRight ? 'left-4' : isCenter ? 'left-1/2 -translate-x-1/2' : 'right-4'
          }`}
        >
          {block.role}
        </div>
        <div className="whitespace-pre-wrap leading-8 text-slate-950">
          <RenderRichText text={block.content} />
        </div>
      </div>
    </div>
  );
};

const calloutConfig = {
  [BlockType.CALLOUT_TIP]: {
    label: 'TIP',
    className: 'border-slate-500 bg-slate-50 text-slate-800',
    labelClassName: 'border-slate-500 bg-slate-50 text-slate-700',
  },
  [BlockType.CALLOUT_NOTE]: {
    label: 'NOTE',
    className: 'border-dashed border-slate-400 bg-white text-slate-800',
    labelClassName: 'border-dashed border-slate-400 bg-white text-slate-600',
  },
  [BlockType.CALLOUT_WARNING]: {
    label: 'WARNING',
    className: 'border-2 border-slate-950 bg-slate-50 font-semibold text-slate-950',
    labelClassName: 'border-2 border-slate-950 bg-white text-slate-950',
  },
};

const renderCallout: PreviewRenderer = (block) => {
  const config = calloutConfig[block.type as keyof typeof calloutConfig];

  return (
    <div className={`relative my-14 border p-6 shadow-sm ${config.className}`}>
      <div className={`absolute -top-3 left-4 border px-2 text-xs font-bold ${config.labelClassName}`}>
        {config.label}
      </div>
      <div className="whitespace-pre-wrap leading-8">
        <RenderRichText text={block.content} />
      </div>
    </div>
  );
};

const renderTable: PreviewRenderer = (block) => (
  <div className="my-10 overflow-x-auto">
    <table className="w-full border-collapse border border-slate-400 text-left shadow-sm">
      <tbody>
        {block.tableRows?.map((row, rowIndex) => (
          <tr key={rowIndex} className={`border-b border-slate-300 ${rowIndex === 0 ? 'bg-slate-100 font-bold' : 'bg-white'}`}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border-r border-slate-300 p-4 text-sm text-slate-800 last:border-r-0">
                <RenderRichText text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ImageBlock: React.FC<{ block: ParsedBlock }> = ({ block }) => {
  const { imageRegistry } = useEditor();
  const imageUrl = imageRegistry[block.content] || block.content;

  return (
    <figure className="my-10 flex flex-col items-center">
      <img
        src={imageUrl}
        alt={block.metadata?.alt || 'Markdown embedded image'}
        className="h-auto max-w-full rounded-md border border-slate-200 shadow-lg"
      />
      {block.metadata?.alt && (
        <figcaption className="mt-4 text-sm font-medium italic text-slate-500">
          {block.metadata.alt}
        </figcaption>
      )}
    </figure>
  );
};

const previewBlockRenderers: Partial<Record<BlockType, PreviewRenderer>> = {
  [BlockType.TOC]: renderTOC,
  [BlockType.HEADING_1]: renderHeading1,
  [BlockType.HEADING_2]: renderHeading2,
  [BlockType.HEADING_3]: renderHeading3,
  [BlockType.CODE_BLOCK]: renderCodeBlock,
  [BlockType.MERMAID]: (block) => <MermaidRenderer chart={block.content} />,
  [BlockType.CHAT_CUSTOM]: renderChat,
  [BlockType.CALLOUT_TIP]: renderCallout,
  [BlockType.CALLOUT_NOTE]: renderCallout,
  [BlockType.CALLOUT_WARNING]: renderCallout,
  [BlockType.TABLE]: renderTable,
  [BlockType.HORIZONTAL_RULE]: () => <hr className="my-8 border-t-2 border-slate-950" />,
  [BlockType.IMAGE]: (block) => <ImageBlock block={block} />,
};

export const PreviewBlock: React.FC<{ block: ParsedBlock; showLineNumbers?: boolean }> = ({
  block,
  showLineNumbers = true,
}) => {
  const renderer = previewBlockRenderers[block.type];

  if (renderer) {
    return renderer(block, showLineNumbers);
  }

  return (
    <p className="mb-8 text-justify leading-[2.1] text-slate-800">
      <RenderRichText text={block.content} />
    </p>
  );
};
