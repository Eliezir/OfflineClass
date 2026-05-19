import { z } from 'zod'
import {
  DiscoveryStatus,
  Exam,
  ExamSummary,
  Question,
  SessionAnswersReview,
  SessionDetail,
  SessionSummary,
  Teacher,
  type ExamInput,
  type ExamUpdate,
  type LoginInput,
  type QuestionInput,
  type RegisterInput,
  type SessionCreateInput
} from '@offlineclass/shared'

const TeacherOrNull = Teacher.nullable()
const ExamSummaries = z.array(ExamSummary)
const QuestionList = z.array(Question)
const SessionOrNull = SessionDetail.nullable()
const SessionSummaries = z.array(SessionSummary)

export const api = {
  discovery: {
    getStatus: async () => DiscoveryStatus.parse(await window.api.discovery.getStatus())
  },
  auth: {
    register: async (input: RegisterInput) => Teacher.parse(await window.api.auth.register(input)),
    login: async (input: LoginInput) => Teacher.parse(await window.api.auth.login(input)),
    me: async () => TeacherOrNull.parse(await window.api.auth.me()),
    logout: async () => {
      await window.api.auth.logout()
    }
  },
  exams: {
    list: async () => ExamSummaries.parse(await window.api.exams.list()),
    get: async (id: string) => Exam.parse(await window.api.exams.get(id)),
    create: async (input: ExamInput) => Exam.parse(await window.api.exams.create(input)),
    update: async (id: string, patch: ExamUpdate) =>
      Exam.parse(await window.api.exams.update(id, patch)),
    delete: async (id: string) => {
      await window.api.exams.delete(id)
    },
    duplicate: async (id: string) => Exam.parse(await window.api.exams.duplicate(id))
  },
  questions: {
    add: async (examId: string, input: QuestionInput) =>
      Question.parse(await window.api.questions.add(examId, input)),
    update: async (id: string, input: QuestionInput) =>
      Question.parse(await window.api.questions.update(id, input)),
    delete: async (id: string) => {
      await window.api.questions.delete(id)
    },
    reorder: async (examId: string, orderedIds: string[]) =>
      QuestionList.parse(await window.api.questions.reorder(examId, orderedIds))
  },
  sessions: {
    list: async () => SessionSummaries.parse(await window.api.sessions.list()),
    create: async (input: SessionCreateInput) =>
      SessionDetail.parse(await window.api.sessions.create(input)),
    get: async (id: string) => SessionDetail.parse(await window.api.sessions.get(id)),
    active: async () => SessionOrNull.parse(await window.api.sessions.active()),
    start: async (id: string) => SessionDetail.parse(await window.api.sessions.start(id)),
    end: async (id: string) => SessionDetail.parse(await window.api.sessions.end(id)),
    broadcastLobby: async (id: string) => {
      await window.api.sessions.broadcastLobby(id)
    },
    studentAnswers: async (sessionId: string, studentId: string) =>
      SessionAnswersReview.parse(await window.api.sessions.studentAnswers(sessionId, studentId))
  }
}
