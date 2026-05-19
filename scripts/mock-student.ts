#!/usr/bin/env tsx
// Tiny harness for exercising the lobby + (later) session.started flow
// without running a browser. Posts /api/join, then keeps a WS open and
// logs every server event to stdout.
//
// Usage:
//   pnpm tsx scripts/mock-student.ts --name "Eliezir" --matricula "2024001"
// Optional flags:
//   --host 192.168.0.10   (defaults to 127.0.0.1)
//   --port 8000           (defaults to 8000)

interface Args {
  name: string
  matricula: string
  host: string
  port: number
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (!flag.startsWith('--')) continue
    const key = flag.slice(2)
    const val = args[i + 1]
    if (!val || val.startsWith('--')) continue
    out[key] = val
    i++
  }
  if (!out.name || !out.matricula) {
    console.error('Usage: tsx mock-student.ts --name "Foo" --matricula "12345" [--host x] [--port y]')
    process.exit(1)
  }
  return {
    name: out.name,
    matricula: out.matricula,
    host: out.host ?? '127.0.0.1',
    port: Number(out.port ?? 8000)
  }
}

async function main(): Promise<void> {
  const { name, matricula, host, port } = parseArgs()
  const base = `http://${host}:${port}`

  console.log(`[mock] joining ${base} as ${name} / ${matricula}`)
  const res = await fetch(`${base}/api/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, matricula })
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`[mock] join failed: HTTP ${res.status} — ${body}`)
    process.exit(2)
  }
  const join = (await res.json()) as {
    token: string
    studentId: string
    sessionId: string
    status: string
  }
  console.log(`[mock] joined: studentId=${join.studentId} sessionId=${join.sessionId} status=${join.status}`)

  const wsUrl = `ws://${host}:${port}/api/ws?role=student&token=${encodeURIComponent(join.token)}`
  console.log(`[mock] opening WS ${wsUrl}`)
  const ws = new WebSocket(wsUrl)

  ws.onopen = () => console.log('[mock] ws open')
  ws.onmessage = (event) => console.log('[mock] ws event:', String(event.data))
  ws.onclose = (event) => {
    console.log(`[mock] ws closed (code=${event.code} reason=${event.reason})`)
    process.exit(0)
  }
  ws.onerror = (event) => console.error('[mock] ws error', event)

  // Keep alive until Ctrl+C or server closes us.
  process.on('SIGINT', () => {
    console.log('\n[mock] SIGINT, closing WS')
    ws.close()
  })
}

void main().catch((err) => {
  console.error('[mock] fatal', err)
  process.exit(1)
})
