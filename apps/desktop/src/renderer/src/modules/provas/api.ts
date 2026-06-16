import type { Exam, ExamInput, ExamSummary, ExamUpdate } from '@offlineclass/shared'

/* Teacher provas over the domain IPC bridge (window.api.exams → main process).
   "Prova" in the UI maps to the backend's "exam". */

export function listExams(): Promise<ExamSummary[]> {
  return window.api.exams.list()
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
