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
  const { documentProfile, imageRegistry } = useEditor();
  const isPublisher = documentProfile?.id !== undefined
    && documentProfile.id !== 'technical-legacy';

  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case InlineStyleType.BOLD:
            return (
              <strong
                key={index}
                className={isPublisher ? 'font-bold' : 'font-bold text-slate-950'}
              >
                {segment.content}
              </strong>
            );
          case InlineStyleType.ITALIC:
            return (
              <span
                key={index}
                className={isPublisher ? 'italic' : 'italic text-sky-900'}
              >
                {segment.content}
              </span>
            );
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
                  className={isPublisher
                    ? 'underline underline-offset-4'
                    : 'text-sky-700 underline decoration-sky-300 underline-offset-4 transition-colors hover:text-sky-950'}
                  style={isPublisher ? { color: 'var(--publisher-heading-2)' } : undefined}
                >
                  {segment.content}
                </a>
                {!isPublisher && (
                  <span className="inline-flex translate-y-[1px] items-center justify-center rounded border border-slate-200 bg-slate-50 p-[2px]">
                    <QrCode className="h-3 w-3 text-slate-500" />
                  </span>
                )}
              </span>
            );
          case InlineStyleType.CODE:
            return (
              <code
                key={index}
                className={isPublisher
                  ? 'rounded px-1.5 py-0.5 text-[0.9em]'
                  : 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800'}
                style={isPublisher ? {
                  backgroundColor: 'var(--publisher-code-background)',
                  color: 'var(--publisher-inline-code)',
                  fontFamily: 'var(--publisher-code-font)',
                } : undefined}
              >
                {segment.content}
              </code>
            );
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
            return (
              <span
                key={index}
                className={isPublisher ? 'font-semibold' : 'font-semibold text-slate-950'}
              >
                {segment.content}
              </span>
            );
          case InlineStyleType.TEXT:
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </>
  );
};

type PreviewRenderer = (
  block: ParsedBlock,
  showLineNumbers: boolean,
  isPublisher: boolean,
) => React.ReactElement;

const renderTOC: PreviewRenderer = (block, _showLineNumbers, isPublisher) => {
  const tocLines = block.content.split('\n');

  return (
    <div className="my-12">
      <h2
        className={isPublisher
          ? 'mb-6 text-center text-2xl font-bold tracking-[0.16em]'
          : 'mb-8 text-center text-3xl font-black tracking-[0.22em] text-slate-950'}
        style={isPublisher ? { color: 'var(--publisher-heading-2)' } : undefined}
      >
        目錄
      </h2>
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

const renderHeading1: PreviewRenderer = (block, _showLineNumbers, isPublisher) => (
  <h1
    className={isPublisher
      ? 'font-bold leading-tight'
      : 'mb-12 mt-16 border-b-4 border-slate-950 pb-4 text-4xl font-black leading-tight text-slate-950'}
    style={isPublisher ? {
      color: 'var(--publisher-heading-1)',
      fontSize: 'var(--publisher-h1-size)',
      marginBottom: 'var(--publisher-h1-after)',
      marginTop: 'var(--publisher-h1-before)',
    } : undefined}
  >
    <RenderRichText text={block.content} />
  </h1>
);

const renderHeading2: PreviewRenderer = (block, _showLineNumbers, isPublisher) => (
  <h2
    className={isPublisher
      ? 'font-bold leading-tight'
      : 'before-bg-product mb-8 mt-12 flex items-center gap-3 text-2xl font-black text-slate-950 before:h-8 before:w-2'}
    style={isPublisher ? {
      color: 'var(--publisher-heading-2)',
      fontSize: 'var(--publisher-h2-size)',
      marginBottom: 'var(--publisher-h2-after)',
      marginTop: 'var(--publisher-h2-before)',
    } : undefined}
  >
    <RenderRichText text={block.content} />
  </h2>
);

const renderHeading3: PreviewRenderer = (block, _showLineNumbers, isPublisher) => (
  <h3
    className={isPublisher
      ? 'font-bold leading-tight'
      : 'mb-6 mt-10 text-xl font-bold text-slate-800 underline decoration-product-primary decoration-4 underline-offset-8'}
    style={isPublisher ? {
      color: 'var(--publisher-heading-3)',
      fontSize: 'var(--publisher-h3-size)',
      marginBottom: 'var(--publisher-h3-after)',
      marginTop: 'var(--publisher-h3-before)',
    } : undefined}
  >
    <RenderRichText text={block.content} />
  </h3>
);

const renderCodeBlock: PreviewRenderer = (block, globalShowLineNumbers, isPublisher) => {
  const codeLines = block.content.split('\n');
  const showLineNumbers = !isPublisher
    && (block.metadata?.showLineNumbers ?? globalShowLineNumbers);

  return (
    <div
      className={isPublisher
        ? 'group relative my-5 overflow-hidden rounded-md border border-slate-300 text-sm'
        : 'group relative my-10 overflow-hidden rounded-md border border-slate-300 bg-slate-50 text-sm shadow-sm'}
      style={isPublisher ? {
        backgroundColor: 'var(--publisher-code-background)',
        fontFamily: 'var(--publisher-code-font, monospace)',
      } : undefined}
    >
      {!isPublisher && block.metadata?.language && (
        <div className="absolute right-0 top-0 z-10 rounded-bl border-b border-l border-slate-300 bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase text-slate-500">
          {block.metadata.language}
        </div>
      )}
      <div className={isPublisher ? 'flex' : 'flex font-mono'}>
        {showLineNumbers && (
          <div className="min-w-10 select-none border-r border-slate-200 bg-slate-100/70 px-2 py-4 text-right leading-relaxed text-slate-400">
            {codeLines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        )}
        <pre
          className={isPublisher
            ? 'm-0 flex-1 overflow-x-auto whitespace-pre p-4 leading-relaxed'
            : 'm-0 flex-1 overflow-x-auto whitespace-pre p-4 pt-8 leading-relaxed text-slate-950'}
          style={isPublisher ? {
            color: 'var(--publisher-body, currentColor)',
            fontFamily: 'var(--publisher-code-font, monospace)',
          } : undefined}
        >
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
    kind: 'tip',
    label: 'TIP',
    className: 'border-slate-500 bg-slate-50 text-slate-800',
    labelClassName: 'border-slate-500 bg-slate-50 text-slate-700',
  },
  [BlockType.CALLOUT_NOTE]: {
    kind: 'note',
    label: 'NOTE',
    className: 'border-dashed border-slate-400 bg-white text-slate-800',
    labelClassName: 'border-dashed border-slate-400 bg-white text-slate-600',
  },
  [BlockType.CALLOUT_WARNING]: {
    kind: 'warning',
    label: 'WARNING',
    className: 'border-2 border-slate-950 bg-slate-50 font-semibold text-slate-950',
    labelClassName: 'border-2 border-slate-950 bg-white text-slate-950',
  },
  [BlockType.CALLOUT_IMPORTANT]: {
    kind: 'important',
    label: 'IMPORTANT',
    className: 'border-sky-500 bg-sky-50 text-sky-950',
    labelClassName: 'border-sky-500 bg-sky-50 text-sky-800',
  },
  [BlockType.CALLOUT_CAUTION]: {
    kind: 'caution',
    label: 'CAUTION',
    className: 'border-red-500 bg-red-50 text-red-950',
    labelClassName: 'border-red-500 bg-red-50 text-red-800',
  },
};

const renderCallout: PreviewRenderer = (block, _showLineNumbers, isPublisher) => {
  const config = calloutConfig[block.type as keyof typeof calloutConfig];

  return (
    <div
      className={isPublisher
        ? 'relative border p-4'
        : `relative my-14 border p-6 shadow-sm ${config.className}`}
      data-callout-kind={config.kind}
      style={isPublisher ? {
        backgroundColor: `var(--publisher-callout-${config.kind}-background)`,
        borderColor: 'var(--publisher-heading-2)',
        color: 'var(--publisher-callout-text)',
        marginBottom: 'var(--publisher-callout-after)',
        marginTop: 'var(--publisher-callout-before)',
      } : undefined}
    >
      <div
        className={isPublisher
          ? 'mb-2 text-xs font-bold'
          : `absolute -top-3 left-4 border px-2 text-xs font-bold ${config.labelClassName}`}
        style={isPublisher ? { color: 'var(--publisher-heading-2)' } : undefined}
      >
        {config.label}
      </div>
      <div className={isPublisher ? 'whitespace-pre-wrap leading-7' : 'whitespace-pre-wrap leading-8'}>
        <RenderRichText text={block.content} />
      </div>
    </div>
  );
};

const renderTable: PreviewRenderer = (block, _showLineNumbers, isPublisher) => (
  <div className={isPublisher ? 'my-5 max-w-full overflow-x-auto' : 'my-10 overflow-x-auto'}>
    <table className="w-full border-collapse border border-slate-400 text-left shadow-sm">
      <tbody>
        {block.tableRows?.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={`border-b border-slate-300 ${
              rowIndex === 0
                ? isPublisher ? 'font-bold' : 'bg-slate-100 font-bold'
                : 'bg-white'
            }`}
            style={isPublisher && rowIndex === 0
              ? { backgroundColor: 'var(--publisher-table-header-background)' }
              : undefined}
          >
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={isPublisher
                  ? 'border-r border-slate-300 p-4 text-sm last:border-r-0'
                  : 'border-r border-slate-300 p-4 text-sm text-slate-800 last:border-r-0'}
                style={isPublisher ? { color: 'var(--publisher-body)' } : undefined}
              >
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
  const { documentProfile, imageRegistry } = useEditor();
  const isPublisher = documentProfile?.id !== undefined
    && documentProfile.id !== 'technical-legacy';
  const imageUrl = imageRegistry[block.content] || block.content;

  return (
    <figure className="my-10 flex flex-col items-center">
      <img
        src={imageUrl}
        alt={block.metadata?.alt || 'Markdown embedded image'}
        className="h-auto max-w-full rounded-md border border-slate-200 shadow-lg"
      />
      {block.metadata?.alt && (
        <figcaption
          className={isPublisher
            ? 'mt-3 text-sm font-medium italic'
            : 'mt-4 text-sm font-medium italic text-slate-500'}
          style={isPublisher ? {
            color: 'var(--publisher-caption)',
            marginBottom: 'var(--publisher-caption-after)',
          } : undefined}
        >
          {block.metadata.alt}
        </figcaption>
      )}
    </figure>
  );
};

const ChapterPreview: React.FC<{ block: ParsedBlock }> = ({ block }) => {
  const { documentProfile, imageRegistry } = useEditor();
  const isPublisher = documentProfile?.id !== undefined
    && documentProfile.id !== 'technical-legacy';
  const chapter = block.metadata?.chapter;
  if (!chapter) {
    return null;
  }
  const imageSource = chapter.image
    ? imageRegistry[chapter.image] ?? chapter.image
    : undefined;

  return (
    <section className="my-16 border-y border-slate-200 py-12">
      {chapter.part && (
        <p
          className={isPublisher ? 'mb-1 text-xs font-bold' : 'mb-1 text-xs font-bold text-teal-700'}
          style={isPublisher ? { color: 'var(--publisher-heading-3)' } : undefined}
        >
          {chapter.part}
        </p>
      )}
      <p
        className={isPublisher
          ? 'text-5xl font-bold leading-none'
          : 'text-5xl font-bold leading-none text-[#0B2545]'}
        style={isPublisher ? { color: 'var(--publisher-heading-1)' } : undefined}
      >
        {chapter.number}
      </p>
      <h1
        className={isPublisher
          ? 'mt-2 text-3xl font-bold'
          : 'mt-2 text-3xl font-bold text-[#0B2545]'}
        style={isPublisher ? { color: 'var(--publisher-heading-1)' } : undefined}
      >
        {chapter.title}
      </h1>
      {chapter.englishTitle && (
        <p
          className={isPublisher ? 'mt-1 text-sm italic' : 'mt-1 text-sm italic text-[#2E74B5]'}
          style={isPublisher ? { color: 'var(--publisher-heading-2)' } : undefined}
        >
          {chapter.englishTitle}
        </p>
      )}
      {chapter.summary && (
        <p
          className={isPublisher ? 'mt-4 leading-relaxed' : 'mt-4 leading-relaxed text-slate-700'}
          style={isPublisher ? { color: 'var(--publisher-body)' } : undefined}
        >
          {chapter.summary}
        </p>
      )}
      {imageSource && (
        <img
          src={imageSource}
          alt={`章首頁：${chapter.title}`}
          className="mx-auto mt-6 h-auto max-w-[70%]"
        />
      )}
      <h2
        className={isPublisher ? 'mt-6 text-sm font-bold' : 'mt-6 text-sm font-bold text-[#C55A3A]'}
        style={isPublisher ? { color: 'var(--publisher-heading-3)' } : undefined}
      >
        本章完成
      </h2>
      {chapter.goals.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {chapter.goals.map((goal, index) => (
            <li key={`${index}-${goal}`}>{goal}</li>
          ))}
        </ul>
      )}
    </section>
  );
};

const renderChapter: PreviewRenderer = (block) => (
  <ChapterPreview block={block} />
);

const renderQr: PreviewRenderer = (block, _showLineNumbers, isPublisher) => {
  const label = block.metadata?.label || block.content;
  const url = block.metadata?.url || '';

  return (
    <figure className="my-10 flex flex-col items-center gap-3">
      <div className="flex h-24 w-24 items-center justify-center border border-slate-300 bg-white">
        <QrCode aria-hidden="true" className="h-16 w-16 text-slate-900" />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={isPublisher
          ? 'text-sm underline underline-offset-4'
          : 'text-sm text-[#9B1C1C] underline underline-offset-4'}
        style={isPublisher
          ? { color: 'var(--publisher-inline-code, #9B1C1C)' }
          : undefined}
      >
        {label}
      </a>
    </figure>
  );
};

const previewBlockRenderers: Partial<Record<BlockType, PreviewRenderer>> = {
  [BlockType.TOC]: renderTOC,
  [BlockType.CHAPTER_OPENER]: renderChapter,
  [BlockType.HEADING_1]: renderHeading1,
  [BlockType.HEADING_2]: renderHeading2,
  [BlockType.HEADING_3]: renderHeading3,
  [BlockType.CODE_BLOCK]: renderCodeBlock,
  [BlockType.MERMAID]: (block) => <MermaidRenderer chart={block.content} />,
  [BlockType.CHAT_CUSTOM]: renderChat,
  [BlockType.CALLOUT_TIP]: renderCallout,
  [BlockType.CALLOUT_NOTE]: renderCallout,
  [BlockType.CALLOUT_WARNING]: renderCallout,
  [BlockType.CALLOUT_IMPORTANT]: renderCallout,
  [BlockType.CALLOUT_CAUTION]: renderCallout,
  [BlockType.TABLE]: renderTable,
  [BlockType.HORIZONTAL_RULE]: () => <hr className="my-8 border-t-2 border-slate-950" />,
  [BlockType.IMAGE]: (block) => <ImageBlock block={block} />,
  [BlockType.QR]: renderQr,
};

export const PreviewBlock: React.FC<{ block: ParsedBlock; showLineNumbers?: boolean }> = ({
  block,
  showLineNumbers = true,
}) => {
  const { documentProfile } = useEditor();
  const isPublisher = documentProfile?.id !== undefined
    && documentProfile.id !== 'technical-legacy';
  const renderer = previewBlockRenderers[block.type];

  if (renderer) {
    return renderer(block, showLineNumbers, isPublisher);
  }

  return (
    <p
      className={isPublisher
        ? 'text-justify leading-[1.65]'
        : 'mb-8 text-justify leading-[2.1] text-slate-800'}
      style={isPublisher ? {
        color: 'var(--publisher-body)',
        marginBottom: 'var(--publisher-paragraph-after)',
        marginTop: 'var(--publisher-paragraph-before)',
      } : undefined}
    >
      <RenderRichText text={block.content} />
    </p>
  );
};
