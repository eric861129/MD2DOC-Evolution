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
    <footer className="w-full py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
            © 2025 EricHuang. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            Designed for Technical Book Publishing | v{APP_VERSION}
          </p>
        </div>
        
        <a 
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-full hover:bg-slate-800 dark:hover:bg-slate-700 transition-all text-sm font-bold shadow-lg shadow-slate-200 dark:shadow-none"
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;