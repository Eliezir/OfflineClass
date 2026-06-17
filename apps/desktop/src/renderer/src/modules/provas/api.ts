import type {
  Exam,
  ExamInput,
  ExamSummary,
  ExamUpdate,
  Question,
  QuestionInput
} from '@offlineclass/shared'

/* Teacher provas over the domain IPC bridge (window.api.exams → main process).
   "Prova" in the UI maps to the backend's "exam". */

export function listExams(): Promise<ExamSummary[]> {
  return window.api.exams.list()
}

export function getExam(id: string): Promise<Exam> {
  return window.api.exams.get(id)
}

export function createExam(input: ExamInput): Promise<Exam> {
  return window.api.exams.create(input)
}

export function updateExam(id: string, patch: ExamUpdate): Promise<Exam> {
  return window.api.exams.update(id, patch)
}

export function deleteExam(id: string): Promise<null> {
  return window.api.exams.delete(id)
}

export function duplicateExam(id: string): Promise<Exam> {
  return window.api.exams.duplicate(id)
}

/* Questions inside a prova. */

export function addQuestion(examId: string, input: QuestionInput): Promise<Question> {
  return window.api.questions.add(examId, input)
}

export function updateQuestion(id: string, input: QuestionInput): Promise<Question> {
  return window.api.questions.update(id, input)
}

export function deleteQuestion(id: string): Promise<null> {
  return window.api.questions.delete(id)
}

export function reorderQuestions(examId: string, orderedIds: string[]): Promise<Question[]> {
  return window.api.questions.reorder(examId, orderedIds)
}
