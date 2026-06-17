/* Group-isolation smoke for the Socket.IO real-time layer.
 *
 * Prereq: the app is running and `db:seed` has been applied (running session,
 * Grupo A = {a1,a2}, Grupo B = {b1}). Run from apps/desktop so socket.io-client
 * resolves:  node scripts/realtime-smoke.mjs [baseUrl]
 *
 * Asserts: when an A member saves an answer, the OTHER A member receives
 * `group.answer.update` and the B member does NOT — i.e. group rooms isolate
 * collaborative state.
 */
import { io } from 'socket.io-client'

// Dev-only: accept the self-signed cert when the server runs HTTPS.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const base = process.argv[2] || 'https://localhost:8000'
const TOKENS = { a1: 'seed-tok-a1', a2: 'seed-tok-a2', b1: 'seed-tok-b1' }

function connect(label, token) {
  const socket = io(base, { auth: { role: 'student', token }, rejectUnauthorized: false })
  const events = []
  let ack = null
  socket.on('server-event', (e) => {
    if (e?.type === 'connection.ack') ack = e
    if (e?.type === 'group.answer.update') events.push(e)
  })
  return {
    label,
    socket,
    groupEvents: events,
    ackGroup: () => ack?.groupId ?? null,
    ready: () =>
      new Promise((res) => {
        if (ack) return res()
        socket.on('server-event', (e) => e?.type === 'connection.ack' && res())
      })
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const a1 = connect('a1', TOKENS.a1)
  const a2 = connect('a2', TOKENS.a2)
  const b1 = connect('b1', TOKENS.b1)
  await Promise.all([a1.ready(), a2.ready(), b1.ready()])
  console.log('acks → a1:', a1.ackGroup(), 'a2:', a2.ackGroup(), 'b1:', b1.ackGroup())

  // a1 fetches the exam to get a real question id, then saves an answer.
  const exam = await fetch(`${base}/api/exam/current`, {
    headers: { authorization: `Bearer ${TOKENS.a1}` }
  }).then((r) => r.json())
  const questionId = exam?.questions?.[0]?.id
  if (!questionId) throw new Error('no question — did you run db:seed and start the session?')

  await fetch(`${base}/api/answers`, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKENS.a1}`, 'content-type': 'application/json' },
    body: JSON.stringify({ questionId, value: 'opt-c' })
  }).then((r) => r.json())

  await sleep(800)

  const a2Got = a2.groupEvents.some((e) => e.questionId === questionId)
  const b1Got = b1.groupEvents.some((e) => e.questionId === questionId)
  const sameGroup = a1.ackGroup() && a1.ackGroup() === a2.ackGroup() && a1.ackGroup() !== b1.ackGroup()

  console.log('a2 received teammate answer:', a2Got, '(expect true)')
  console.log('b1 received it:', b1Got, '(expect false)')
  console.log('group assignment correct:', sameGroup, '(expect true)')

  const pass = a2Got && !b1Got && sameGroup
  console.log(pass ? '\nPASS ✅ group rooms isolate collaborative state' : '\nFAIL ❌')

  ;[a1, a2, b1].forEach((c) => c.socket.close())
  process.exit(pass ? 0 : 1)
}

main().catch((e) => {
  console.error('smoke error:', e.message)
  process.exit(1)
})
