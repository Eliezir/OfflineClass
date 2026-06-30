import {
  makeJoinResult,
  makeSessionState,
  mockExam,
  mockSessionPublic
} from './devFixtures'

/**
 * Dev-only network mock. When enabled (`import.meta.env.VITE_MOCK === '1'`,
 * set by `pnpm dev:web:mock`), intercepts the student `/api/*` calls and the
 * WebSocket so the renderer runs entirely standalone in a browser against the
 * fixture exam. Lets us iterate on the student UI (theme, accessibility,
 * mobile layout) without a LAN backend. Tree-shaken out of the Electron build.
 */

let joinedName = 'Aluno de Teste'
let joinedMatricula = '0000-0000'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

async function route(path: string, init?: RequestInit): Promise<Response | null> {
  const method = (init?.method ?? 'GET').toUpperCase()

  if (path === '/api/session/active' && method === 'GET') return json(mockSessionPublic)

  if (path === '/api/join' && method === 'POST') {
    try {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      joinedName = body.name || joinedName
      joinedMatricula = body.matricula || joinedMatricula
    } catch {
      /* ignore malformed body */
    }
    return json(makeJoinResult(joinedName, joinedMatricula))
  }

  if (path === '/api/session/me' && method === 'GET')
    return json(makeSessionState(joinedName, joinedMatricula))

  if (path === '/api/exam/current' && method === 'GET') return json(mockExam)

  if (path === '/api/groups' && method === 'GET') return json([])

  // Fire-and-forget writes the UI doesn't read back.
  if (path === '/api/heartbeat' && method === 'POST') return json({ ok: true })
  if (path === '/api/answers' && method === 'POST') return json({ ok: true })
  if (path === '/api/submit' && method === 'POST') return json({ ok: true })
  if (path === '/api/leave' && method === 'POST') return json({ ok: true })
  if (path === '/api/profile/avatar' && method === 'POST') return json({ ok: true })

  return null
}

function toPath(input: RequestInfo | URL): string {
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return new URL(url, location.origin).pathname
  } catch {
    return String(input)
  }
}

export function installDevMock(): void {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = toPath(input)
    if (path.startsWith('/api/')) {
      const res = await route(path, init)
      if (res) return res
    }
    return realFetch(input, init)
  }

  // Silence the student WebSocket (group sync) — no LAN server to talk to.
  const RealWebSocket = window.WebSocket
  class NoopWebSocket extends EventTarget {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSING = 2
    static readonly CLOSED = 3
    readyState = NoopWebSocket.CLOSED
    binaryType = 'blob'
    constructor(url: string | URL) {
      super()
      if (!String(url).includes('/api/ws')) {
        // Not ours — fall back to the real socket via a thin proxy.
        return new RealWebSocket(url) as unknown as NoopWebSocket
      }
    }
    send(): void {}
    close(): void {}
  }
  window.WebSocket = NoopWebSocket as unknown as typeof WebSocket

  console.info('[student-web] dev mock enabled — serving the fixture exam.')
}
