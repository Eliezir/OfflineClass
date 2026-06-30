/**
 * Sync bridge — reconciles offlineclass.db ↔ PowerSync managed DB.
 *
 * Architecture (D-107 — Opção B):
 *   offlineclass.db is the source of truth for the local app.
 *   The PowerSync managed DB (powersync.db) is the sync layer.
 *
 * Two IDs are threaded through this module:
 *   localTeacherId — the current device's teachers.id (used for local DB FKs and queries)
 *   cloudOwnerId   — the JWT `sub` of the cloud account (used for managed DB owner_id)
 *   On a first/single device these are the same UUID.
 *   On a second device they differ: cloudOwnerId = Device A's UUID (from JWT),
 *   localTeacherId = Device B's UUID.
 *
 * Push (local → managed):
 *   - Reads entities from offlineclass.db where owner_id = localTeacherId.
 *   - Diffs against managed DB where owner_id = cloudOwnerId.
 *   - Writes INSERT/UPDATE/DELETE to managed DB using cloudOwnerId as owner_id.
 *   - Queued in ps_crud → uploaded to Postgres by uploadData().
 *
 * Pull (managed → local):
 *   - Reads managed DB where owner_id = cloudOwnerId (data replicated from Postgres).
 *   - Diffs against offlineclass.db.
 *   - Upserts rows into offlineclass.db substituting owner_id = localTeacherId.
 *   - Deletes local rows that are absent from managed DB (server-authoritative).
 *   - Anti-loop: push always runs before pull; after push, managed mirrors local,
 *     so pull fingerprints match and no redundant writes happen.
 *
 * Anti-loop: diff-based fingerprints prevent no-op writes. A _running flag
 * prevents concurrent bridge runs.
 *
 * Scope: exams, questions, exam_sessions, students, answers.
 * PII note (Q-205): students.token is excluded from the Postgres schema.
 *   Pulled students receive a stable synthetic token `synced:<id>` — they
 *   are past-session records and their token is never used for auth.
 */
import { eq } from 'drizzle-orm'
import type { Db } from '../db/client'
import {
  exams as examsTable,
  questions as questionsTable,
  examSessions as examSessionsTable,
  students as studentsTable,
  answers as answersTable
} from '../db/schema'
import { getOrCreatePowerSyncDb, isSyncConnected } from './client'
import { loadSyncCredentials } from './syncStore'

// ─── Types matching the managed DB row shapes ────────────────────────────────

interface ManagedExam {
  id: string
  owner_id: string
  title: string
  description: string | null
  subject: string | null
  grade_level: string | null
  icon: string | null
  created_at: number
  updated_at: number
}

interface ManagedQuestion {
  id: string
  exam_id: string
  position: number
  kind: string
  prompt: string
  points: number
  options_json: string | null
  image: string | null
  answer_bool: number | null
  language: string | null
  starter_code: string | null
}

interface ManagedExamSession {
  id: string
  exam_id: string
  owner_id: string
  status: string
  duration_minutes: number
  allow_late_join: number // boolean as 0/1
  started_at: number | null
  ended_at: number | null
  created_at: number
}

interface ManagedStudent {
  id: string
  session_id: string
  name: string
  matricula: string
  joined_at: number
  last_seen_at: number
  submitted_at: number | null
  left_at: number | null
}

interface ManagedAnswer {
  id: string
  student_id: string
  question_id: string
  value: string
  score: number | null
  updated_at: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Stable fingerprint for change detection (sort keys to be order-independent). */
function fingerprint(obj: Record<string, unknown>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => k !== 'id') // id is the PK, not content
        .sort(([a], [b]) => a.localeCompare(b))
    )
  )
}

// ─── Bridge state ─────────────────────────────────────────────────────────────

let _running = false

// ─── Push: exams ─────────────────────────────────────────────────────────────

async function pushExams(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ pushed: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()

  // Read local exams scoped to this device's teacher (synchronous)
  const localRows = db.select().from(examsTable).where(eq(examsTable.ownerId, localTeacherId)).all()

  // Read managed DB exams scoped to the cloud account (async)
  const managedRows = await psDb.getAll<ManagedExam>(
    'SELECT * FROM exams WHERE owner_id = ?',
    [cloudOwnerId]
  )
  const managedById = new Map(managedRows.map((r) => [r.id, r]))

  let pushed = 0
  let deleted = 0

  // Push new and modified rows
  for (const local of localRows) {
    const localFp = fingerprint({
      owner_id: local.ownerId,
      title: local.title,
      description: local.description,
      subject: local.subject,
      grade_level: local.gradeLevel,
      icon: local.icon,
      created_at: local.createdAt instanceof Date ? local.createdAt.getTime() : local.createdAt,
      updated_at: local.updatedAt instanceof Date ? local.updatedAt.getTime() : local.updatedAt
    })
    const managed = managedById.get(local.id)
    const managedFp = managed
      ? fingerprint({
          owner_id: managed.owner_id,
          title: managed.title,
          description: managed.description,
          subject: managed.subject,
          grade_level: managed.grade_level,
          icon: managed.icon,
          created_at: managed.created_at,
          updated_at: managed.updated_at
        })
      : null

    if (localFp !== managedFp) {
      // Always write cloudOwnerId as owner_id so managed DB is consistent across devices
      await psDb.execute(
        `INSERT OR REPLACE INTO exams
          (id, owner_id, title, description, subject, grade_level, icon, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          local.id,
          cloudOwnerId,
          local.title,
          local.description ?? null,
          local.subject ?? null,
          local.gradeLevel ?? null,
          local.icon ?? null,
          local.createdAt instanceof Date ? local.createdAt.getTime() : local.createdAt,
          local.updatedAt instanceof Date ? local.updatedAt.getTime() : local.updatedAt
        ]
      )
      pushed++
    }
    managedById.delete(local.id)
  }

  // Delete managed rows that no longer exist locally (hard delete propagation)
  for (const [id] of managedById) {
    await psDb.execute('DELETE FROM exams WHERE id = ?', [id])
    deleted++
  }

  return { pushed, deleted }
}

// ─── Push: questions ──────────────────────────────────────────────────────────

async function pushQuestions(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ pushed: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()

  // Read local questions for all exams owned by this device's teacher
  const localRows = db
    .select({ q: questionsTable })
    .from(questionsTable)
    .innerJoin(examsTable, eq(questionsTable.examId, examsTable.id))
    .where(eq(examsTable.ownerId, localTeacherId))
    .all()
    .map((r) => r.q)

  // Read managed DB questions scoped to the cloud account
  const managedRows = await psDb.getAll<ManagedQuestion>(
    `SELECT q.* FROM questions q
     INNER JOIN exams e ON q.exam_id = e.id
     WHERE e.owner_id = ?`,
    [cloudOwnerId]
  )
  const managedById = new Map(managedRows.map((r) => [r.id, r]))

  let pushed = 0
  let deleted = 0

  for (const local of localRows) {
    const localFp = fingerprint({
      exam_id: local.examId,
      position: local.position,
      kind: local.kind,
      prompt: local.prompt,
      points: local.points,
      options_json: local.optionsJson ?? null,
      image: local.image ?? null,
      // boolean stored as 0/1 in both DBs
      answer_bool: local.answerBool == null ? null : local.answerBool ? 1 : 0,
      language: local.language ?? null,
      starter_code: local.starterCode ?? null
    })
    const managed = managedById.get(local.id)
    const managedFp = managed
      ? fingerprint({
          exam_id: managed.exam_id,
          position: managed.position,
          kind: managed.kind,
          prompt: managed.prompt,
          points: managed.points,
          options_json: managed.options_json,
          image: managed.image,
          answer_bool: managed.answer_bool,
          language: managed.language,
          starter_code: managed.starter_code
        })
      : null

    if (localFp !== managedFp) {
      await psDb.execute(
        `INSERT OR REPLACE INTO questions
          (id, exam_id, position, kind, prompt, points, options_json, image,
           answer_bool, language, starter_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          local.id,
          local.examId,
          local.position,
          local.kind,
          local.prompt,
          local.points,
          local.optionsJson ?? null,
          local.image ?? null,
          local.answerBool == null ? null : local.answerBool ? 1 : 0,
          local.language ?? null,
          local.starterCode ?? null
        ]
      )
      pushed++
    }
    managedById.delete(local.id)
  }

  // Delete managed rows that no longer exist locally
  for (const [id] of managedById) {
    await psDb.execute('DELETE FROM questions WHERE id = ?', [id])
    deleted++
  }

  return { pushed, deleted }
}

// ─── Push: exam sessions ──────────────────────────────────────────────────────

async function pushExamSessions(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ pushed: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()

  const localRows = db
    .select()
    .from(examSessionsTable)
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()

  const managedRows = await psDb.getAll<ManagedExamSession>(
    'SELECT * FROM exam_sessions WHERE owner_id = ?',
    [cloudOwnerId]
  )
  const managedById = new Map(managedRows.map((r) => [r.id, r]))

  let pushed = 0
  let deleted = 0

  for (const local of localRows) {
    const toNum = (v: Date | number | null): number | null =>
      v == null ? null : v instanceof Date ? v.getTime() : v

    const localFp = fingerprint({
      exam_id: local.examId,
      owner_id: local.ownerId,
      status: local.status,
      duration_minutes: local.durationMinutes,
      allow_late_join: local.allowLateJoin ? 1 : 0,
      started_at: toNum(local.startedAt),
      ended_at: toNum(local.endedAt),
      created_at: toNum(local.createdAt)
    })
    const managed = managedById.get(local.id)
    const managedFp = managed
      ? fingerprint({
          exam_id: managed.exam_id,
          owner_id: managed.owner_id,
          status: managed.status,
          duration_minutes: managed.duration_minutes,
          allow_late_join: managed.allow_late_join,
          started_at: managed.started_at,
          ended_at: managed.ended_at,
          created_at: managed.created_at
        })
      : null

    if (localFp !== managedFp) {
      await psDb.execute(
        `INSERT OR REPLACE INTO exam_sessions
          (id, exam_id, owner_id, status, duration_minutes, allow_late_join,
           started_at, ended_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          local.id,
          local.examId,
          cloudOwnerId, // canonical cloud owner, not local.ownerId
          local.status,
          local.durationMinutes,
          local.allowLateJoin ? 1 : 0,
          toNum(local.startedAt),
          toNum(local.endedAt),
          toNum(local.createdAt) ?? Date.now()
        ]
      )
      pushed++
    }
    managedById.delete(local.id)
  }

  for (const [id] of managedById) {
    await psDb.execute('DELETE FROM exam_sessions WHERE id = ?', [id])
    deleted++
  }

  return { pushed, deleted }
}

// ─── Push: students ───────────────────────────────────────────────────────────

async function pushStudents(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ pushed: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()

  // Note: students.token is intentionally excluded from the Postgres schema (Q-205/security).
  const localRows = db
    .select({ s: studentsTable })
    .from(studentsTable)
    .innerJoin(examSessionsTable, eq(studentsTable.sessionId, examSessionsTable.id))
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()
    .map((r) => r.s)

  const managedRows = await psDb.getAll<ManagedStudent>(
    `SELECT s.* FROM students s
     INNER JOIN exam_sessions es ON s.session_id = es.id
     WHERE es.owner_id = ?`,
    [cloudOwnerId]
  )
  const managedById = new Map(managedRows.map((r) => [r.id, r]))

  let pushed = 0
  let deleted = 0

  for (const local of localRows) {
    const toNum = (v: Date | number | null): number | null =>
      v == null ? null : v instanceof Date ? v.getTime() : v

    const localFp = fingerprint({
      session_id: local.sessionId,
      name: local.name,
      matricula: local.matricula,
      joined_at: toNum(local.joinedAt),
      last_seen_at: toNum(local.lastSeenAt),
      submitted_at: toNum(local.submittedAt),
      left_at: toNum(local.leftAt)
    })
    const managed = managedById.get(local.id)
    const managedFp = managed
      ? fingerprint({
          session_id: managed.session_id,
          name: managed.name,
          matricula: managed.matricula,
          joined_at: managed.joined_at,
          last_seen_at: managed.last_seen_at,
          submitted_at: managed.submitted_at,
          left_at: managed.left_at
        })
      : null

    if (localFp !== managedFp) {
      await psDb.execute(
        `INSERT OR REPLACE INTO students
          (id, session_id, name, matricula, joined_at, last_seen_at, submitted_at, left_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          local.id,
          local.sessionId,
          local.name,
          local.matricula,
          toNum(local.joinedAt) ?? Date.now(),
          toNum(local.lastSeenAt) ?? Date.now(),
          toNum(local.submittedAt),
          toNum(local.leftAt)
        ]
      )
      pushed++
    }
    managedById.delete(local.id)
  }

  for (const [id] of managedById) {
    await psDb.execute('DELETE FROM students WHERE id = ?', [id])
    deleted++
  }

  return { pushed, deleted }
}

// ─── Push: answers ────────────────────────────────────────────────────────────

async function pushAnswers(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ pushed: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()

  const localRows = db
    .select({ a: answersTable })
    .from(answersTable)
    .innerJoin(studentsTable, eq(answersTable.studentId, studentsTable.id))
    .innerJoin(examSessionsTable, eq(studentsTable.sessionId, examSessionsTable.id))
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()
    .map((r) => r.a)

  const managedRows = await psDb.getAll<ManagedAnswer>(
    `SELECT a.* FROM answers a
     INNER JOIN students s ON a.student_id = s.id
     INNER JOIN exam_sessions es ON s.session_id = es.id
     WHERE es.owner_id = ?`,
    [cloudOwnerId]
  )
  const managedById = new Map(managedRows.map((r) => [r.id, r]))

  let pushed = 0
  let deleted = 0

  for (const local of localRows) {
    const toNum = (v: Date | number | null): number | null =>
      v == null ? null : v instanceof Date ? v.getTime() : v

    const localFp = fingerprint({
      student_id: local.studentId,
      question_id: local.questionId,
      value: local.value,
      score: local.score ?? null,
      updated_at: toNum(local.updatedAt)
    })
    const managed = managedById.get(local.id)
    const managedFp = managed
      ? fingerprint({
          student_id: managed.student_id,
          question_id: managed.question_id,
          value: managed.value,
          score: managed.score,
          updated_at: managed.updated_at
        })
      : null

    if (localFp !== managedFp) {
      await psDb.execute(
        `INSERT OR REPLACE INTO answers
          (id, student_id, question_id, value, score, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          local.id,
          local.studentId,
          local.questionId,
          local.value,
          local.score ?? null,
          toNum(local.updatedAt) ?? Date.now()
        ]
      )
      pushed++
    }
    managedById.delete(local.id)
  }

  for (const [id] of managedById) {
    await psDb.execute('DELETE FROM answers WHERE id = ?', [id])
    deleted++
  }

  return { pushed, deleted }
}

// ─── Pull: exams ─────────────────────────────────────────────────────────────

/**
 * Pull exams from managed DB → offlineclass.db.
 * Rows arriving from another device have owner_id = cloudOwnerId; we remap
 * to localTeacherId to satisfy the local FK (exams.owner_id → teachers.id).
 * Server-authoritative: local exams absent from managed DB are deleted.
 */
async function pullExams(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ upserted: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()
  const managedRows = await psDb.getAll<ManagedExam>(
    'SELECT * FROM exams WHERE owner_id = ?',
    [cloudOwnerId]
  )

  let upserted = 0
  let deleted = 0

  for (const m of managedRows) {
    db.insert(examsTable)
      .values({
        id: m.id,
        ownerId: localTeacherId, // remap to local teacher FK
        title: m.title,
        description: m.description ?? null,
        subject: m.subject ?? null,
        gradeLevel: m.grade_level ?? null,
        icon: m.icon ?? null,
        createdAt: m.created_at,
        updatedAt: m.updated_at
      })
      .onConflictDoUpdate({
        target: examsTable.id,
        set: {
          title: m.title,
          description: m.description ?? null,
          subject: m.subject ?? null,
          gradeLevel: m.grade_level ?? null,
          icon: m.icon ?? null,
          updatedAt: m.updated_at
        }
      })
      .run()
    upserted++
  }

  // Delete local exams that are no longer in managed DB (deleted on server/other device)
  const managedIds = new Set(managedRows.map((r) => r.id))
  const localExams = db
    .select({ id: examsTable.id })
    .from(examsTable)
    .where(eq(examsTable.ownerId, localTeacherId))
    .all()

  for (const { id } of localExams) {
    if (!managedIds.has(id)) {
      db.delete(examsTable).where(eq(examsTable.id, id)).run()
      deleted++
    }
  }

  return { upserted, deleted }
}

// ─── Pull: questions ──────────────────────────────────────────────────────────

async function pullQuestions(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ upserted: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()
  const managedRows = await psDb.getAll<ManagedQuestion>(
    `SELECT q.* FROM questions q
     INNER JOIN exams e ON q.exam_id = e.id
     WHERE e.owner_id = ?`,
    [cloudOwnerId]
  )

  let upserted = 0
  let deleted = 0

  for (const m of managedRows) {
    db.insert(questionsTable)
      .values({
        id: m.id,
        examId: m.exam_id,
        position: m.position,
        kind: m.kind as 'mcq' | 'multi' | 'truefalse' | 'essay' | 'code',
        prompt: m.prompt,
        points: m.points,
        optionsJson: m.options_json ?? null,
        image: m.image ?? null,
        answerBool: m.answer_bool == null ? null : m.answer_bool !== 0,
        language: m.language ?? null,
        starterCode: m.starter_code ?? null
      })
      .onConflictDoUpdate({
        target: questionsTable.id,
        set: {
          position: m.position,
          kind: m.kind as 'mcq' | 'multi' | 'truefalse' | 'essay' | 'code',
          prompt: m.prompt,
          points: m.points,
          optionsJson: m.options_json ?? null,
          image: m.image ?? null,
          answerBool: m.answer_bool == null ? null : m.answer_bool !== 0,
          language: m.language ?? null,
          starterCode: m.starter_code ?? null
        }
      })
      .run()
    upserted++
  }

  // Delete local questions whose parent exams are owned by this teacher but are
  // absent from managed DB
  const managedIds = new Set(managedRows.map((r) => r.id))
  const localQRows = db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .innerJoin(examsTable, eq(questionsTable.examId, examsTable.id))
    .where(eq(examsTable.ownerId, localTeacherId))
    .all()

  for (const { id } of localQRows) {
    if (!managedIds.has(id)) {
      db.delete(questionsTable).where(eq(questionsTable.id, id)).run()
      deleted++
    }
  }

  return { upserted, deleted }
}

// ─── Pull: exam sessions ──────────────────────────────────────────────────────

async function pullExamSessions(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ upserted: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()
  const managedRows = await psDb.getAll<ManagedExamSession>(
    'SELECT * FROM exam_sessions WHERE owner_id = ?',
    [cloudOwnerId]
  )

  let upserted = 0
  let deleted = 0

  for (const m of managedRows) {
    db.insert(examSessionsTable)
      .values({
        id: m.id,
        examId: m.exam_id,
        ownerId: localTeacherId,
        status: m.status as 'lobby' | 'running' | 'ended',
        durationMinutes: m.duration_minutes,
        allowLateJoin: m.allow_late_join !== 0,
        startedAt: m.started_at ?? null,
        endedAt: m.ended_at ?? null,
        createdAt: m.created_at
      })
      .onConflictDoUpdate({
        target: examSessionsTable.id,
        set: {
          status: m.status as 'lobby' | 'running' | 'ended',
          durationMinutes: m.duration_minutes,
          allowLateJoin: m.allow_late_join !== 0,
          startedAt: m.started_at ?? null,
          endedAt: m.ended_at ?? null
        }
      })
      .run()
    upserted++
  }

  const managedIds = new Set(managedRows.map((r) => r.id))
  const localRows = db
    .select({ id: examSessionsTable.id })
    .from(examSessionsTable)
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()

  for (const { id } of localRows) {
    if (!managedIds.has(id)) {
      db.delete(examSessionsTable).where(eq(examSessionsTable.id, id)).run()
      deleted++
    }
  }

  return { upserted, deleted }
}

// ─── Pull: students ───────────────────────────────────────────────────────────

/**
 * Pull students from managed DB.
 * `students.token` is NOT in the managed DB — pulled students get a stable
 * synthetic token `synced:<id>`. These are past-session records; the token
 * is never used for authentication.
 */
async function pullStudents(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ upserted: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()
  const managedRows = await psDb.getAll<ManagedStudent>(
    `SELECT s.* FROM students s
     INNER JOIN exam_sessions es ON s.session_id = es.id
     WHERE es.owner_id = ?`,
    [cloudOwnerId]
  )

  let upserted = 0
  let deleted = 0

  for (const m of managedRows) {
    db.insert(studentsTable)
      .values({
        id: m.id,
        sessionId: m.session_id,
        name: m.name,
        matricula: m.matricula,
        token: `synced:${m.id}`, // stable synthetic token for pulled records
        joinedAt: m.joined_at,
        lastSeenAt: m.last_seen_at,
        submittedAt: m.submitted_at ?? null,
        leftAt: m.left_at ?? null
      })
      .onConflictDoUpdate({
        target: studentsTable.id,
        set: {
          name: m.name,
          matricula: m.matricula,
          lastSeenAt: m.last_seen_at,
          submittedAt: m.submitted_at ?? null,
          leftAt: m.left_at ?? null
        }
      })
      .run()
    upserted++
  }

  const managedIds = new Set(managedRows.map((r) => r.id))
  const localRows = db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .innerJoin(examSessionsTable, eq(studentsTable.sessionId, examSessionsTable.id))
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()

  for (const { id } of localRows) {
    if (!managedIds.has(id)) {
      db.delete(studentsTable).where(eq(studentsTable.id, id)).run()
      deleted++
    }
  }

  return { upserted, deleted }
}

// ─── Pull: answers ────────────────────────────────────────────────────────────

async function pullAnswers(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<{ upserted: number; deleted: number }> {
  const psDb = getOrCreatePowerSyncDb()
  const managedRows = await psDb.getAll<ManagedAnswer>(
    `SELECT a.* FROM answers a
     INNER JOIN students s ON a.student_id = s.id
     INNER JOIN exam_sessions es ON s.session_id = es.id
     WHERE es.owner_id = ?`,
    [cloudOwnerId]
  )

  let upserted = 0
  let deleted = 0

  for (const m of managedRows) {
    db.insert(answersTable)
      .values({
        id: m.id,
        studentId: m.student_id,
        questionId: m.question_id,
        value: m.value,
        score: m.score ?? null,
        updatedAt: m.updated_at
      })
      .onConflictDoUpdate({
        target: answersTable.id,
        set: {
          value: m.value,
          score: m.score ?? null,
          updatedAt: m.updated_at
        }
      })
      .run()
    upserted++
  }

  const managedIds = new Set(managedRows.map((r) => r.id))
  const localRows = db
    .select({ id: answersTable.id })
    .from(answersTable)
    .innerJoin(studentsTable, eq(answersTable.studentId, studentsTable.id))
    .innerJoin(examSessionsTable, eq(studentsTable.sessionId, examSessionsTable.id))
    .where(eq(examSessionsTable.ownerId, localTeacherId))
    .all()

  for (const { id } of localRows) {
    if (!managedIds.has(id)) {
      db.delete(answersTable).where(eq(answersTable.id, id)).run()
      deleted++
    }
  }

  return { upserted, deleted }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface BridgeResult {
  examsPushed: number
  examsDeleted: number
  questionsPushed: number
  questionsDeleted: number
  sessionsPushed: number
  sessionsDeleted: number
  studentsPushed: number
  studentsDeleted: number
  answersPushed: number
  answersDeleted: number
  examsUpserted: number
  examsPulledDeleted: number
  questionsUpserted: number
  questionsPulledDeleted: number
  sessionsUpserted: number
  sessionsPulledDeleted: number
  studentsUpserted: number
  studentsPulledDeleted: number
  answersUpserted: number
  answersPulledDeleted: number
  durationMs: number
  error?: string
}

/**
 * Run one full bridge cycle: push local → managed, then pull managed → local.
 * Skips silently if sync is not connected or another run is in progress.
 *
 * Push runs first so that local-only data reaches managed DB before the pull
 * diff compares managed state against local state (anti-loop guarantee).
 *
 * @param db             The Drizzle offlineclass.db instance
 * @param localTeacherId The current device's teachers.id (local FK)
 * @param cloudOwnerId   JWT sub — canonical owner_id in managed DB and Postgres
 */
export async function runBridge(
  db: Db,
  localTeacherId: string,
  cloudOwnerId: string
): Promise<BridgeResult | null> {
  if (!isSyncConnected()) {
    console.log('[bridge] skipped: sync not connected')
    return null
  }
  const creds = loadSyncCredentials()
  if (!creds?.enabled) return null
  if (_running) {
    console.log('[bridge] skipped: already running')
    return null
  }

  _running = true
  const start = Date.now()
  try {
    console.log(`[bridge] starting — local=${localTeacherId} cloud=${cloudOwnerId}`)

    // ── Push (local → managed) ─────────────────────────────────────────────
    const examsP = await pushExams(db, localTeacherId, cloudOwnerId)
    const questionsP = await pushQuestions(db, localTeacherId, cloudOwnerId)
    const sessionsP = await pushExamSessions(db, localTeacherId, cloudOwnerId)
    const studentsP = await pushStudents(db, localTeacherId, cloudOwnerId)
    const answersP = await pushAnswers(db, localTeacherId, cloudOwnerId)

    // ── Pull (managed → local) — runs after push so anti-loop is guaranteed ─
    const examsQ = await pullExams(db, localTeacherId, cloudOwnerId)
    const questionsQ = await pullQuestions(db, localTeacherId, cloudOwnerId)
    const sessionsQ = await pullExamSessions(db, localTeacherId, cloudOwnerId)
    const studentsQ = await pullStudents(db, localTeacherId, cloudOwnerId)
    const answersQ = await pullAnswers(db, localTeacherId, cloudOwnerId)

    const result: BridgeResult = {
      examsPushed: examsP.pushed,
      examsDeleted: examsP.deleted,
      questionsPushed: questionsP.pushed,
      questionsDeleted: questionsP.deleted,
      sessionsPushed: sessionsP.pushed,
      sessionsDeleted: sessionsP.deleted,
      studentsPushed: studentsP.pushed,
      studentsDeleted: studentsP.deleted,
      answersPushed: answersP.pushed,
      answersDeleted: answersP.deleted,
      examsUpserted: examsQ.upserted,
      examsPulledDeleted: examsQ.deleted,
      questionsUpserted: questionsQ.upserted,
      questionsPulledDeleted: questionsQ.deleted,
      sessionsUpserted: sessionsQ.upserted,
      sessionsPulledDeleted: sessionsQ.deleted,
      studentsUpserted: studentsQ.upserted,
      studentsPulledDeleted: studentsQ.deleted,
      answersUpserted: answersQ.upserted,
      answersPulledDeleted: answersQ.deleted,
      durationMs: Date.now() - start
    }
    console.log('[bridge] done:', result)
    return result
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[bridge] error:', error)
    return {
      examsPushed: 0,
      examsDeleted: 0,
      questionsPushed: 0,
      questionsDeleted: 0,
      sessionsPushed: 0,
      sessionsDeleted: 0,
      studentsPushed: 0,
      studentsDeleted: 0,
      answersPushed: 0,
      answersDeleted: 0,
      examsUpserted: 0,
      examsPulledDeleted: 0,
      questionsUpserted: 0,
      questionsPulledDeleted: 0,
      sessionsUpserted: 0,
      sessionsPulledDeleted: 0,
      studentsUpserted: 0,
      studentsPulledDeleted: 0,
      answersUpserted: 0,
      answersPulledDeleted: 0,
      durationMs: Date.now() - start,
      error
    }
  } finally {
    _running = false
  }
}
