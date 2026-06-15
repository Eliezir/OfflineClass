import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, MapPin, BookMarked } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { BorderBeam } from '@/components/magicui/border-beam'
import { SectionHeading } from './shared'
import { useGithubUsers } from '@/hooks/use-github-users'
import { cn } from '@/lib/utils'
import { site } from '@/content'

export function Team() {
  const users = useGithubUsers(site.team)
  const [selected, setSelected] = useState(0)
  const active = users[selected]

  return (
    <section id="equipe" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Equipe"
        title="Quem está por trás"
        description="Projeto da disciplina de Programação Orientada a Objetos — IFAL. Selecione um integrante para conhecê-lo."
        center
      />

      <BlurFade delay={0.2} className="mt-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* avatar picker */}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
            {users.map((u, i) => (
              <button
                key={u.login}
                onClick={() => setSelected(i)}
                aria-pressed={i === selected}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all',
                  i === selected
                    ? 'border-primary bg-accent/50'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <img
                  src={u.avatar_url}
                  alt={u.name}
                  loading="lazy"
                  className={cn(
                    'size-16 rounded-full object-cover ring-2 transition-all sm:size-20',
                    i === selected ? 'ring-primary' : 'ring-transparent group-hover:ring-border',
                  )}
                />
                <span className="text-center text-xs font-medium leading-tight">
                  {u.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* detail */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
            <BorderBeam size={120} duration={12} />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.login}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={active.avatar_url}
                    alt={active.name}
                    className="size-20 rounded-2xl object-cover ring-1 ring-border"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{active.name}</h3>
                    <a
                      href={active.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      @{active.login}
                    </a>
                  </div>
                </div>

                <p className="mt-5 text-pretty text-muted-foreground">
                  {active.bio?.trim() ||
                    'Integrante da equipe do Apresenta.AI — projeto de Programação Orientada a Objetos do IFAL.'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {active.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                      <MapPin className="size-3.5" />
                      {active.location}
                    </span>
                  )}
                  {active.public_repos != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                      <BookMarked className="size-3.5" />
                      {active.public_repos} repositórios
                    </span>
                  )}
                  <a
                    href={active.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <ExternalLink className="size-3.5" />
                    Ver no GitHub
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Orientação: <strong className="text-foreground">{site.advisor}</strong>
        </p>
      </BlurFade>
    </section>
  )
}
