import { serve, type ServerType } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'

export interface ServerHandle {
  port: number
  stop: () => Promise<void>
}

export async function startServer(port: number): Promise<ServerHandle> {
  const app = new Hono()
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get(
    '/api/ws',
    upgradeWebSocket(() => ({
      onOpen: () => console.log('[ws] client connected'),
      onMessage: (event, ws) => {
        ws.send(JSON.stringify({ type: 'echo', payload: event.data }))
      },
      onClose: () => console.log('[ws] client disconnected')
    }))
  )

  const server = await new Promise<ServerType>((resolve) => {
    const s = serve(
      {
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0'
      },
      () => resolve(s)
    )
  })

  injectWebSocket(server)

  return {
    port,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      })
  }
}
