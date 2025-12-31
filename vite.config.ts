import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    // 優先讀取 VITE_BASE_URL，這是從 GitHub Actions 傳入的
    const baseUrl = env.VITE_BASE_URL || '/BookPublisher_MD2Doc/';

    return {
      base: baseUrl,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 將 BASE_URL 注入到前端代碼中，方便 Router 或圖片引用
        'import.meta.env.BASE_URL': JSON.stringify(baseUrl)
      }
    };
});