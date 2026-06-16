import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Home } from '@/pages/home'
import { DownloadPage } from '@/pages/download-page'
import { ReleasesPage } from '@/pages/releases-page'
import { DocsPage } from '@/pages/docs-page'

// import.meta.env.BASE_URL is '/' in dev and '/OfflineClass/' on Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename || '/'}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
