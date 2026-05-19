import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// @offlineclass/shared is a TS-source workspace package. If externalized, the
// packaged main/preload would `require()` its package.json's `main` (a .ts
// file) and crash. Inline-bundle it instead; everything else stays external.
const SHARED = ['@offlineclass/shared']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: SHARED })]
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: SHARED })]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
