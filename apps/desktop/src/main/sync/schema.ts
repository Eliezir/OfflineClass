/**
 * PowerSync Schema — defines which tables the managed SQLite tracks.
 * Mirrors the syncable columns from apps/sync/src/schema.ts (Postgres side).
 * The `id` column is implicit (PowerSync always includes it).
 * Column types: text | integer | real (PowerSync's SQLite type affinity).
 */
import { column, Schema, Table } from '@powersync/node'

const examsTable = new Table({
  owner_id: column.text,
  title: column.text,
  description: column.text,
  subject: column.text,
  grade_level: column.text,
  icon: column.text,
  created_at: column.integer,
  updated_at: column.integer
})

const questionsTable = new Table({
  exam_id: column.text,
  position: column.integer,
  kind: column.text,
  prompt: column.text,
  points: column.real,
  options_json: column.text,
  image: column.text,
  answer_bool: column.integer, // boolean stored as 0/1
  language: column.text,
  starter_code: column.text
})

const examSessionsTable = new Table({
  exam_id: column.text,
  owner_id: column.text,
  status: column.text,
  duration_minutes: column.integer,
  allow_late_join: column.integer, // boolean stored as 0/1
  started_at: column.integer,
  ended_at: column.integer,
  created_at: column.integer
})

// token intentionally excluded (LAN-only auth token)
const studentsTable = new Table({
  session_id: column.text,
  name: column.text,
  matricula: column.text,
  joined_at: column.integer,
  last_seen_at: column.integer,
  submitted_at: column.integer,
  left_at: column.integer
})

const answersTable = new Table({
  student_id: column.text,
  question_id: column.text,
  value: column.text,
  score: column.real,
  updated_at: column.integer
})

export const AppSchema = new Schema({
  exams: examsTable,
  questions: questionsTable,
  exam_sessions: examSessionsTable,
  students: studentsTable,
  answers: answersTable
})

export type AppSchemaType = (typeof AppSchema)['types']
