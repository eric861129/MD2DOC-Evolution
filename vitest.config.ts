/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true, // Allow usage of describe, it, expect without import (optional but common)
    setupFiles: './tests/setup.ts', // I'll create this next
  },
});
