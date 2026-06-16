import type { HomeStats, LiveSession, Prova, SessionResult } from './types'

/* Placeholder data for the home dashboard until the backend wires it for real.
   Set `liveSession` to null to preview the dashboard with no session running. */

export const liveSession: LiveSession | null = {
  provaTitle: 'Prova de Redes',
  groups: 3,
  students: 8,
  minutesLeft: 12
}

export const homeStats: HomeStats = {
  provas: 12,
  sessions: 34,
  studentsGraded: 210
}

export const recentProvas: Prova[] = [
  {
    id: 'p1',
    title: 'Prova de Redes — Camada de Transporte',
    questionCount: 15,
    updatedLabel: 'há 2 dias'
  },
  {
    id: 'p2',
    title: 'Sistemas Operacionais — Escalonamento',
    questionCount: 10,
    updatedLabel: 'há 5 dias'
  },
  {
    id: 'p3',
    title: 'Fundamentos de Programação',
    questionCount: 20,
    updatedLabel: 'há 1 semana'
  },
  {
    id: 'p4',
    title: 'Estruturas de Dados — Árvores',
    questionCount: 12,
    updatedLabel: 'há 1 semana'
  },
  {
    id: 'p5',
    title: 'Banco de Dados — SQL',
    questionCount: 18,
    updatedLabel: 'há 2 semanas'
  },
  {
    id: 'p6',
    title: 'Arquitetura de Computadores',
    questionCount: 14,
    updatedLabel: 'há 3 semanas'
  }
]

export const recentResults: SessionResult[] = [
  { id: 'r1', provaTitle: 'Prova de Redes', turma: 'Turma A', studentCount: 24, average: 7.8 },
  { id: 'r2', provaTitle: 'SO — Escalonamento', turma: 'Turma B', studentCount: 19, average: 6.4 },
  { id: 'r3', provaTitle: 'Lógica de Programação', turma: 'Turma C', studentCount: 28, average: 8.9 },
  { id: 'r4', provaTitle: 'Banco de Dados — SQL', turma: 'Turma A', studentCount: 22, average: 7.1 },
  { id: 'r5', provaTitle: 'Estruturas de Dados', turma: 'Turma D', studentCount: 17, average: 8.2 }
]
