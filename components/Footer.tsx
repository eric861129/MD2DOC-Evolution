/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';
import { Github } from 'lucide-react';
import { APP_VERSION, GITHUB_URL } from '../constants/meta';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-1 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container mx-auto px-8 flex justify-between items-center">
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-tight">
          <span className="text-slate-500 dark:text-slate-400">
            © 2025 <span style={{ color: 'var(--brand-primary)' }}>EricHuang</span>
          </span>
          <div className="w-px h-2 bg-slate-300 dark:bg-slate-700" />
          <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Designed for Technical Book Publishing | v{APP_VERSION}
          </span>
        </div>
        
        <a 
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover-brand transition-colors text-[10px] font-bold"
        >
          <Github className="w-3 h-3" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;