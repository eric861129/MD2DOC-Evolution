/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025-2026 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { Github, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, GITHUB_URL } from '../constants/meta';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-200/70 bg-white/60 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
        <div className="flex min-w-0 items-center gap-3 font-medium text-slate-500 dark:text-slate-400">
          <span className="truncate">
            (c) 2025-2026 <span className="text-[var(--brand-primary)]">EricHuang</span>
          </span>
          <span className="hidden h-3 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
          <span className="hidden truncate sm:block">
            Designed for technical book publishing | v{APP_VERSION}
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-brand inline-flex items-center gap-1.5 font-semibold text-slate-600 transition-colors dark:text-slate-300"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href="https://portaly.cc/Chiyuisme/support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/10 px-3 font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
          >
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('support')}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
