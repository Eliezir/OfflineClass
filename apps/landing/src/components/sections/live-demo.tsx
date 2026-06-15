import { useState } from 'react'
import { ExternalLink, MousePointerClick } from 'lucide-react'
import { site } from '@/content'

/**
 * Embeds a real published presentation in a browser frame. It IS the product's
 * output — visitors can click, navigate and interact with it live.
 */
export function LiveDemo() {
  const { url, title } = site.featuredDemo
  const [active, setActive] = useState(false)

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      {/* chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <span className="mx-auto truncate font-mono text-xs text-muted-foreground">
          {title}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium transition-colors hover:border-primary/50"
          aria-label="Abrir em nova aba"
        >
          <ExternalLink className="size-3" />
          Abrir
        </a>
      </div>

      {/* live presentation */}
      <div className="relative aspect-[16/10] bg-background">
        <iframe
          src={url}
          title={title}
          loading="lazy"
          className="size-full"
          allow="fullscreen"
        />
        {/* click-to-interact veil so page scroll isn't captured until the user opts in */}
        {!active && (
          <button
            onClick={() => setActive(true)}
            className="absolute inset-0 grid place-items-center bg-background/40 backdrop-blur-[1px] transition-opacity hover:bg-background/30"
            aria-label="Ativar interação com a apresentação"
          >
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg">
              <MousePointerClick className="size-4 text-primary" />
              Clique para interagir
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
