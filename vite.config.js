import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/blog/',
  build: {
    outDir: 'dist',
    copyPublicDir: true
  },
  assetsInclude: ['**/*.md'],
  publicDir: 'public'
})