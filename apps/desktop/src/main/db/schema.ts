import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

const timestamp = (column: string) => integer(column, { mode: 'timestamp_ms' })

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
})

export const teacherSessions = sqliteTable('teacher_sessions', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => teachers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  expiresAt: timestamp('expires_at')
})

export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => teachers.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
})

export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    examId: text('exam_id')
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    kind: text('kind', { enum: ['mcq', 'essay'] }).notNull(),
    prompt: text('prompt').notNull(),
    // For `mcq`: JSON-encoded array of `{ id, text, correct }`. `null` for `essay`.
    optionsJson: text('options_json')
  },
  (t) => ({
    examPositionUnique: unique('questions_exam_position_unique').on(t.examId, t.position)
  })
)

export const examSessions = sqliteTable('exam_sessions', {
  id: text('id').primaryKey(),
  examId: text('exam_id')
    .notNull()
    .references(() => exams.id, { onDelete: 'restrict' }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => teachers.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['lobby', 'running', 'ended'] })
    .notNull()
    .default('lobby'),
  durationMinutes: integer('duration_minutes').notNull(),
  allowLateJoin: integer('allow_late_join', { mode: 'boolean' }).notNull().default(false),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
})

// Collaborative groups within a session. Students in the same group share a
// Socket.IO room and (live) answer activity. Optional — a session with no
// groups behaves as before (each student on their own).
export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => examSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
})

export const students = sqliteTable(
  'students',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => examSessions.id, { onDelete: 'cascade' }),
    // Optional group membership (null = ungrouped). Set null if the group is
    // removed so the student row survives.
    groupId: text('group_id').references(() => groups.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    matricula: text('matricula').notNull(),
    token: text('token').notNull().unique(),
    joinedAt: timestamp('joined_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: timestamp('last_seen_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    submittedAt: timestamp('submitted_at')
  },
  (t) => ({
    sessionMatriculaUnique: unique('students_session_matricula_unique').on(t.sessionId, t.matricula)
  })
)

export const answers = sqliteTable(
  'answers',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    value: text('value').notNull(),
    // Auto-set to 1.0/0.0 on MCQ saves; remains null for essays until the
    // teacher grades them via sessions.gradeAnswer.
    score: real('score'),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
  },
  (t) => ({
    studentQuestionUnique: unique('answers_student_question_unique').on(t.studentId, t.questionId)
  })
)
