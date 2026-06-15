export type Prova = {
  id: string
  title: string
  questionCount: number
  /** Pre-formatted "updated" label, e.g. "há 2 dias". */
  updatedLabel: string
}

export type SessionResult = {
  id: string
  provaTitle: string
  turma: string
  studentCount: number
  /** Average grade, 0–10. */
  average: number
}

export type LiveSession = {
  provaTitle: string
  groups: number
  students: number
  minutesLeft: number
}

export type HomeStats = {
  provas: number
  sessions: number
  studentsGraded: number
}
