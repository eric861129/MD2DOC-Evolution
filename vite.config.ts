import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: '/MD2DOC-Evolution/',
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          docx: ['docx'],
          i18n: ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
          markdown: ['buffer', 'js-yaml', 'marked', 'qrcode'],
          vendor: ['react', 'react-dom', 'lucide-react', 'file-saver'],
          motion: ['gsap', '@gsap/react'],
        },
      },
    },
  },
});
