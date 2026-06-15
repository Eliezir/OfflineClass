import path from 'node:path'
import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project at /apresenta.ai/. In dev we use '/' so
// localhost is clean. The router reads import.meta.env.BASE_URL for its basename.
const PAGES_BASE = '/apresenta.ai/'

// Known client-side routes. Each gets a static index.html shell so GitHub Pages
// serves it with HTTP 200 (crawlable/indexable) instead of a soft-404.
const ROUTES = ['download', 'releases', 'docs']

// Emit per-route shells + a 404.html fallback (for any other deep link / refresh)
// — all copies of index.html; React Router renders the right page on load.
function spaFallback(): Plugin {
  return {
    name: 'spa-route-shells',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (!fs.existsSync(index)) return
      fs.copyFileSync(index, path.join(dist, '404.html'))
      for (const route of ROUTES) {
        const dir = path.join(dist, route)
        fs.mkdirSync(dir, { recursive: true })
        fs.copyFileSync(index, path.join(dir, 'index.html'))
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
}))
