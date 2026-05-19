import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function HomeRoute(): React.JSX.Element {
  const { teacher } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const discovery = useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: api.discovery.getStatus
  })

  const onLogout = async (): Promise<void> => {
    await api.auth.logout()
    await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    navigate('/login', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">OfflineClass</p>
          <h1 className="text-3xl font-semibold">Olá, {teacher?.name}</h1>
          <p className="text-muted-foreground text-sm">{teacher?.email}</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Sair
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provas</CardTitle>
            <CardDescription>Crie e edite provas para aplicar na sala.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="secondary">
              Em breve (Stage 2)
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aplicar prova</CardTitle>
            <CardDescription>Inicie uma sessão para os alunos entrarem pela LAN.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="secondary">
              Em breve (Stage 3)
            </Button>
          </CardContent>
        </Card>
      </section>

      {discovery.data && (
        <Card>
          <CardHeader>
            <CardTitle>Servidor local</CardTitle>
            <CardDescription>Endereços que os alunos podem usar para conectar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <img
              src={discovery.data.qrDataUrl}
              alt="QR para URL da sala"
              className="border-border rounded-lg border p-1"
              width={160}
              height={160}
            />
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">URL</dt>
                <dd className="font-mono">
                  http://{discovery.data.lanIp}:{discovery.data.port}/
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">mDNS</dt>
                <dd className="font-mono">{discovery.data.mdnsName}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
