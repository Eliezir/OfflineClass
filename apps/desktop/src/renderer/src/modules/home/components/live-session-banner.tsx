import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import type { LiveSession } from '../types'

type LiveSessionBannerProps = {
  session: LiveSession
}

/** Featured strip shown when a session is running. Links to the live panel. */
export function LiveSessionBanner({ session }: LiveSessionBannerProps): React.JSX.Element {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.28)]"
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold">
          <Trans>Sessão ao vivo</Trans> · {session.provaTitle}
        </div>
        <div className="text-sm font-semibold opacity-90">
          <Trans>
            {session.groups} grupos · {session.students} alunos · {session.minutesLeft} min
            restantes
          </Trans>
        </div>
      </div>
      <Button asChild variant="secondary" className="ml-auto">
        <Link to="/sessao">
          <Trans>Abrir painel</Trans>
          <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
