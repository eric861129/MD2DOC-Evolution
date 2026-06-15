/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import '@fontsource/geist/900.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/600.css';
import './globals.css';
import './services/i18n'; // Initialize i18n

const browserGlobal = globalThis as unknown as {
  Buffer?: typeof Buffer;
  process?: { env: Record<string, string | undefined> };
};

browserGlobal.Buffer = browserGlobal.Buffer || Buffer;
browserGlobal.process = browserGlobal.process || { env: {} };

const container = document.getElementById('root');

if (!container) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
