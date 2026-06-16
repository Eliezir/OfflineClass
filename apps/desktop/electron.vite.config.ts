import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { lingui } from '@lingui/vite-plugin'
import { findFreePort } from './scripts/findFreePort'

export default defineConfig(async () => {
  const port = await findFreePort(5173)

  const sharedAlias = {
    '@shared': resolve('src/shared'),
    '@main': resolve('src/main')
  }

  return {
    main: {
      resolve: { alias: sharedAlias },
      // Keep node deps (the Claude Agent SDK, which spawns a bundled native
      // binary) external so they resolve from node_modules at runtime instead
      // of being inlined into the main bundle.
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      resolve: { alias: sharedAlias },
      build: {
        rollupOptions: {
          // Two preload entries: the main window bridge and the splash bridge.
          input: {
            index: resolve('src/preload/index.ts'),
            splash: resolve('src/preload/splash.ts')
          }
        }
      }
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@shared': resolve('src/shared')
        }
      },
      plugins: [
        tanstackRouter({ target: 'react', autoCodeSplitting: true }),
        // lingui() permite importar arquivos .po como módulos;
        // o babel macro transforma `t`/`Trans`/`msg` em tempo de compilação.
        lingui(),
        react({ babel: { plugins: ['@lingui/babel-plugin-lingui-macro'] } }),
        tailwindcss()
      ],
      server: {
        port,
        strictPort: true,
        proxy: {
          '/api': 'http://localhost:8080'
        }
      }
    }
  }
})
