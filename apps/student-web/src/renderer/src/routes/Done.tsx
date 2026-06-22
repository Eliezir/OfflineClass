import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createApi } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { useServerUrl } from '../lib/serverContext'

export default function DoneRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

  const meQuery = useQuery({
    queryKey: ['session', 'me', teacherUrl],
    queryFn: api.me,
    retry: false
  })

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
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10">
            <CheckCircle className="text-success size-6" />
          </div>
          <CardTitle>Prova enviada!</CardTitle>
          <CardDescription>
            Obrigado, {meQuery.data?.studentName ?? 'aluno'}. Suas respostas foram registradas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Você pode fechar esta janela ou voltar ao início.
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
