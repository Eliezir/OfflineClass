import type {
  JoinResult,
  SessionPublic,
  StudentExam,
  StudentSessionState
} from '@offlineclass/shared'

/**
 * Dev-only fixtures mirroring the real "Prova de redes" exam exported from a
 * teacher DB. Used by {@link installDevMock} so the student renderer can be run
 * standalone in a browser (`pnpm dev:web:mock`) for UI work — no LAN backend,
 * no teacher login, no self-signed TLS. Never bundled into the Electron app
 * (guarded by `import.meta.env.VITE_MOCK`).
 */

const SESSION_ID = 'mock-session'
const STUDENT_ID = 'mock-student'

export const mockExam: StudentExam = {
  examTitle: 'Prova de redes',
  examDescription: 'Avaliação da disciplina de Redes de Computadores.',
  durationMinutes: 60,
  // Set at install time so the countdown is live.
  startedAt: Date.now(),
  scrambleQuestions: false,
  scrambleOptions: false,
  questions: [
    {
      kind: 'mcq',
      id: 'd912be61-61ee-472c-b0e0-c1e798da8333',
      position: 0,
      prompt: 'De quanto o Flamengo ganhou do Liverpool em 1981?',
      image: null,
      options: [
        { id: 'af9fe927-ebd9-449f-a45a-f4da362d7c2a', text: '3 a 1' },
        { id: '9742f5c8-28ad-4d25-9584-c48675319e95', text: '15 a 0' }
      ]
    },
    {
      kind: 'essay',
      id: 'afb7dce6-21b1-413e-9c90-f5eacfe128cd',
      position: 1,
      prompt:
        'Explique a diferença entre os protocolos TCP e UDP, citando um cenário de uso adequado para cada um.',
      image: null
    },
    {
      kind: 'truefalse',
      id: 'de577a05-b0ee-49ac-b2a7-33a1a6ca8ac2',
      position: 2,
      prompt: 'O endereço IP 192.168.0.1 pertence a uma faixa de rede privada.',
      image: null
    }
  ]
}

export const mockSessionPublic: SessionPublic = {
  id: SESSION_ID,
  status: 'running',
  examTitle: mockExam.examTitle,
  durationMinutes: mockExam.durationMinutes,
  allowLateJoin: true,
  scrambleQuestions: false,
  scrambleOptions: false,
  groupMode: 'disabled',
  teacherName: 'Prof. Eliezir',
  teacherAvatar: null
}

export function makeJoinResult(name: string, matricula: string): JoinResult {
  return {
    token: 'mock-token',
    studentId: STUDENT_ID,
    sessionId: SESSION_ID,
    status: 'running',
    studentName: name || 'Aluno de Teste',
    studentMatricula: matricula || '0000-0000'
  }
}

export function makeSessionState(
  name = 'Aluno de Teste',
  matricula = '0000-0000'
): StudentSessionState {
  return {
    sessionId: SESSION_ID,
    status: 'running',
    studentId: STUDENT_ID,
    studentName: name,
    studentMatricula: matricula,
    submittedAt: null,
    answers: [],
    groupMode: 'disabled',
    maxGroupSize: null,
    scrambleQuestions: false,
    scrambleOptions: false
  }
}
