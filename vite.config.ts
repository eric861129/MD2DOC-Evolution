import { readFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/MD2DOC-Evolution/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
  };
});
