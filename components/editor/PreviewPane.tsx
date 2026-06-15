/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Maximize2, Minus, Plus, Sparkles } from 'lucide-react';
import { BlockType, ParsedBlock } from '../../services/types';
import { PreviewBlock, RenderRichText } from './PreviewRenderers';
import { UI_THEME } from '../../constants/theme';
import { useEditor } from '../../contexts/EditorContext';
import { IconButton } from '../ui/IconButton';

interface PreviewPaneProps {
  parsedBlocks: ParsedBlock[];
  previewRef: React.RefObject<HTMLDivElement>;
}

const renderList = (items: ParsedBlock[], type: BlockType) => {
  const ListTag = type === BlockType.BULLET_LIST ? 'ul' : 'ol';

  return (
    <ListTag className={`mb-8 ml-8 ${type === BlockType.NUMBERED_LIST ? 'list-decimal' : ''}`}>
      {items.map((item, index) => (
        <li
          key={`${item.content}-${index}`}
          style={{ marginLeft: `${(item.nestingLevel || 0) * 1.5}rem` }}
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
  const { t } = useEditor();
  const [zoom, setZoom] = React.useState(1);

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
        elements.push(<React.Fragment key={`${listType}-${index}`}>{renderList(listItems, listType)}</React.Fragment>);
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Word page simulation</p>
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
        className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(52,90,112,0.10),transparent_34rem)] p-5 scroll-smooth md:p-8"
      >
        <div
          className="mx-auto origin-top transition-transform duration-300"
          style={{
            maxWidth: '860px',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <article
            className="print-paper min-h-[980px] rounded-md px-8 py-10 text-slate-950 md:px-14 md:py-14"
            style={{ fontFamily: UI_THEME.FONTS.PREVIEW }}
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
