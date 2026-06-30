import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import './index.css'
import { queryClient } from './lib/queryClient'
import { router } from './lib/router'
import { ServerProvider } from './lib/serverContext'
import { ThemeProvider } from './lib/ThemeProvider'

async function bootstrap(): Promise<void> {
  // Dev-only: serve a fixture exam standalone in the browser (`pnpm dev:web:mock`).
  if (import.meta.env.VITE_MOCK === '1') {
    const { installDevMock } = await import('./lib/devMock')
    installDevMock()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ServerProvider>
            <RouterProvider router={router} />
          </ServerProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

void bootstrap()
