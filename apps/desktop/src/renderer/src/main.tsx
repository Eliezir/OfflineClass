import './shared/styles/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from './app/providers'
import { router } from './app/router'
import { initI18n } from './shared/i18n'

// Ativa o locale (pt-BR por padrão) antes de renderizar a árvore React.
initI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
