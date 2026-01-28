/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './globals.css';
import './services/i18n'; // Initialize i18n

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
