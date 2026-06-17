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

export const UpdateProfileInput = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  email: z.string().email('E-mail inválido')
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1, 'Obrigatório'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(200)
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>

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
  submittedAt: z.number().int().nullable(),
  answeredCount: z.number().int().nonnegative()
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
  questionsCount: z.number().int().nonnegative(),
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

// -- Student gameplay (Stage 6) -------------------------------------------

// MCQ question as seen by a student — same as McqQuestion but each option
// strips the `correct` flag so the student can't read it via DevTools.
export const StudentMcqOption = z.object({
  id: z.string(),
  text: z.string()
})
export type StudentMcqOption = z.infer<typeof StudentMcqOption>

export const StudentMcqQuestion = z.object({
  kind: z.literal('mcq'),
  id: z.string(),
  position: z.number().int().nonnegative(),
  prompt: z.string(),
  options: z.array(StudentMcqOption)
})

export const StudentEssayQuestion = z.object({
  kind: z.literal('essay'),
  id: z.string(),
  position: z.number().int().nonnegative(),
  prompt: z.string()
})

export const StudentQuestion = z.discriminatedUnion('kind', [
  StudentMcqQuestion,
  StudentEssayQuestion
])
export type StudentQuestion = z.infer<typeof StudentQuestion>

export const StudentExam = z.object({
  examTitle: z.string(),
  examDescription: z.string().nullable(),
  durationMinutes: z.number().int(),
  startedAt: z.number().int().nullable(),
  questions: z.array(StudentQuestion)
})
export type StudentExam = z.infer<typeof StudentExam>

export const StudentAnswerSnapshot = z.object({
  questionId: z.string(),
  value: z.string(),
  updatedAt: z.number().int()
})
export type StudentAnswerSnapshot = z.infer<typeof StudentAnswerSnapshot>

export const StudentSessionState = z.object({
  sessionId: z.string(),
  status: SessionStatus,
  studentId: z.string(),
  studentName: z.string(),
  studentMatricula: z.string(),
  submittedAt: z.number().int().nullable(),
  answers: z.array(StudentAnswerSnapshot)
})
export type StudentSessionState = z.infer<typeof StudentSessionState>

export const AnswerInput = z.object({
  questionId: z.string(),
  value: z.string().max(10_000)
})
export type AnswerInput = z.infer<typeof AnswerInput>

// -- Teacher-side review of submitted answers (Stage 5) -------------------

export const StudentAnswerReview = z.object({
  question: Question,
  value: z.string().nullable(),
  correct: z.boolean().nullable(),
  // 1.0 / 0.0 derived for MCQ. For essay: null until the teacher grades it,
  // then whatever score they entered.
  score: z.number().nullable()
})
export type StudentAnswerReview = z.infer<typeof StudentAnswerReview>

export const SessionAnswersReview = z.object({
  sessionId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  studentMatricula: z.string(),
  examTitle: z.string(),
  submittedAt: z.number().int().nullable(),
  answers: z.array(StudentAnswerReview),
  totalScore: z.number(),
  maxScore: z.number().int().nonnegative()
})
export type SessionAnswersReview = z.infer<typeof SessionAnswersReview>

export const GradeAnswerInput = z.object({
  studentId: z.string(),
  questionId: z.string(),
  score: z.number().min(0).max(10)
})
export type GradeAnswerInput = z.infer<typeof GradeAnswerInput>

// Compact row for the "activities applied" list on the teacher Home.
export const SessionSummary = z.object({
  id: z.string(),
  examId: z.string(),
  examTitle: z.string(),
  status: SessionStatus,
  durationMinutes: z.number().int(),
  studentsCount: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
  createdAt: z.number().int(),
  startedAt: z.number().int().nullable(),
  endedAt: z.number().int().nullable()
})
export type SessionSummary = z.infer<typeof SessionSummary>

// Graded outcome of an ended session, for the Home "recent results" list.
export const SessionResultSummary = z.object({
  id: z.string(),
  examTitle: z.string(),
  // Submitted students — the population the average is taken over.
  studentCount: z.number().int().nonnegative(),
  // Mean grade across submitted students, 0–10.
  averageScore: z.number(),
  endedAt: z.number().int().nullable()
})
export type SessionResultSummary = z.infer<typeof SessionResultSummary>
