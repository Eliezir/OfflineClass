import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'

export default function DoneRoute(): React.JSX.Element {
  const navigate = useNavigate()

  const meQuery = useQuery({
    queryKey: ['session', 'me'],
    queryFn: api.me,
    retry: false
  })

  useEffect(() => {
    if (!loadToken()) navigate('/', { replace: true })
  }, [navigate])

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Prova enviada</CardTitle>
          <CardDescription>
            Obrigado, {meQuery.data?.studentName ?? 'aluno'}. Você pode fechar esta aba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              clearToken()
              navigate('/', { replace: true })
            }}
          >
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
