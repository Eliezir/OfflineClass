import { z } from 'zod'

export const DiscoveryStatus = z.object({
  lanIp: z.string(),
  port: z.number().int().positive(),
  mdnsName: z.string(),
  qrDataUrl: z.string()
})
export type DiscoveryStatus = z.infer<typeof DiscoveryStatus>

// -- Auth ------------------------------------------------------------------

export const Teacher = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})
export type Teacher = z.infer<typeof Teacher>

export const RegisterInput = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(200)
})
export type RegisterInput = z.infer<typeof RegisterInput>

export const LoginInput = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório')
})
export type LoginInput = z.infer<typeof LoginInput>

// -- Exams & questions -----------------------------------------------------

export const McqOption = z.object({
  id: z.string(),
  text: z.string().min(1, 'Texto obrigatório').max(500),
  correct: z.boolean()
})
export type McqOption = z.infer<typeof McqOption>

export const McqInput = z.object({
  kind: z.literal('mcq'),
  prompt: z.string().min(1, 'Enunciado obrigatório').max(2000),
  options: z
    .array(McqOption)
    .min(2, 'Mínimo 2 opções')
    .max(8, 'Máximo 8 opções')
    .refine(
      (opts) => opts.filter((o) => o.correct).length === 1,
      'Exatamente uma opção correta'
    )
})
export type McqInput = z.infer<typeof McqInput>

export const EssayInput = z.object({
  kind: z.literal('essay'),
  prompt: z.string().min(1, 'Enunciado obrigatório').max(2000)
})
export type EssayInput = z.infer<typeof EssayInput>

export const QuestionInput = z.discriminatedUnion('kind', [McqInput, EssayInput])
export type QuestionInput = z.infer<typeof QuestionInput>

export const McqQuestion = McqInput.extend({
  id: z.string(),
  position: z.number().int().nonnegative()
})
export type McqQuestion = z.infer<typeof McqQuestion>

export const EssayQuestion = EssayInput.extend({
  id: z.string(),
  position: z.number().int().nonnegative()
})
export type EssayQuestion = z.infer<typeof EssayQuestion>

export const Question = z.discriminatedUnion('kind', [McqQuestion, EssayQuestion])
export type Question = z.infer<typeof Question>

export const ExamInput = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
  description: z.string().max(2000).nullable().optional()
})
export type ExamInput = z.infer<typeof ExamInput>

export const ExamUpdate = ExamInput.partial()
export type ExamUpdate = z.infer<typeof ExamUpdate>

export const ExamSummary = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  questionsCount: z.number().int().nonnegative(),
  createdAt: z.number().int(),
  updatedAt: z.number().int()
})
export type ExamSummary = z.infer<typeof ExamSummary>

export const Exam = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(Question),
  createdAt: z.number().int(),
  updatedAt: z.number().int()
})
export type Exam = z.infer<typeof Exam>

// -- Exam sessions (lobby / running / ended) -------------------------------

export const SessionStatus = z.enum(['lobby', 'running', 'ended'])
export type SessionStatus = z.infer<typeof SessionStatus>

export const SessionLobbyStudent = z.object({
  id: z.string(),
  name: z.string(),
  matricula: z.string(),
  joinedAt: z.number().int(),
  lastSeenAt: z.number().int(),
  submittedAt: z.number().int().nullable()
})
export type SessionLobbyStudent = z.infer<typeof SessionLobbyStudent>

export const SessionCreateInput = z.object({
  examId: z.string(),
  durationMinutes: z.number().int().positive().max(600),
  allowLateJoin: z.boolean().optional()
})
export type SessionCreateInput = z.infer<typeof SessionCreateInput>

export const SessionDetail = z.object({
  id: z.string(),
  examId: z.string(),
  examTitle: z.string(),
  status: SessionStatus,
  durationMinutes: z.number().int(),
  allowLateJoin: z.boolean(),
  students: z.array(SessionLobbyStudent),
  createdAt: z.number().int(),
  startedAt: z.number().int().nullable(),
  endedAt: z.number().int().nullable()
})
export type SessionDetail = z.infer<typeof SessionDetail>

// What `/api/session/active` returns to anyone on the LAN (no auth).
// Intentionally narrower than SessionDetail — no examId, no students list.
export const SessionPublic = z.object({
  id: z.string(),
  status: SessionStatus,
  examTitle: z.string(),
  durationMinutes: z.number().int(),
  allowLateJoin: z.boolean()
})
export type SessionPublic = z.infer<typeof SessionPublic>

export const JoinInput = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(80),
  matricula: z.string().min(2, 'Matrícula obrigatória').max(40)
})
export type JoinInput = z.infer<typeof JoinInput>

export const JoinResult = z.object({
  token: z.string(),
  studentId: z.string(),
  sessionId: z.string(),
  status: SessionStatus,
  studentName: z.string(),
  studentMatricula: z.string()
})
export type JoinResult = z.infer<typeof JoinResult>

export const WsServerEvent = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('connection.ack'),
    role: z.enum(['teacher', 'student'])
  }),
  z.object({
    type: z.literal('session.lobby.update'),
    students: z.array(SessionLobbyStudent)
  }),
  z.object({
    type: z.literal('session.started'),
    startedAt: z.number().int(),
    durationMinutes: z.number().int()
  }),
  z.object({
    type: z.literal('session.ended'),
    endedAt: z.number().int()
  })
])
export type WsServerEvent = z.infer<typeof WsServerEvent>
