/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  base: '/fir-filter-designer/',
  plugins: [react()],
  test: {
    testTimeout: 100000,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['html'],
      include: ['src'],
    },
  },
});
