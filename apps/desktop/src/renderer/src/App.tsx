import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { api } from './lib/api'

function App(): React.JSX.Element {
  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: api.discovery.getStatus
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-10">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          OfflineClass — debug
        </p>
        <h1 className="text-3xl font-semibold">Stage 0 · Foundation</h1>
        <p className="text-muted-foreground text-sm">
          LAN-reachable HTTP + WebSocket server, mDNS broadcast and join URL QR.
        </p>
      </header>

      {isPending && <p className="text-muted-foreground text-sm">Probing discovery…</p>}
      {error && (
        <p className="text-destructive text-sm">Failed to load discovery: {String(error)}</p>
      )}

      {data && (
        <section className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <img
            src={data.qrDataUrl}
            alt="Join URL QR code"
            className="border-border bg-background rounded-lg border p-2"
            width={224}
            height={224}
          />
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs uppercase">LAN URL</dt>
              <dd className="font-mono text-base">
                http://{data.lanIp}:{data.port}/
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">mDNS name</dt>
              <dd className="font-mono text-base">{data.mdnsName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Health probe</dt>
              <dd className="font-mono text-base">
                curl http://{data.lanIp}:{data.port}/api/health
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">WebSocket</dt>
              <dd className="font-mono text-base">
                ws://{data.lanIp}:{data.port}/api/ws
              </dd>
            </div>
          </dl>
        </section>
      )}

      <footer className="border-border border-t pt-4">
        <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </footer>
    </div>
  )
}

export default App
