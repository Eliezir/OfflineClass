import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, WifiOff, Loader2, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentMenu } from '@/components/StudentMenu'
import { useServerUrl } from '../lib/serverContext'
import { loadProfile, type StudentProfile } from '../lib/studentProfile'

interface DiscoveredSession {
  url: string
  name: string
}

const SCAN_TIMEOUT_MS = 8000

type DiscoverStatus = 'scanning' | 'found' | 'empty'

export default function DiscoverRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const { teacherUrl, setTeacherUrl } = useServerUrl()
  const [status, setStatus] = useState<DiscoverStatus>('scanning')
  const [session, setSession] = useState<DiscoveredSession | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(loadProfile)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearScanTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const startScan = useCallback(() => {
    setStatus('scanning')
    setSession(null)
    clearScanTimeout()

    window.api?.discovery?.start?.()

    timeoutRef.current = setTimeout(() => {
      setStatus('empty')
    }, SCAN_TIMEOUT_MS)
  }, [clearScanTimeout])

  // In browser mode (loaded from teacher's server), we're already at the
  // correct origin — skip mDNS and go straight to Join.
  const isBrowser = !window.api
  useEffect(() => {
    if (isBrowser) {
      setTeacherUrl(window.location.origin)
      return
    }
    startScan()
    return () => clearScanTimeout()
  }, [isBrowser, startScan, clearScanTimeout])

  useEffect(() => {
    if (isBrowser) return
    const unsubscribe = window.api?.discovery?.onFound?.((result) => {
      clearScanTimeout()
      setSession(result)
      setStatus('found')
    })
    return () => unsubscribe?.()
  }, [isBrowser, clearScanTimeout])

  // Auto-advance to Join when in browser mode (already connected to teacher).
  useEffect(() => {
    if (isBrowser && teacherUrl) {
      navigate('/join', { replace: true })
    }
  }, [isBrowser, teacherUrl, navigate])

  const handleJoin = (): void => {
    if (!session) return
    setTeacherUrl(session.url)

    // If student already has a profile stored, skip the Join form and
    // go directly to waiting — the Join route will auto-join.
    if (profile) {
      navigate('/join', { replace: true })
    } else {
      navigate('/join', { replace: true })
    }
  }

  const handleRetry = (): void => {
    window.api?.discovery?.restart?.()
    startScan()
  }

  const handleProfileChange = (newProfile: StudentProfile | null): void => {
    setProfile(newProfile)
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      {/* ── Centre content ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/logo-icon.png"
            alt="OfflineClass"
            className="h-14 w-14 rounded-2xl shadow-sm"
          />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              OfflineClass
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Conecte-se à prova na rede local
            </p>
          </div>
        </div>

        {/* ── Browser mode — redirecting ───────────────────────────────── */}
        {isBrowser && (
          <Card className="w-full max-w-sm text-center">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="text-primary size-5 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Conectando ao servidor do professor…
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Scanning state ──────────────────────────────────────────── */}
        {!isBrowser && status === 'scanning' && (
          <Card className="w-full max-w-sm text-center">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <div className="border-border bg-muted/40 flex h-12 w-12 items-center justify-center rounded-full border">
                <Wifi className="text-muted-foreground size-5 animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Procurando salas ativas na rede local…
              </p>
              <Loader2 className="text-primary size-5 animate-spin" />
            </CardContent>
          </Card>
        )}

        {/* ── Found state ─────────────────────────────────────────────── */}
        {!isBrowser && status === 'found' && session && (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Sala encontrada</CardTitle>
              <CardDescription>
                Uma sessão do professor foi detectada na rede.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary-soft border-secondary-dark/20 rounded-2xl border p-4">
                <p className="text-secondary-soft-foreground text-xs font-semibold uppercase tracking-wider">
                  Sala detectada
                </p>
                <p className="text-secondary-soft-foreground mt-1 text-lg font-bold">
                  {session.name}
                </p>
                <a
                  href={session.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary mt-0.5 block truncate font-mono text-xs underline-offset-2 transition-colors hover:underline"
                >
                  {session.url}
                </a>
              </div>
              <Button onClick={handleJoin} className="w-full" size="lg">
                Entrar na sala
                <ArrowRight className="size-4" />
              </Button>
              <a
                href={session.url}
                target="_blank"
                rel="noreferrer"
                className="border-input-border bg-card text-foreground hover:bg-muted active:translate-y-[2px] active:shadow-[0_1px_0_var(--input-border)] shadow-[0_4px_0_var(--input-border)] inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border px-5 text-base font-bold tracking-tight no-underline transition-[background-color,color,box-shadow,opacity,transform] duration-150"
              >
                <ExternalLink className="size-4" />
                Abrir no navegador
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleRetry}
              >
                <RefreshCw className="size-3.5" />
                Verificar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {!isBrowser && status === 'empty' && (
          <Card className="w-full max-w-sm">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <WifiOff className="text-muted-foreground size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-semibold tracking-tight text-foreground">
                  Nenhuma sala encontrada
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nenhuma sessão ativa foi detectada na rede local. Verifique se:
                </p>
              </div>
              <ul className="text-muted-foreground w-full space-y-1.5 text-left text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-0.5 shrink-0">•</span>
                  O professor já abriu a sessão no app OfflineClass
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-0.5 shrink-0">•</span>
                  Você está conectado à mesma rede Wi-Fi que o professor
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-0.5 shrink-0">•</span>
                  Nenhum firewall está bloqueando a descoberta de rede
                </li>
              </ul>
              <Button onClick={handleRetry} className="w-full" size="lg">
                <RefreshCw className="size-4" />
                Verificar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Student profile chip (bottom-left, fixed) ─────────────────── */}
      <div className="fixed bottom-4 left-4 w-60">
        <StudentMenu onProfileChange={handleProfileChange} />
      </div>
    </main>
  )
}
