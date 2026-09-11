/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

/**
 * Standalone offline build. Produces a single self-contained HTML file
 * (`dist/offline-app.html`) with every script and style inlined and code
 * splitting disabled, so a user can download ONE file and open it with no
 * internet and no server — everything still works from file://.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: './',
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
})
