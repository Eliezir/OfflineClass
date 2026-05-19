#!/usr/bin/env tsx
// Harness for the lobby + Stage-6 gameplay endpoints. Posts /api/join,
// keeps a WS open, optionally heartbeats and answers/submits on a timer.
//
// Usage:
//   pnpm mock-student --name "Eliezir" --matricula "2024001"
// Optional flags:
//   --host 192.168.0.10     (defaults to 127.0.0.1)
//   --port 8000             (defaults to 8000)
//   --heartbeat-every 10    (seconds; default 10; 0 disables)
//   --answer-every 5        (seconds; sends a stub answer to a question)
//   --submit-after 30       (seconds; submits after this many seconds)

interface Args {
  name: string
  matricula: string
  host: string
  port: number
  heartbeatEvery: number
  answerEvery: number
  submitAfter: number | null
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
    console.error(
      'Usage: tsx mock-student.ts --name "Foo" --matricula "12345" [--host x] [--port y] [--heartbeat-every s] [--answer-every s] [--submit-after s]'
    )
    process.exit(1)
  }
  return {
    name: out.name,
    matricula: out.matricula,
    host: out.host ?? '127.0.0.1',
    port: Number(out.port ?? 8000),
    heartbeatEvery: Number(out['heartbeat-every'] ?? 10),
    answerEvery: Number(out['answer-every'] ?? 0),
    submitAfter: out['submit-after'] ? Number(out['submit-after']) : null
  }
}

async function jsonRequest<T>(
  base: string,
  method: 'GET' | 'POST',
  path: string,
  token: string | null,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers['authorization'] = `Bearer ${token}`
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} ${path} — ${text}`)
  }
  return (await res.json()) as T
}

async function main(): Promise<void> {
  const args = parseArgs()
  const base = `http://${args.host}:${args.port}`

  console.log(`[mock] joining ${base} as ${args.name} / ${args.matricula}`)
  const join = await jsonRequest<{
    token: string
    studentId: string
    sessionId: string
    status: string
  }>(base, 'POST', '/api/join', null, { name: args.name, matricula: args.matricula })
  console.log(
    `[mock] joined: studentId=${join.studentId} sessionId=${join.sessionId} status=${join.status}`
  )
  const token = join.token

  // Heartbeat.
  const heartbeatInterval =
    args.heartbeatEvery > 0
      ? setInterval(() => {
          void jsonRequest(base, 'POST', '/api/heartbeat', token).catch((err) =>
            console.error('[mock] heartbeat failed:', err.message)
          )
        }, args.heartbeatEvery * 1000)
      : null

  // Cached exam (only available once running).
  let answerTimer: ReturnType<typeof setInterval> | null = null
  let submitTimer: ReturnType<typeof setTimeout> | null = null
  let questionIds: string[] = []

  const tryStartAnsweringIfRunning = async (): Promise<void> => {
    if (args.answerEvery <= 0 || answerTimer) return
    try {
      const exam = await jsonRequest<{
        questions: { id: string; kind: string; options?: { id: string }[] }[]
      }>(base, 'GET', '/api/exam/current', token)
      questionIds = exam.questions.map((q) => q.id)
      console.log(`[mock] exam loaded (${questionIds.length} questions); answering randomly`)
      const exam2 = exam
      answerTimer = setInterval(() => {
        if (questionIds.length === 0) return
        const q = exam2.questions[Math.floor(Math.random() * exam2.questions.length)]
        const value =
          q.kind === 'mcq' && q.options && q.options.length > 0
            ? q.options[Math.floor(Math.random() * q.options.length)].id
            : `Resposta dissertativa #${Math.floor(Math.random() * 1000)}`
        void jsonRequest(base, 'POST', '/api/answers', token, { questionId: q.id, value }).catch(
          (err) => console.error('[mock] answer failed:', err.message)
        )
      }, args.answerEvery * 1000)

      if (args.submitAfter !== null) {
        submitTimer = setTimeout(() => {
          void jsonRequest(base, 'POST', '/api/submit', token)
            .then(() => console.log('[mock] submitted'))
            .catch((err) => console.error('[mock] submit failed:', err.message))
        }, args.submitAfter * 1000)
      }
    } catch {
      // Session probably still in lobby. Try again on next event.
    }
  }

  // WebSocket.
  const wsUrl = `ws://${args.host}:${args.port}/api/ws?role=student&token=${encodeURIComponent(token)}`
  console.log(`[mock] opening WS ${wsUrl}`)
  const ws = new WebSocket(wsUrl)
  ws.onopen = () => console.log('[mock] ws open')
  ws.onmessage = (event) => {
    console.log('[mock] ws event:', String(event.data))
    try {
      const parsed = JSON.parse(String(event.data)) as { type?: string }
      if (parsed.type === 'session.started') {
        void tryStartAnsweringIfRunning()
      }
    } catch {
      // ignore
    }
  }
  ws.onclose = (event) => {
    console.log(`[mock] ws closed (code=${event.code} reason=${event.reason})`)
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    if (answerTimer) clearInterval(answerTimer)
    if (submitTimer) clearTimeout(submitTimer)
    process.exit(0)
  }
  ws.onerror = (event) => console.error('[mock] ws error', event)

  // If we joined while the session was already running, kick off answering now.
  if (join.status === 'running') {
    void tryStartAnsweringIfRunning()
  }

  process.on('SIGINT', () => {
    console.log('\n[mock] SIGINT, closing WS')
    ws.close()
  })
}

void main().catch((err) => {
  console.error('[mock] fatal', err)
  process.exit(1)
})
