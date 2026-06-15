import { Link } from 'react-router-dom'
import { asset } from '@/lib/asset'
import { Logo } from '@/components/logo'
import { site } from '@/content'

export function Footer() {
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Logo className="size-10" />
              <span>
                Offline<span className="text-primary">Class</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {site.product.tagline}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{site.course}</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm">
              {site.nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-foreground/80 hover:text-primary">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Projeto
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-primary">
                  Repositório no GitHub
                </a>
              </li>
              <li>
                <a href={asset('tecnica/')} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-primary">
                  Documentação técnica
                </a>
              </li>
              <li>
                <a href={`${repoUrl}/releases`} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-primary">
                  Todos os releases
                </a>
              </li>
              <li>
                <Link to="/#equipe" className="text-foreground/80 hover:text-primary">
                  Equipe
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>© {site.product.name}</span>
          <span className="text-pretty">{site.footerNote}</span>
        </div>
      </div>
    </footer>
  )
}
