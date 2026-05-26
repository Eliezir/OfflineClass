import { useEffect, useState } from 'react'
import { MoonStar, Sun } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import logoLight from '@renderer/shared/assets/logo-light.png'
import logoDark from '@renderer/shared/assets/logo-dark.png'
import { Button } from '@renderer/shared/ui/button'

export const Route = createFileRoute('/')({
  component: IndexPage
})

function IndexPage(): React.JSX.Element {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-canvas text-foreground">
      <img
        src={isDark ? logoDark : logoLight}
        alt="OfflineClass"
        className="size-24 drop-shadow-sm"
      />
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Offline
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--gradient-ai)' }}
          >
            Class
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Scaffold pronto.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => setIsDark((v) => !v)}>
        {isDark ? <Sun /> : <MoonStar />}
        {isDark ? 'Tema claro' : 'Tema escuro'}
      </Button>
    </div>
  )
}
