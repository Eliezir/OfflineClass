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
  // Subject/discipline this prova belongs to (e.g. "Redes de Computadores").
  subject: text('subject'),
  // Target grade level / academic period (e.g. "3º semestre").
  gradeLevel: text('grade_level'),
  // Emoji chosen by the teacher as the prova's cover/visual identity.
  icon: text('icon'),
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
    kind: text('kind', { enum: ['mcq', 'multi', 'truefalse', 'essay', 'code'] }).notNull(),
    prompt: text('prompt').notNull(),
    // Weight of this question; the total grade is the sum of correct questions' points.
    points: real('points').notNull().default(1),
    // For `mcq`/`multi`: JSON-encoded array of `{ id, text, correct }`. `null` otherwise.
    optionsJson: text('options_json'),
    // Optional inline image (data URL), shown with the prompt.
    image: text('image'),
    // For `truefalse`: the correct value.
    answerBool: integer('answer_bool', { mode: 'boolean' }),
    // For `code`: the language and the starter template the student edits.
    language: text('language'),
    starterCode: text('starter_code')
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
  groupMode: text('group_mode', { enum: ['disabled', 'free', 'teacher', 'shuffle'] })
    .notNull()
    .default('disabled'),
  maxGroupSize: integer('max_group_size'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
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
    name: text('name').notNull(),
    matricula: text('matricula').notNull(),
    token: text('token').notNull().unique(),
    joinedAt: timestamp('joined_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: timestamp('last_seen_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    submittedAt: timestamp('submitted_at'),
    leftAt: timestamp('left_at')
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

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => examSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
})

export const groupMembers = sqliteTable(
  'group_members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
  },
  (t) => ({
    groupStudentUnique: unique('group_members_group_student_unique').on(t.groupId, t.studentId)
  })
)
