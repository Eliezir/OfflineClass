import { useState, useEffect } from 'react'
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
  // 1. Mantemos o estado do cronômetro baseado nos minutos iniciais
  const [minutesLeft, setMinutesLeft] = useState(session.minutesLeft)
  const [prevMinutes, setPrevMinutes] = useState(session.minutesLeft)

  // 2. Sincronização Inline Segura: Se a propriedade mudou lá fora (via WebSocket/Query),
  // o React atualiza o estado imediatamente durante o fluxo atual de renderização.
  if (session.minutesLeft !== prevMinutes) {
    setMinutesLeft(session.minutesLeft)
    setPrevMinutes(session.minutesLeft)
  }

  // 3. Efeito do temporizador regressivo (atualiza a cada 1 minuto)
  useEffect(() => {
    if (minutesLeft <= 0) return

    const timer = setInterval(() => {
      setMinutesLeft((prev) => Math.max(0, prev - 1))
    }, 60000)

    return () => clearInterval(timer)
  }, [minutesLeft])

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
            {session.groups} grupos · {session.students} alunos · {minutesLeft} min restantes
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
