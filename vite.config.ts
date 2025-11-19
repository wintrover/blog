import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess({ script: true }) })],
  base: '/blog/',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  assetsInclude: ['**/*.md'],
  publicDir: 'public',
  server: {
    historyApiFallback: true
  },
  preview: {
    historyApiFallback: true
  }
})