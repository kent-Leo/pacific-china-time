import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'] },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
