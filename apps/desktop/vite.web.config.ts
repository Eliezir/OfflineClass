import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { resolve } from 'path'
import { findFreePort } from './scripts/findFreePort'

// Standalone Vite config para rodar o renderer no navegador (sem Electron).
// Útil dentro do devcontainer/Codespaces, onde a janela nativa não pode ser
// aberta. O app final continua sendo Electron — esse modo é só pra DX.
export default defineConfig(async () => {
  const port = await findFreePort(5173)

  return {
    root: resolve(__dirname, 'src/renderer'),
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true
    }
  }
})
