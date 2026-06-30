/**
 * OfflineClass — Backend connector for PowerSync
 *
 * Routes:
 *   POST /api/auth/register  — create cloud account (links local teacher)
 *   POST /api/auth/login     — authenticate; returns PowerSync JWT
 *   GET  /api/auth/token     — refresh JWT (requires valid Bearer)
 *   POST /api/upload         — receive CRUD batch from PowerSync client uploadData()
 *   GET  /health             — liveness check
 *
 * The JWT `sub` = `localTeacherId` = `owner_id` in all syncable Postgres tables.
 * PowerSync Sync Streams filter by `auth.user_id()` which equals `sub`.
 */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from './db.ts'
import { cloudAccounts, exams, questions, examSessions, students, answers } from './schema.ts'
import { hashPassword, verifyPassword, issueToken, verifyToken, PS_SERVICE_URL } from './auth.ts'

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const RegisterBody = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(200),
  /** UUID from the local desktop `teachers.id` — becomes the JWT sub / owner_id. */
  localTeacherId: z.string().uuid()
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

/**
 * Single CRUD entry from the PowerSync client's uploadData() call.
 * op: PUT = new row, PATCH = update existing, DELETE = remove row.
 */
const CrudEntry = z.object({
  op: z.enum(['PUT', 'PATCH', 'DELETE']),
  table: z.string(),
  id: z.string(),
  data: z.record(z.string(), z.unknown()).optional()
})

const UploadBody = z.object({
  batch: z.array(CrudEntry)
})

type CrudEntryType = z.infer<typeof CrudEntry>

// ─── Bearer auth middleware helper ───────────────────────────────────────────

async function extractTeacherId(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing Bearer token')
  const token = authHeader.slice(7)
  const { localTeacherId } = await verifyToken(token)
  return localTeacherId
}

// ─── CRUD application helpers ────────────────────────────────────────────────

async function applyExam(entry: CrudEntryType, ownerId: string): Promise<void> {
  if (entry.op === 'DELETE') {
    await db.delete(exams).where(eq(exams.id, entry.id))
    return
  }
  const d = entry.data ?? {}
  const row = {
    id: entry.id,
    ownerId,
    title: String(d['title'] ?? ''),
    description: d['description'] != null ? String(d['description']) : null,
    subject: d['subject'] != null ? String(d['subject']) : null,
    gradeLevel: d['grade_level'] != null ? String(d['grade_level']) : null,
    icon: d['icon'] != null ? String(d['icon']) : null,
    createdAt: Number(d['created_at'] ?? Date.now()),
    updatedAt: Number(d['updated_at'] ?? Date.now())
  }
  await db.insert(exams).values(row).onConflictDoUpdate({ target: exams.id, set: row })
}

async function applyQuestion(entry: CrudEntryType, ownerId: string): Promise<void> {
  if (entry.op === 'DELETE') {
    await db.delete(questions).where(eq(questions.id, entry.id))
    return
  }
  const d = entry.data ?? {}

  // Verify the parent exam belongs to this teacher before upsert.
  const examId = String(d['exam_id'] ?? '')
  if (examId) {
    const [parentExam] = await db
      .select({ ownerId: exams.ownerId })
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1)
    if (parentExam && parentExam.ownerId !== ownerId) {
      throw new Error(`Forbidden: exam ${examId} does not belong to this teacher`)
    }
  }

  const row = {
    id: entry.id,
    examId,
    position: Number(d['position'] ?? 0),
    kind: String(d['kind'] ?? 'essay'),
    prompt: String(d['prompt'] ?? ''),
    points: Number(d['points'] ?? 1),
    optionsJson: d['options_json'] != null ? String(d['options_json']) : null,
    image: d['image'] != null ? String(d['image']) : null,
    answerBool: d['answer_bool'] != null ? Boolean(d['answer_bool']) : null,
    language: d['language'] != null ? String(d['language']) : null,
    starterCode: d['starter_code'] != null ? String(d['starter_code']) : null
  }
  await db.insert(questions).values(row).onConflictDoUpdate({ target: questions.id, set: row })
}

async function applyExamSession(entry: CrudEntryType, ownerId: string): Promise<void> {
  if (entry.op === 'DELETE') {
    await db.delete(examSessions).where(eq(examSessions.id, entry.id))
    return
  }
  const d = entry.data ?? {}
  const row = {
    id: entry.id,
    examId: String(d['exam_id'] ?? ''),
    ownerId,
    status: String(d['status'] ?? 'lobby'),
    durationMinutes: Number(d['duration_minutes'] ?? 60),
    allowLateJoin: Boolean(d['allow_late_join'] ?? false),
    startedAt: d['started_at'] != null ? Number(d['started_at']) : null,
    endedAt: d['ended_at'] != null ? Number(d['ended_at']) : null,
    createdAt: Number(d['created_at'] ?? Date.now())
  }
  await db.insert(examSessions).values(row).onConflictDoUpdate({ target: examSessions.id, set: row })
}

async function applyStudent(entry: CrudEntryType): Promise<void> {
  if (entry.op === 'DELETE') {
    await db.delete(students).where(eq(students.id, entry.id))
    return
  }
  const d = entry.data ?? {}
  const row = {
    id: entry.id,
    sessionId: String(d['session_id'] ?? ''),
    name: String(d['name'] ?? ''),
    matricula: String(d['matricula'] ?? ''),
    joinedAt: Number(d['joined_at'] ?? Date.now()),
    lastSeenAt: Number(d['last_seen_at'] ?? Date.now()),
    submittedAt: d['submitted_at'] != null ? Number(d['submitted_at']) : null,
    leftAt: d['left_at'] != null ? Number(d['left_at']) : null
  }
  await db.insert(students).values(row).onConflictDoUpdate({ target: students.id, set: row })
}

async function applyAnswer(entry: CrudEntryType): Promise<void> {
  if (entry.op === 'DELETE') {
    await db.delete(answers).where(eq(answers.id, entry.id))
    return
  }
  const d = entry.data ?? {}
  const row = {
    id: entry.id,
    studentId: String(d['student_id'] ?? ''),
    questionId: String(d['question_id'] ?? ''),
    value: String(d['value'] ?? ''),
    score: d['score'] != null ? Number(d['score']) : null,
    updatedAt: Number(d['updated_at'] ?? Date.now())
  }
  await db.insert(answers).values(row).onConflictDoUpdate({ target: answers.id, set: row })
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = new Hono()

// Health check
app.get('/health', (c) => c.json({ ok: true, service: 'offlineclass-sync-connector' }))

// ── Auth routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (c) => {
  const body = RegisterBody.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)

  const { email, name, password, localTeacherId } = body.data

  const existing = await db
    .select({ id: cloudAccounts.id })
    .from(cloudAccounts)
    .where(eq(cloudAccounts.email, email))
    .limit(1)
  if (existing.length > 0) return c.json({ error: 'Email already registered' }, 409)

  const passwordHash = await hashPassword(password)
  await db.insert(cloudAccounts).values({
    id: randomUUID(),
    email,
    name,
    passwordHash,
    localTeacherId,
    createdAt: Date.now()
  })

  const { token, expiresAt } = await issueToken(localTeacherId)
  return c.json({ token, expiresAt, powersyncUrl: PS_SERVICE_URL }, 201)
})

app.post('/api/auth/login', async (c) => {
  const body = LoginBody.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)

  const { email, password } = body.data

  const [account] = await db
    .select()
    .from(cloudAccounts)
    .where(eq(cloudAccounts.email, email))
    .limit(1)
  if (!account) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await verifyPassword(password, account.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const { token, expiresAt } = await issueToken(account.localTeacherId)
  return c.json({ token, expiresAt, powersyncUrl: PS_SERVICE_URL })
})

/** Refresh endpoint — returns a fresh token for an already-authenticated teacher. */
app.get('/api/auth/token', async (c) => {
  try {
    const localTeacherId = await extractTeacherId(c.req.header('Authorization'))
    const { token, expiresAt } = await issueToken(localTeacherId)
    return c.json({ token, expiresAt, powersyncUrl: PS_SERVICE_URL })
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// ── Upload route (PowerSync client uploadData()) ─────────────────────────────

/**
 * Receives a batch of CRUD entries from the PowerSync desktop client and
 * applies them to Postgres synchronously. The client should call
 * transaction.complete() only after this endpoint returns 200.
 *
 * All writes are scoped to the authenticated teacher (localTeacherId from JWT).
 */
app.post('/api/upload', async (c) => {
  let localTeacherId: string
  try {
    localTeacherId = await extractTeacherId(c.req.header('Authorization'))
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = UploadBody.safeParse(await c.req.json())
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)

  const { batch } = body.data

  try {
    for (const entry of batch) {
      switch (entry.table) {
        case 'exams':
          await applyExam(entry, localTeacherId)
          break
        case 'questions':
          await applyQuestion(entry, localTeacherId)
          break
        case 'exam_sessions':
          await applyExamSession(entry, localTeacherId)
          break
        case 'students':
          await applyStudent(entry)
          break
        case 'answers':
          await applyAnswer(entry)
          break
        default:
          console.warn(`[upload] Unknown table "${entry.table}" — skipped`)
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload] Error applying batch:', message)
    return c.json({ error: message }, 500)
  }

  return c.json({ ok: true, applied: batch.length })
})

// ─── Start ───────────────────────────────────────────────────────────────────

const port = Number(process.env['CONNECTOR_PORT'] ?? 3001)
console.log(`[connector] Starting on port ${port}`)

serve({ fetch: app.fetch, port }, () => {
  console.log(`[connector] Ready — http://localhost:${port}`)
  console.log(`[connector] PowerSync Service URL: ${PS_SERVICE_URL}`)
})
