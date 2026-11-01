import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  build: { rollupOptions: { output: { manualChunks: { math: ['katex'], vendor: ['react', 'react-dom', 'zustand'] } } } },
})
