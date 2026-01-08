/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          © 2025 EricHuang. All rights reserved.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
Designed for Technical Book Publishing | v1.2.5
        </p>
      </div>
    </footer>
  );
};

export default Footer;