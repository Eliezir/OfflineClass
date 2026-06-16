import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading } from './shared'
import { useContributors, type Contributor } from '@/hooks/use-contributors'
import { site } from '@/content'

/** Static fallback (from site.json) used only if the GitHub API is unavailable. */
const FALLBACK: Contributor[] = site.team.map((m) => ({
  login: m.github,
  name: m.name,
  avatar_url: `https://github.com/${m.github}.png?size=240`,
  html_url: `https://github.com/${m.github}`,
  contributions: 0,
}))

export function Team() {
  const contributors = useContributors(site.repo.owner, site.repo.name)
  const members = contributors.length > 0 ? contributors : FALLBACK

  return (
    <section id="equipe" className="scroll-mt-24 border-y border-border bg-card/30 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          center
          eyebrow="Equipe"
          title="Quem está por trás"
          description="Contribuidores do projeto, direto do GitHub — quem commita, aparece aqui."
        />

        <BlurFade delay={0.2} className="mt-12">
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-3">
            {members.map((u) => (
              <a
                key={u.login}
                href={u.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/40"
              >
                <img
                  src={u.avatar_url}
                  alt={u.name}
                  loading="lazy"
                  className="size-20 rounded-2xl object-cover ring-1 ring-border transition-all group-hover:ring-primary"
                />
                <div>
                  <h3 className="font-bold">{u.name}</h3>
                  <span className="text-sm font-semibold text-primary">@{u.login}</span>
                </div>
              </a>
            ))}
          </div>

          {site.advisor && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Orientação: <strong className="text-foreground">{site.advisor}</strong>
            </p>
          )}
        </BlurFade>
      </div>
    </section>
  )
}
