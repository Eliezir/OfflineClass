-- OfflineClass connector — initial schema migration
-- Applies to: source Postgres (pg-db)
-- Run by: src/migrate.ts on connector startup

-- ─── Cloud auth (NOT synced by PowerSync) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS cloud_accounts (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  -- local_teacher_id = UUID from apps/desktop teachers.id; becomes JWT sub + owner_id
  local_teacher_id  TEXT NOT NULL UNIQUE,
  created_at        BIGINT NOT NULL
);

-- ─── Syncable entities (mirror apps/desktop/src/main/db/schema.ts) ──────────

CREATE TABLE IF NOT EXISTS exams (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  subject      TEXT,
  grade_level  TEXT,
  icon         TEXT,
  created_at   BIGINT NOT NULL,
  updated_at   BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id           TEXT PRIMARY KEY,
  exam_id      TEXT NOT NULL,
  position     INTEGER NOT NULL,
  kind         TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  points       REAL NOT NULL DEFAULT 1,
  options_json TEXT,
  image        TEXT,
  answer_bool  BOOLEAN,
  language     TEXT,
  starter_code TEXT
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id               TEXT PRIMARY KEY,
  exam_id          TEXT NOT NULL,
  owner_id         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'lobby',
  duration_minutes INTEGER NOT NULL,
  allow_late_join  BOOLEAN NOT NULL DEFAULT false,
  started_at       BIGINT,
  ended_at         BIGINT,
  created_at       BIGINT NOT NULL
);

-- students.token is intentionally absent (LAN-only auth token, not synced)
CREATE TABLE IF NOT EXISTS students (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  matricula     TEXT NOT NULL,
  joined_at     BIGINT NOT NULL,
  last_seen_at  BIGINT NOT NULL,
  submitted_at  BIGINT,
  left_at       BIGINT
);

CREATE TABLE IF NOT EXISTS answers (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,
  score       REAL,
  updated_at  BIGINT NOT NULL
);

-- ─── Indexes for Sync Stream queries (owner_id lookups) ─────────────────────

CREATE INDEX IF NOT EXISTS idx_exams_owner_id        ON exams (owner_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_owner   ON exam_sessions (owner_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id     ON questions (exam_id);
CREATE INDEX IF NOT EXISTS idx_students_session_id   ON students (session_id);
CREATE INDEX IF NOT EXISTS idx_answers_student_id    ON answers (student_id);
