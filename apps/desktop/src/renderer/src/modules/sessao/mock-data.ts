import type { Question, SessionAnswersReview, SessionLobbyStudent } from '@offlineclass/shared'
import type { SessionDetail, SessionStatus } from './types'

/* DEV-only sample data so we can exercise the live dashboard + single-student
   drill-down without students actually joining over the LAN (that needs the
   teacher WebSocket — separate branch). Shaped exactly like the backend's
   `SessionDetail` / `SessionAnswersReview`, so it's a drop-in for real IPC. */

const MINUTE = 60_000
const EXAM_TITLE = 'Prova de Redes — Camada de Transporte'

export const MOCK_QUESTIONS: Question[] = [
  {
    kind: 'mcq',
    id: 'q1',
    position: 0,
    prompt: 'Qual camada do modelo OSI é responsável pela entrega fim a fim entre processos?',
    options: [
      { id: 'q1a', text: 'Camada de enlace', correct: false },
      { id: 'q1b', text: 'Camada de rede', correct: false },
      { id: 'q1c', text: 'Camada de transporte', correct: true },
      { id: 'q1d', text: 'Camada de aplicação', correct: false }
    ]
  },
  {
    kind: 'mcq',
    id: 'q2',
    position: 1,
    prompt: 'O protocolo TCP é caracterizado por:',
    options: [
      { id: 'q2a', text: 'Não ser orientado a conexão', correct: false },
      { id: 'q2b', text: 'Entrega ordenada e confiável', correct: true },
      { id: 'q2c', text: 'Ausência de controle de fluxo', correct: false },
      { id: 'q2d', text: 'Multicast nativo', correct: false }
    ]
  },
  {
    kind: 'essay',
    id: 'q3',
    position: 2,
    prompt: 'Explique, em poucas linhas, o handshake de três vias do TCP.'
  },
  {
    kind: 'mcq',
    id: 'q4',
    position: 3,
    prompt: 'Sobre o protocolo UDP, é correto afirmar que ele:',
    options: [
      { id: 'q4a', text: 'Garante a entrega dos pacotes', correct: false },
      { id: 'q4b', text: 'É orientado a conexão', correct: false },
      { id: 'q4c', text: 'Tem menor overhead, sem garantia de entrega', correct: true },
      { id: 'q4d', text: 'Possui controle de congestionamento', correct: false }
    ]
  },
  {
    kind: 'mcq',
    id: 'q5',
    position: 4,
    prompt: 'Qual porta padrão o HTTPS utiliza?',
    options: [
      { id: 'q5a', text: '80', correct: false },
      { id: 'q5b', text: '21', correct: false },
      { id: 'q5c', text: '443', correct: true },
      { id: 'q5d', text: '25', correct: false }
    ]
  },
  {
    kind: 'essay',
    id: 'q6',
    position: 5,
    prompt: 'Descreva a diferença entre comutação de pacotes e comutação de circuitos.'
  }
]

const QUESTIONS_COUNT = MOCK_QUESTIONS.length
const DURATION_MINUTES = 60

const ESSAY_SAMPLES: Record<string, string> = {
  q3: 'No handshake de três vias o cliente envia um segmento SYN, o servidor responde com SYN-ACK e o cliente confirma com ACK, estabelecendo a conexão antes da troca de dados.',
  q6: 'Na comutação de circuitos um caminho dedicado é reservado durante toda a sessão; na de pacotes os dados são divididos em pacotes roteados de forma independente, compartilhando os enlaces.'
}

type StudentSeed = {
  id: string
  name: string
  matricula: string
  joinedMinutesAgo: number
  answered: number
  lastSeenMinutesAgo: number
  submittedMinutesAgo: number | null
}

const STUDENT_SEEDS: StudentSeed[] = [
  {
    id: 's1',
    name: 'Ana Lima',
    matricula: '2021001',
    joinedMinutesAgo: 6,
    answered: 6,
    lastSeenMinutesAgo: 1,
    submittedMinutesAgo: 1
  },
  {
    id: 's2',
    name: 'Bruno Rocha',
    matricula: '2021002',
    joinedMinutesAgo: 6,
    answered: 5,
    lastSeenMinutesAgo: 0,
    submittedMinutesAgo: null
  },
  {
    id: 's3',
    name: 'Caio Souza',
    matricula: '2021003',
    joinedMinutesAgo: 5,
    answered: 3,
    lastSeenMinutesAgo: 0,
    submittedMinutesAgo: null
  },
  {
    id: 's4',
    name: 'Duda Martins',
    matricula: '2021004',
    joinedMinutesAgo: 5,
    answered: 2,
    lastSeenMinutesAgo: 4,
    submittedMinutesAgo: null
  },
  {
    id: 's5',
    name: 'Enzo Pereira',
    matricula: '2021005',
    joinedMinutesAgo: 4,
    answered: 6,
    lastSeenMinutesAgo: 2,
    submittedMinutesAgo: 3
  },
  {
    id: 's6',
    name: 'Fernanda Dias',
    matricula: '2021006',
    joinedMinutesAgo: 4,
    answered: 4,
    lastSeenMinutesAgo: 0,
    submittedMinutesAgo: null
  },
  {
    id: 's7',
    name: 'Gabriel Nunes',
    matricula: '2021007',
    joinedMinutesAgo: 3,
    answered: 5,
    lastSeenMinutesAgo: 1,
    submittedMinutesAgo: null
  },
  {
    id: 's8',
    name: 'Helena Castro',
    matricula: '2021008',
    joinedMinutesAgo: 2,
    answered: 0,
    lastSeenMinutesAgo: 7,
    submittedMinutesAgo: null
  }
]

function lobbyStudent(seed: StudentSeed, status: SessionStatus, now: number): SessionLobbyStudent {
  const joinedAt = now - seed.joinedMinutesAgo * MINUTE
  if (status === 'lobby') {
    return {
      id: seed.id,
      name: seed.name,
      matricula: seed.matricula,
      groupId: null,
      joinedAt,
      lastSeenAt: now,
      submittedAt: null,
      answeredCount: 0
    }
  }
  const submitted = status === 'ended' ? (seed.submittedMinutesAgo ?? 0) : seed.submittedMinutesAgo
  const submittedAt = submitted === null ? null : now - submitted * MINUTE
  const answered = submittedAt !== null ? QUESTIONS_COUNT : seed.answered
  return {
    id: seed.id,
    name: seed.name,
    matricula: seed.matricula,
    groupId: null,
    joinedAt,
    lastSeenAt: submittedAt ?? now - seed.lastSeenMinutesAgo * MINUTE,
    submittedAt,
    answeredCount: answered
  }
}

/** Build a `SessionDetail` for a given lifecycle phase (DEV preview). */
export function buildMockSession(
  status: SessionStatus,
  now: number,
  startedAt: number | null
): SessionDetail {
  return {
    id: 'sess-mock',
    examId: 'p1',
    examTitle: EXAM_TITLE,
    status,
    durationMinutes: DURATION_MINUTES,
    allowLateJoin: false,
    questionsCount: QUESTIONS_COUNT,
    students: STUDENT_SEEDS.map((s) => lobbyStudent(s, status, now)),
    createdAt: now - 10 * MINUTE,
    startedAt: status === 'lobby' ? null : (startedAt ?? now - 18 * MINUTE),
    endedAt: status === 'ended' ? now : null
  }
}

/** Build a `SessionAnswersReview` for one student (DEV preview of the drill-down). */
export function buildMockReview(student: SessionLobbyStudent): SessionAnswersReview {
  const seed = [...student.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

  const answers = MOCK_QUESTIONS.map((question, i) => {
    if (i >= student.answeredCount) {
      return { question, value: null, correct: null, score: null }
    }
    if (question.kind === 'mcq') {
      const correctOption = question.options.find((o) => o.correct) ?? question.options[0]
      // Deterministic variety: roughly one in four answers is wrong.
      const pickWrong = (seed + i) % 4 === 0
      const chosen = pickWrong
        ? (question.options.find((o) => !o.correct) ?? correctOption)
        : correctOption
      return { question, value: chosen.id, correct: chosen.correct, score: chosen.correct ? 1 : 0 }
    }
    return {
      question,
      value: ESSAY_SAMPLES[question.id] ?? 'Resposta do aluno…',
      correct: null,
      score: null
    }
  })

  return {
    sessionId: 'sess-mock',
    studentId: student.id,
    studentName: student.name,
    studentMatricula: student.matricula,
    examTitle: EXAM_TITLE,
    submittedAt: student.submittedAt,
    answers,
    totalScore: answers.reduce((acc, r) => acc + (r.score ?? 0), 0),
    maxScore: QUESTIONS_COUNT
  }
}
