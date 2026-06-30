import { pgTable, text, integer, real, boolean, bigint } from 'drizzle-orm/pg-core'

// ─── Auth (NOT synced by PowerSync — no Sync Stream defined for this table) ──

/**
 * Cloud accounts for teachers. Separate from local `teachers` table.
 * `local_teacher_id` = UUID from the local desktop `teachers.id`.
 * The JWT `sub` claim equals `local_teacher_id`, matching `owner_id` in all
 * syncable tables so Sync Streams can filter with `auth.user_id()`.
 */
export const cloudAccounts = pgTable('cloud_accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /** Local teacher UUID — becomes the JWT `sub` / PowerSync tenant key. */
  localTeacherId: text('local_teacher_id').notNull().unique(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull()
})

export type CloudAccount = typeof cloudAccounts.$inferSelect
export type InsertCloudAccount = typeof cloudAccounts.$inferInsert

// ─── Syncable tables (mirror the SQLite schema in apps/desktop/src/main/db/schema.ts) ──
// Column names use snake_case to match the SQLite schema exactly so the bridge
// can do a direct field mapping without any transformation.

export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  subject: text('subject'),
  gradeLevel: text('grade_level'),
  icon: text('icon'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull()
})

export type Exam = typeof exams.$inferSelect

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull(),
  position: integer('position').notNull(),
  kind: text('kind').notNull(),
  prompt: text('prompt').notNull(),
  points: real('points').notNull().default(1),
  optionsJson: text('options_json'),
  image: text('image'),
  answerBool: boolean('answer_bool'),
  language: text('language'),
  starterCode: text('starter_code')
})

export type Question = typeof questions.$inferSelect

/** Exam sessions (results tier). `owner_id` scopes to the teacher. */
export const examSessions = pgTable('exam_sessions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull(),
  ownerId: text('owner_id').notNull(),
  status: text('status').notNull().default('lobby'),
  durationMinutes: integer('duration_minutes').notNull(),
  allowLateJoin: boolean('allow_late_join').notNull().default(false),
  startedAt: bigint('started_at', { mode: 'number' }),
  endedAt: bigint('ended_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull()
})

/**
 * Students (PII — Q-205).
 * `token` (LAN-only auth token) is intentionally excluded from the cloud schema.
 */
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  name: text('name').notNull(),
  matricula: text('matricula').notNull(),
  joinedAt: bigint('joined_at', { mode: 'number' }).notNull(),
  lastSeenAt: bigint('last_seen_at', { mode: 'number' }).notNull(),
  submittedAt: bigint('submitted_at', { mode: 'number' }),
  leftAt: bigint('left_at', { mode: 'number' })
})

export const answers = pgTable('answers', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  questionId: text('question_id').notNull(),
  value: text('value').notNull(),
  score: real('score'),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull()
})
