/* Seeds the runtime SQLite DB with a demo running session + two collaborative
 * groups + students, so the Sessão screen, student-web and the group real-time
 * broadcast can be exercised without going through creation UIs that don't
 * exist yet.
 *
 * Run via `pnpm --filter ./apps/desktop db:seed` (Electron-as-Node, so the
 * better-sqlite3 native ABI matches — same trick as db:studio). Boot the app
 * at least once first so migrations have created the schema. Idempotent: fixed
 * ids are deleted and re-inserted on each run.
 */
const Database = require('better-sqlite3')
const { homedir } = require('node:os')
const { join } = require('node:path')

function runtimeDbPath() {
  const appDir = join('@offlineclass', 'desktop')
  const base =
    process.platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? process.env.APPDATA || join(homedir(), 'AppData', 'Roaming')
        : process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  return process.env.OFFLINECLASS_DB_FILE || join(base, appDir, 'offlineclass.db')
}

const now = Date.now()
const ID = {
  exam: 'seed-exam',
  session: 'seed-session',
  groupA: 'seed-group-a',
  groupB: 'seed-group-b',
  q1: 'seed-q1',
  q2: 'seed-q2',
  q3: 'seed-q3'
}
const STUDENTS = [
  { id: 'seed-stu-a1', name: 'Ana (Grupo A)', matricula: 'A001', token: 'seed-tok-a1', group: ID.groupA },
  { id: 'seed-stu-a2', name: 'Bruno (Grupo A)', matricula: 'A002', token: 'seed-tok-a2', group: ID.groupA },
  { id: 'seed-stu-b1', name: 'Carla (Grupo B)', matricula: 'B001', token: 'seed-tok-b1', group: ID.groupB }
]

const dbPath = runtimeDbPath()
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

const teacher = db.prepare('SELECT id, email FROM teachers ORDER BY created_at ASC LIMIT 1').get()
if (!teacher) {
  console.error(
    'Nenhum professor cadastrado. Rode o app e crie uma conta antes de semear (DB: ' + dbPath + ').'
  )
  process.exit(1)
}

const mcqOptions = (correctIdx) =>
  JSON.stringify(
    ['A', 'B', 'C', 'D'].map((t, i) => ({ id: `opt-${t.toLowerCase()}`, text: `Alternativa ${t}`, correct: i === correctIdx }))
  )

const seed = db.transaction(() => {
  // Clean prior seed (cascade removes its questions/groups/students/answers).
  db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(ID.session)
  db.prepare('DELETE FROM exams WHERE id = ?').run(ID.exam)

  db.prepare(
    'INSERT INTO exams (id, owner_id, title, description, created_at, updated_at) VALUES (?,?,?,?,?,?)'
  ).run(ID.exam, teacher.id, 'Seed — Prova de Redes (grupos)', 'Sessão de teste com grupos colaborativos', now, now)

  db.prepare('INSERT INTO questions (id, exam_id, position, kind, prompt, options_json) VALUES (?,?,?,?,?,?)')
    .run(ID.q1, ID.exam, 0, 'mcq', 'Qual camada do modelo OSI cuida do roteamento?', mcqOptions(2))
  db.prepare('INSERT INTO questions (id, exam_id, position, kind, prompt, options_json) VALUES (?,?,?,?,?,?)')
    .run(ID.q2, ID.exam, 1, 'mcq', 'Qual protocolo é orientado à conexão?', mcqOptions(0))
  db.prepare('INSERT INTO questions (id, exam_id, position, kind, prompt, options_json) VALUES (?,?,?,?,?,?)')
    .run(ID.q3, ID.exam, 2, 'essay', 'Explique a diferença entre TCP e UDP.', null)

  db.prepare(
    'INSERT INTO exam_sessions (id, exam_id, owner_id, status, duration_minutes, allow_late_join, started_at, ended_at, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(ID.session, ID.exam, teacher.id, 'running', 60, 1, now, null, now)

  db.prepare('INSERT INTO groups (id, session_id, name, color, created_at) VALUES (?,?,?,?,?)')
    .run(ID.groupA, ID.session, 'Grupo A', '#6366f1', now)
  db.prepare('INSERT INTO groups (id, session_id, name, color, created_at) VALUES (?,?,?,?,?)')
    .run(ID.groupB, ID.session, 'Grupo B', '#22c55e', now)

  const insStu = db.prepare(
    'INSERT INTO students (id, session_id, group_id, name, matricula, token, joined_at, last_seen_at, submitted_at) VALUES (?,?,?,?,?,?,?,?,?)'
  )
  for (const s of STUDENTS) {
    insStu.run(s.id, ID.session, s.group, s.name, s.matricula, s.token, now, now, null)
  }
})

seed()
db.close()

console.log('Seed OK — DB:', dbPath)
console.log('Professor:', teacher.email)
console.log('Sessão (running):', ID.session)
console.log('Grupos:', ID.groupA, ID.groupB)
console.log('Alunos (token):')
for (const s of STUDENTS) console.log(`  ${s.name} → ${s.token} [${s.group}]`)
console.log('Questões:', ID.q1, ID.q2, ID.q3)
