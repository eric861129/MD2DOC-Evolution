import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      // 改用相對路徑，增加部署靈活性
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        chunkSizeWarningLimit: 1000, // 提高警告門檻至 1MB
        rollupOptions: {
          output: {
            manualChunks: {
              docx: ['docx'],
              vendor: ['react', 'react-dom', 'lucide-react', 'file-saver'],
            },
          },
        },
      },
    };
});
