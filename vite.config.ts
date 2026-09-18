import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Порт 1420 — стандарт Tauri (см. src-tauri/tauri.conf.json, build.devUrl).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
