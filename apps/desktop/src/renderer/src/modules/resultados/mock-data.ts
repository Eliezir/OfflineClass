import { MOCK_QUESTIONS } from '@renderer/modules/sessao/mock-data'
import type { EndedSession, GradedAnswer, SessionResults, StudentResult } from './types'
import { tally } from './scoring'

/* DEV-only sample data so the correção flow can be built/previewed without a real
   finished session. Mirrors the real shapes; the only addition is per-question
   `points` (peso), which the backend doesn't store yet — see scoring.ts. */

const MINUTE = 60_000

// Weight per question (peso): essays worth 2, MCQ worth 1 → total 8.
const POINTS: Record<string, number> = { q1: 1, q2: 1, q3: 2, q4: 1, q5: 1, q6: 2 }

const ESSAY_SAMPLES: Record<string, string> = {
  q3: 'No handshake de três vias o cliente envia um segmento SYN, o servidor responde com SYN-ACK e o cliente confirma com ACK, estabelecendo a conexão antes da troca de dados.',
  q6: 'Na comutação de circuitos um caminho dedicado é reservado durante toda a sessão; na de pacotes os dados são divididos em pacotes roteados de forma independente.'
}

const MOCK_SESSION_ID = 'res-mock'
const EXAM_TITLE = 'Prova de Redes — Camada de Transporte'

type Seed = {
  id: string
  name: string
  matricula: string
  /** How many questions (in order) the student answered. */
  answered: number
  /** Whether the teacher already graded this student's essays. */
  essaysGraded: boolean
}

const SEEDS: Seed[] = [
  { id: 's1', name: 'Ana Lima', matricula: '2021001', answered: 6, essaysGraded: true },
  { id: 's2', name: 'Bruno Rocha', matricula: '2021002', answered: 6, essaysGraded: false },
  { id: 's3', name: 'Caio Souza', matricula: '2021003', answered: 5, essaysGraded: false },
  { id: 's4', name: 'Duda Martins', matricula: '2021004', answered: 6, essaysGraded: true },
  { id: 's5', name: 'Enzo Pereira', matricula: '2021005', answered: 4, essaysGraded: false },
  { id: 's6', name: 'Fernanda Dias', matricula: '2021006', answered: 6, essaysGraded: true }
]

function buildStudent(seed: Seed, now: number): StudentResult {
  const num = [...seed.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

  const answers: GradedAnswer[] = MOCK_QUESTIONS.map((question, i) => {
    const points = POINTS[question.id] ?? 1
    if (i >= seed.answered) {
      return { question, value: null, points, awarded: null }
    }
    if (question.kind === 'mcq') {
      const correctOption = question.options.find((o) => o.correct) ?? question.options[0]
      const pickWrong = (num + i) % 4 === 0
      const chosen = pickWrong
        ? (question.options.find((o) => !o.correct) ?? correctOption)
        : correctOption
      return { question, value: chosen.id, points, awarded: chosen.correct ? points : 0 }
    }
    // Essay: graded students get ~75% of the weight; the rest stay pending.
    const awarded = seed.essaysGraded ? Math.round(points * 0.75 * 2) / 2 : null
    return { question, value: ESSAY_SAMPLES[question.id] ?? 'Resposta do aluno…', points, awarded }
  })

  return {
    studentId: seed.id,
    name: seed.name,
    matricula: seed.matricula,
    submittedAt: now - (num % 10) * MINUTE,
    answers,
    ...tally(answers)
  }
}

export function buildMockResults(now: number): SessionResults {
  return {
    sessionId: MOCK_SESSION_ID,
    examTitle: EXAM_TITLE,
    endedAt: now - 30 * MINUTE,
    students: SEEDS.map((s) => buildStudent(s, now))
  }
}

export function buildMockEndedSessions(now: number): EndedSession[] {
  return [
    {
      id: MOCK_SESSION_ID,
      examTitle: EXAM_TITLE,
      endedAt: now - 30 * MINUTE,
      studentsCount: SEEDS.length,
      submittedCount: SEEDS.length
    },
    {
      id: 'res-mock-2',
      examTitle: 'Sistemas Operacionais — Escalonamento',
      endedAt: now - 2 * 24 * 60 * MINUTE,
      studentsCount: 22,
      submittedCount: 20
    }
  ]
}
