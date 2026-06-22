import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WifiOff, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearToken, loadToken } from '../lib/session'
import { useServerUrl } from '../lib/serverContext'

export default function EndedRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const { teacherUrl } = useServerUrl()

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

  useEffect(() => {
    if (!loadToken()) navigate('/', { replace: true })
  }, [navigate])

  const handleLeave = (): void => {
    clearToken()
    navigate('/', { replace: true })
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <WifiOff className="text-muted-foreground size-6" />
          </div>
          <CardTitle>Sessão encerrada</CardTitle>
          <CardDescription>
            O professor encerrou a sessão. A prova não está mais disponível.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Se você estava respondendo, entre em contato com o professor
            para saber sobre suas respostas.
          </p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleLeave}
          >
            <ArrowLeft className="size-4" />
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
