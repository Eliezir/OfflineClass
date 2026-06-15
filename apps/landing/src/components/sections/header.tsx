import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, Github, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { site } from '@/content'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  const isActive = (to: string) => !to.includes('#') && to !== '/' && pathname === to

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:pt-4">
      <div className="container-page">
        {/* floating island */}
        <div
          className={cn(
            'flex h-14 items-center gap-3 rounded-2xl border px-3 transition-all duration-300 sm:px-4',
            scrolled || open
              ? 'border-border bg-background/80 shadow-lg shadow-black/[0.03] backdrop-blur-xl'
              : 'border-border/60 bg-background/50 backdrop-blur-md',
          )}
        >
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <Logo className="size-9" />
            <span className="text-[0.95rem]">
              Offline<span className="text-primary">Class</span>
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {site.nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive(n.to)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild aria-label="GitHub">
              <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                <Github className="size-4.5" />
              </a>
            </Button>
            <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
              <Link to="/download">
                <Download className="size-4" />
                Baixar
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </Button>
          </div>
        </div>

        {/* mobile menu — floating panel */}
        {open && (
          <nav className="mt-2 flex flex-col gap-1 rounded-2xl border border-border bg-background/90 p-2 shadow-lg backdrop-blur-xl md:hidden">
            {site.nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  'rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive(n.to)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                {n.label}
              </Link>
            ))}
            <Button asChild className="mt-1 rounded-xl">
              <Link to="/download">
                <Download className="size-4" />
                Baixar
              </Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
