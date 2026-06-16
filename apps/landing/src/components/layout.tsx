import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './sections/header'
import { Footer } from './sections/footer'
import { ScrollProgress } from './magicui/scroll-progress'
import { ReleasesProvider } from '@/hooks/releases-context'
import { applySeo } from '@/lib/seo'

function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    applySeo(pathname)
  }, [pathname])
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash, key])
  return null
}

export function Layout() {
  return (
    <ReleasesProvider>
      <ScrollProgress />
      <ScrollManager />
      <Header />
      <main id="top">
        <Outlet />
      </main>
      <Footer />
    </ReleasesProvider>
  )
}
