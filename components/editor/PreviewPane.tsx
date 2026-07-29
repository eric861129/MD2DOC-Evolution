/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Maximize2, Minus, Plus, Sparkles } from 'lucide-react';
import { BlockType, ParsedBlock } from '../../services/types';
import { PreviewBlock, RenderRichText } from './PreviewRenderers';
import { useEditor } from '../../contexts/EditorContext';
import { IconButton } from '../ui/IconButton';
import type { ResolvedPageLayout } from '../../services/docx/layout/types';
import type { DocumentStyleProfile } from '../../services/docx/profiles';
import { UI_THEME } from '../../constants/theme';

interface PreviewPaneProps {
  parsedBlocks: ParsedBlock[];
  previewRef: React.RefObject<HTMLDivElement>;
}

type PreviewPageStyle = React.CSSProperties & Record<`--${string}`, string>;

const formatDecimal = (value: number): string => Number(value.toFixed(4)).toString();
const formatCm = (value: number): string => `${formatDecimal(value)}cm`;
const formatPoints = (twips: number): string => `${formatDecimal(twips / 20)}pt`;
const formatHalfPoints = (halfPoints: number): string => `${formatDecimal(halfPoints / 2)}pt`;
const formatColor = (color: string): string => color.startsWith('#') ? color : `#${color}`;

const createFontStack = (
  font: DocumentStyleProfile['fonts']['body'],
  fallback: 'sans-serif' | 'monospace',
): string => {
  const uniqueFamilies = [...new Set([font.ascii, font.hAnsi, font.eastAsia, font.cs])];
  return `${uniqueFamilies.map((family) => `"${family}"`).join(', ')}, ${fallback}`;
};

const createPreviewPageStyle = (
  layout: ResolvedPageLayout,
  profile: DocumentStyleProfile,
): PreviewPageStyle => {
  const { margins, page } = layout;
  const topPaddingCm = margins.topCm
    + (margins.gutterPosition === 'top' ? margins.gutterCm : 0);
  const leftPaddingCm = margins.leftCm
    + (margins.gutterPosition === 'left' ? margins.gutterCm : 0);
  const paddingValues = [
    topPaddingCm,
    margins.rightCm,
    margins.bottomCm,
    leftPaddingCm,
  ];
  const padding = paddingValues.every((value) => value === paddingValues[0])
    ? formatCm(paddingValues[0])
    : paddingValues.map(formatCm).join(' ');
  const aspectRatio = `${formatDecimal(page.widthCm)} / ${formatDecimal(page.heightCm)}`;
  const isLegacy = profile.id === 'technical-legacy';

  return {
    '--page-aspect-ratio': aspectRatio,
    '--page-width': formatCm(page.widthCm),
    '--page-height': formatCm(page.heightCm),
    '--page-margin-top': formatCm(margins.topCm),
    '--page-margin-right': formatCm(margins.rightCm),
    '--page-margin-bottom': formatCm(margins.bottomCm),
    '--page-margin-left': formatCm(margins.leftCm),
    '--page-margin-inside': margins.insideCm === undefined ? '' : formatCm(margins.insideCm),
    '--page-margin-outside': margins.outsideCm === undefined ? '' : formatCm(margins.outsideCm),
    '--page-gutter': formatCm(margins.gutterCm),
    '--page-padding-top': formatCm(topPaddingCm),
    '--page-padding-right': formatCm(margins.rightCm),
    '--page-padding-bottom': formatCm(margins.bottomCm),
    '--page-padding-left': formatCm(leftPaddingCm),
    '--publisher-body': formatColor(profile.colors.body),
    '--publisher-heading-1': formatColor(profile.colors.heading1),
    '--publisher-heading-2': formatColor(profile.colors.heading2),
    '--publisher-heading-3': formatColor(profile.colors.heading3),
    '--publisher-inline-code': formatColor(profile.colors.inlineCode),
    '--publisher-caption': formatColor(profile.colors.caption),
    '--publisher-callout-text': formatColor(profile.colors.calloutText),
    '--publisher-code-background': formatColor(profile.paragraph.code.shadingFill ?? 'FFFFFF'),
    '--publisher-table-header-background': formatColor(profile.table.headerFill),
    '--publisher-callout-note-background': formatColor(profile.callouts.note.fill),
    '--publisher-callout-tip-background': formatColor(profile.callouts.tip.fill),
    '--publisher-callout-warning-background': formatColor(profile.callouts.warning.fill),
    '--publisher-callout-important-background': formatColor(profile.callouts.important.fill),
    '--publisher-callout-caution-background': formatColor(profile.callouts.caution.fill),
    '--publisher-body-font': createFontStack(profile.fonts.body, 'sans-serif'),
    '--publisher-code-font': createFontStack(profile.fonts.code, 'monospace'),
    '--publisher-paragraph-before': formatPoints(profile.paragraph.normal.beforeTwips),
    '--publisher-paragraph-after': formatPoints(profile.paragraph.normal.afterTwips),
    '--publisher-h1-size': formatHalfPoints(profile.heading.h1.sizeHalfPoints),
    '--publisher-h1-before': formatPoints(profile.heading.h1.beforeTwips),
    '--publisher-h1-after': formatPoints(profile.heading.h1.afterTwips),
    '--publisher-h2-size': formatHalfPoints(profile.heading.h2.sizeHalfPoints),
    '--publisher-h2-before': formatPoints(profile.heading.h2.beforeTwips),
    '--publisher-h2-after': formatPoints(profile.heading.h2.afterTwips),
    '--publisher-h3-size': formatHalfPoints(profile.heading.h3.sizeHalfPoints),
    '--publisher-h3-before': formatPoints(profile.heading.h3.beforeTwips),
    '--publisher-h3-after': formatPoints(profile.heading.h3.afterTwips),
    '--publisher-callout-before': formatPoints(profile.paragraph.callout.beforeTwips),
    '--publisher-callout-after': formatPoints(profile.paragraph.callout.afterTwips),
    '--publisher-caption-after': formatPoints(profile.paragraph.caption.afterTwips),
    boxSizing: 'border-box',
    color: isLegacy ? undefined : 'var(--publisher-body)',
    fontFamily: isLegacy ? UI_THEME.FONTS.PREVIEW : 'var(--publisher-body-font)',
    maxWidth: '100%',
    minWidth: 0,
    padding,
    width: '100%',
  };
};

const renderList = (items: ParsedBlock[], type: BlockType, isPublisher: boolean) => {
  const ListTag = type === BlockType.BULLET_LIST ? 'ul' : 'ol';

  return (
    <ListTag className={`mb-8 ml-8 ${type === BlockType.NUMBERED_LIST ? 'list-decimal' : ''}`}>
      {items.map((item, index) => (
        <li
          key={`${item.content}-${index}`}
          style={{
            color: isPublisher ? 'var(--publisher-body)' : undefined,
            marginLeft: `${(item.nestingLevel || 0) * 1.5}rem`,
          }}
          className={
            type === BlockType.BULLET_LIST
              ? "relative mb-2 list-none pl-4 leading-8 text-slate-800 before:absolute before:left-0 before:top-[0.72em] before:h-2 before:w-2 before:rounded-full before:bg-slate-400"
              : 'mb-2 pl-2 leading-8 text-slate-800'
          }
        >
          <RenderRichText text={item.content} />
        </li>
      ))}
    </ListTag>
  );
};

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  parsedBlocks,
  previewRef,
}) => {
  const {
    documentProfile,
    exportSettings,
    resolvedPageLayout,
    t,
  } = useEditor();
  const [zoom, setZoom] = React.useState(1);
  const isPublisher = documentProfile.id !== 'technical-legacy';
  const isMirrored = resolvedPageLayout.margins.mode === 'mirrored';
  const pageStyle = createPreviewPageStyle(resolvedPageLayout, documentProfile);

  const renderPreviewContent = () => {
    const elements: React.ReactElement[] = [];
    let index = 0;

    while (index < parsedBlocks.length) {
      const block = parsedBlocks[index];

      if (block.type === BlockType.BULLET_LIST || block.type === BlockType.NUMBERED_LIST) {
        const listType = block.type;
        const listItems: ParsedBlock[] = [];
        while (index < parsedBlocks.length && parsedBlocks[index].type === listType) {
          listItems.push(parsedBlocks[index]);
          index++;
        }
        elements.push(
          <React.Fragment key={`${listType}-${index}`}>
            {renderList(listItems, listType, isPublisher)}
          </React.Fragment>,
        );
        continue;
      }

      elements.push(<PreviewBlock key={`${block.type}-${index}`} block={block} />);
      index++;
    }

    return elements;
  };

  return (
    <section className="workspace-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md">
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-white">{t('workspace.preview')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Continuous document preview</p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
            title={t('workspace.zoomOut')}
            className="h-8 w-8"
          >
            <Minus className="h-3.5 w-3.5" />
          </IconButton>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="h-8 min-w-14 rounded-md px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title={t('workspace.fitWidth')}
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconButton
            onClick={() => setZoom((value) => Math.min(1.25, Number((value + 0.1).toFixed(2))))}
            title={t('workspace.zoomIn')}
            className="h-8 w-8"
          >
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton onClick={() => setZoom(1)} title={t('workspace.fitWidth')} className="h-8 w-8">
            <Maximize2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div
        ref={previewRef}
        className="min-h-0 flex-1 overflow-y-auto bg-white p-5 scroll-smooth md:p-8"
        data-preview-flow="continuous"
      >
        <div
          className="mx-auto w-full origin-top transition-transform duration-300"
          style={{
            maxWidth: '860px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {isMirrored && (
            <p
              id="mirrored-preview-note"
              className="mb-2 text-center text-xs leading-5 text-slate-500"
            >
              單頁預覽：內側顯示於左側、外側顯示於右側；實際奇偶頁以 DOCX 為準。
            </p>
          )}
          <article
            aria-describedby={isMirrored ? 'mirrored-preview-note' : undefined}
            aria-label="文件頁面預覽"
            className={`print-paper w-full max-w-full rounded-md [overflow-wrap:anywhere] ${
              isPublisher ? '' : 'text-slate-950'
            }`}
            data-gutter-position={resolvedPageLayout.margins.gutterPosition}
            data-margin-mode={resolvedPageLayout.margins.mode}
            data-margin-preset={exportSettings.marginPresetId}
            data-mirrored-mapping={isMirrored ? 'inside-left-outside-right' : undefined}
            data-page-size={`${formatDecimal(resolvedPageLayout.page.widthCm)}x${formatDecimal(resolvedPageLayout.page.heightCm)}`}
            data-profile={documentProfile.id}
            style={pageStyle}
          >
            {parsedBlocks.length > 0 ? (
              renderPreviewContent()
            ) : (
              <div className="flex min-h-[52vh] flex-col items-center justify-center text-center text-slate-400">
                <Sparkles className="mb-4 h-12 w-12 opacity-40" />
                <p className="text-lg font-bold text-slate-500">{t('workspace.emptyTitle')}</p>
                <p className="mt-2 max-w-sm text-sm leading-6">{t('workspace.emptyDescription')}</p>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
};
