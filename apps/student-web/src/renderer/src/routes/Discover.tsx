import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, WifiOff, Loader2, ArrowRight, School, RefreshCw } from 'lucide-react'

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
  const { setTeacherUrl } = useServerUrl()
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

  useEffect(() => {
    startScan()
    return () => clearScanTimeout()
  }, [startScan, clearScanTimeout])

  useEffect(() => {
    const unsubscribe = window.api?.discovery?.onFound?.((result) => {
      clearScanTimeout()
      setSession(result)
      setStatus('found')
    })
    return () => unsubscribe?.()
  }, [clearScanTimeout])

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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft shadow-sm">
            <School className="text-primary size-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              OfflineClass
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Conecte-se à prova na rede local
            </p>
          </div>
        </div>

        {/* ── Scanning state ──────────────────────────────────────────── */}
        {status === 'scanning' && (
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
        {status === 'found' && session && (
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
                <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                  {session.url}
                </p>
              </div>
              <Button onClick={handleJoin} className="w-full" size="lg">
                {profile ? 'Entrar na sala' : 'Entrar na sala'}
                <ArrowRight className="size-4" />
              </Button>
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
        {status === 'empty' && (
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
