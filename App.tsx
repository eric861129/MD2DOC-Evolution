/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';
import MarkdownEditor from './components/MarkdownEditor';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <MarkdownEditor />
      </main>
      <Footer />
    </div>
  );
};

export default App;
