/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMarkdownEditor } from '../hooks/useMarkdownEditor';
import { useDarkMode } from '../hooks/useDarkMode';
import { EditorProvider } from '../contexts/EditorContext';
import { EditorHeader } from './editor/EditorHeader';
import { QuickActionSidebar } from './editor/QuickActionSidebar';
import { EditorPane } from './editor/EditorPane';
import { PreviewPane } from './editor/PreviewPane';
import Footer from './Footer';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const MarkdownEditor: React.FC = () => {
  const darkModeState = useDarkMode();
  const editorState = useMarkdownEditor();
  const [splitPercent, setSplitPercent] = React.useState(50);
  const [activeMobilePanel, setActiveMobilePanel] = React.useState<'editor' | 'preview'>('editor');
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const isResizing = React.useRef(false);

  const {
    content,
    setContent,
    parsedBlocks,
    wordCount,
    textareaRef,
    previewRef,
    handleScroll,
  } = editorState;

  useGSAP(
    () => {
      gsap.from('.workspace-reveal', {
        y: 16,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
      });

      gsap.from('.motion-panel', {
        scale: 0.98,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: workspaceRef.current,
          start: 'top bottom',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: workspaceRef }
  );

  const startResizing = React.useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    const railWidth = 88;
    const containerWidth = window.innerWidth - railWidth - 40;
    const mouseX = e.clientX - railWidth - 20;
    const newPercent = (mouseX / containerWidth) * 100;

    if (newPercent >= 28 && newPercent <= 72) {
      setSplitPercent(newPercent);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <EditorProvider editorState={editorState} darkModeState={darkModeState}>
      <main ref={workspaceRef} className="h-dvh w-full max-w-full overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="workspace-reveal">
            <EditorHeader
              activeMobilePanel={activeMobilePanel}
              onMobilePanelChange={setActiveMobilePanel}
            />
          </div>

          <section className="workspace-reveal min-h-0 flex-1 px-3 pb-3 pt-3 md:px-5 md:pb-5">
            <div className="flex h-full min-h-0 gap-3">
              <QuickActionSidebar />

              <div className="motion-panel flex min-w-0 flex-1 overflow-hidden rounded-md">
                <div
                  style={{ '--editor-width': `${splitPercent}%` } as React.CSSProperties}
                  className={`${activeMobilePanel === 'editor' ? 'flex' : 'hidden'} min-w-0 flex-col basis-full lg:flex lg:basis-[var(--editor-width)]`}
                >
                  <EditorPane
                    content={content}
                    setContent={setContent}
                    wordCount={wordCount}
                    textareaRef={textareaRef}
                    onScroll={handleScroll}
                  />
                </div>

                <div
                  onMouseDown={startResizing}
                  className="resizer-product hidden w-2 cursor-col-resize items-center justify-center border-x border-slate-200/70 transition-colors dark:border-slate-800 lg:flex"
                  aria-hidden="true"
                >
                  <div className="h-10 w-0.5 rounded-full bg-slate-300 transition-colors dark:bg-slate-700" />
                </div>

                <div
                  style={{ '--preview-width': `${100 - splitPercent}%` } as React.CSSProperties}
                  className={`${activeMobilePanel === 'preview' ? 'flex' : 'hidden'} min-w-0 flex-col basis-full lg:flex lg:basis-[var(--preview-width)]`}
                >
                  <PreviewPane parsedBlocks={parsedBlocks} previewRef={previewRef} />
                </div>
              </div>
            </div>
          </section>

          <div className="workspace-reveal">
            <Footer />
          </div>
        </div>
      </main>
    </EditorProvider>
  );
};

export default MarkdownEditor;
