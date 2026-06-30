import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/index.css'
import { ThemeProvider } from '@/lib/ThemeProvider'
import AvatarPreviewRoute from '@/routes/AvatarPreview'

// Standalone preview entry — just the avatar editor, no router / Electron
// providers (so it runs in a plain browser for screenshots). Open /avatar.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="bg-background flex h-screen flex-col">
        <AvatarPreviewRoute />
      </div>
    </ThemeProvider>
  </StrictMode>
)
