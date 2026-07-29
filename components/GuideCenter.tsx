import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Search,
} from 'lucide-react';
import saveAs from 'file-saver';
import completeZh from '../content/examples/complete.zh.md?raw';
import { parseMarkdown } from '../services/markdownParser';
import {
  GuideBlock,
  GuideInline,
  GuideSection,
  isSafeGuideHref,
  parseGuideInline,
  searchGuideSections,
  USER_GUIDE_DOCUMENT,
} from '../services/userGuide';
import type { ExportSettings } from '../services/docx/layout/types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface GuideCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPLETE_EXAMPLE_SETTINGS: ExportSettings = {
  profileId: 'publisher-narrow',
  pageSizeId: 'tech',
  marginPresetId: 'narrow',
};

const InlineContent: React.FC<{ content: string }> = ({ content }) => (
  <>
    {parseGuideInline(content).map((inline: GuideInline, index) => {
      const key = `${inline.type}-${index}`;
      switch (inline.type) {
        case 'strong':
          return <strong key={key}>{inline.text}</strong>;
        case 'emphasis':
          return <em key={key}>{inline.text}</em>;
        case 'code':
          return (
            <code
              key={key}
              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            >
              {inline.text}
            </code>
          );
        case 'link':
          return isSafeGuideHref(inline.href) ? (
            <a
              key={key}
              href={inline.href}
              target={inline.href.startsWith('http') ? '_blank' : undefined}
              rel={inline.href.startsWith('http') ? 'noreferrer noopener' : undefined}
              className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 dark:text-sky-300"
            >
              {inline.text}
            </a>
          ) : <span key={key}>{inline.text}</span>;
        case 'text':
          return <React.Fragment key={key}>{inline.text}</React.Fragment>;
      }
    })}
  </>
);

const GuideBlockView: React.FC<{ block: GuideBlock }> = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
          <InlineContent content={block.content} />
        </p>
      );
    case 'heading':
      return (
        <h3 className="pt-3 text-lg font-bold text-slate-950 dark:text-white">
          <InlineContent content={block.content} />
        </h3>
      );
    case 'quote':
      return (
        <aside className="border-l-4 border-sky-500 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
          <InlineContent content={block.content} />
        </aside>
      );
    case 'code':
      return (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950">
          {block.language && (
            <div className="border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {block.language}
            </div>
          )}
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag className={`space-y-2 pl-6 text-sm leading-7 text-slate-700 dark:text-slate-200 ${
          block.ordered ? 'list-decimal' : 'list-disc'
        }`}>
          {block.items.map((item, index) => (
            <li key={`${item}-${index}`}>
              <InlineContent content={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
              <tr>
                {block.headers.map((header, index) => (
                  <th key={`${header}-${index}`} className="border-b border-slate-200 px-3 py-2 font-bold dark:border-slate-800">
                    <InlineContent content={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b border-slate-100 last:border-0 dark:border-slate-900">
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top text-slate-700 dark:text-slate-200">
                      <InlineContent content={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'rule':
      return <hr className="border-slate-200 dark:border-slate-800" />;
  }
};

const SectionContent: React.FC<{
  section: GuideSection;
  showIntroduction: boolean;
}> = ({ section, showIntroduction }) => (
  <article aria-labelledby={`guide-title-${section.id}`} className="space-y-4">
    {showIntroduction && USER_GUIDE_DOCUMENT.introduction.map((block, index) => (
      <GuideBlockView key={`intro-${index}`} block={block} />
    ))}
    <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
        使用教學
      </div>
      <h2 id={`guide-title-${section.id}`} className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
        {section.title}
      </h2>
    </div>
    {section.blocks.map((block, index) => (
      <GuideBlockView key={`${section.id}-${index}`} block={block} />
    ))}
  </article>
);

export const GuideCenter: React.FC<GuideCenterProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(
    USER_GUIDE_DOCUMENT.sections[0]?.id ?? '',
  );
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => searchGuideSections(USER_GUIDE_DOCUMENT, query),
    [query],
  );

  useEffect(() => {
    if (
      visibleSections.length > 0
      && !visibleSections.some((section) => section.id === activeSectionId)
    ) {
      setActiveSectionId(visibleSections[0].id);
    }
  }, [activeSectionId, visibleSections]);

  const activeIndex = visibleSections.findIndex(
    (section) => section.id === activeSectionId,
  );
  const activeSection = activeIndex >= 0 ? visibleSections[activeIndex] : undefined;

  const downloadMarkdown = () => {
    setDownloadError(null);
    saveAs(
      new Blob([completeZh], { type: 'text/markdown;charset=utf-8' }),
      'MD2DOC-Evolution_中文完整功能稿.md',
    );
  };

  const downloadDocx = async () => {
    setIsGeneratingDocx(true);
    setDownloadError(null);
    try {
      const { blocks, meta } = parseMarkdown(completeZh);
      const { generateDocx } = await import('../services/docxGenerator');
      const blob = await generateDocx(blocks, {
        exportSettings: COMPLETE_EXAMPLE_SETTINGS,
        showLineNumbers: true,
        meta,
        imageRegistry: {},
      });
      saveAs(blob, 'MD2DOC-Evolution_中文完整功能稿_窄邊界.docx');
    } catch (error) {
      console.error('產生教學範例 DOCX 失敗：', error);
      setDownloadError('範例 DOCX 產生失敗，請確認瀏覽器允許下載並稍後再試。');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const moveSection = (offset: number) => {
    const target = visibleSections[activeIndex + offset];
    if (target) setActiveSectionId(target.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={USER_GUIDE_DOCUMENT.title}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>從 Markdown 結構、版型到 Word 換頁與交付檢查。</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={downloadMarkdown}>
              <FileText className="h-4 w-4" />
              完整範例 Markdown
            </Button>
            <Button
              type="button"
              onClick={downloadDocx}
              isLoading={isGeneratingDocx}
            >
              <Download className="h-4 w-4" />
              {isGeneratingDocx ? '產生 DOCX…' : '完整範例 DOCX'}
            </Button>
          </div>
        </div>

        {downloadError && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {downloadError}
          </div>
        )}

        <div className="grid min-h-[58vh] gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <label className="relative block">
              <span className="sr-only">搜尋教學</span>
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋語法、邊界、換頁…"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <nav aria-label="教學章節" className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto pr-1">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  aria-current={section.id === activeSectionId ? 'page' : undefined}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold leading-5 transition-colors ${
                    section.id === activeSectionId
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  {section.title}
                </button>
              ))}
              {visibleSections.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  找不到符合條件的章節。
                </p>
              )}
            </nav>
          </aside>

          <div className="min-w-0 rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 md:p-7">
            {activeSection && (
              <>
                <SectionContent
                  section={activeSection}
                  showIntroduction={!query && activeIndex === 0}
                />
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={activeIndex <= 0}
                    onClick={() => moveSection(-1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一章
                  </Button>
                  <span className="text-xs font-semibold text-slate-500">
                    {activeIndex + 1} / {visibleSections.length}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={activeIndex >= visibleSections.length - 1}
                    onClick={() => moveSection(1)}
                  >
                    下一章
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
