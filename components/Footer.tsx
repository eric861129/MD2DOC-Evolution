/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto bg-white border-t border-slate-200">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-slate-500 font-medium">
          © 2025 EricHuang. All rights reserved.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Designed for Technical Book Publishing
        </p>
      </div>
    </footer>
  );
};

export default Footer;
