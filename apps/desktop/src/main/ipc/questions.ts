import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { and, asc, eq, sql } from 'drizzle-orm'
import { QuestionInput, type Question } from '@offlineclass/shared'

import { requireTeacherId } from './auth'
import { DomainError } from './exams'
import type { Db } from '../db/client'
import { exams, questions } from '../db/schema'
import { questionColumns, rowToQuestion } from '../db/questions-map'

export interface QuestionsContext {
  db: Db
}

function assertExamOwnership(db: Db, examId: string, ownerId: string): void {
  const exam = db
    .select({ id: exams.id })
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.ownerId, ownerId)))
    .get()
  if (!exam) throw new DomainError('Prova não encontrada', 'NOT_FOUND')
}

function findQuestionWithOwner(
  db: Db,
  questionId: string,
  ownerId: string
): { id: string; examId: string; ownerId: string } {
  const row = db
    .select({
      id: questions.id,
      examId: questions.examId,
      ownerId: exams.ownerId
    })
    .from(questions)
    .innerJoin(exams, eq(questions.examId, exams.id))
    .where(eq(questions.id, questionId))
    .get()
  if (!row || row.ownerId !== ownerId) {
    throw new DomainError('Questão não encontrada', 'NOT_FOUND')
  }
  return row
}

export function registerQuestionsHandlers(ctx: QuestionsContext): void {
  const { db } = ctx

  ipcMain.handle('questions.add', async (_event, rawExamId, rawInput): Promise<Question> => {
    const ownerId = requireTeacherId(db)
    const examId = typeof rawExamId === 'string' ? rawExamId : ''
    const input = QuestionInput.parse(rawInput)
    assertExamOwnership(db, examId, ownerId)

    const nextPosition = db
      .select({ max: sql<number>`COALESCE(MAX(${questions.position}), -1) + 1` })
      .from(questions)
      .where(eq(questions.examId, examId))
      .get()
    const position = Number(nextPosition?.max ?? 0)
    const id = randomUUID()

    db.insert(questions)
      .values({ id, examId, position, ...questionColumns(input) })
      .run()

    db.update(exams).set({ updatedAt: new Date() }).where(eq(exams.id, examId)).run()

    const row = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!row) throw new DomainError('Falha ao criar questão', 'NOT_FOUND')
    return rowToQuestion(row)
  })

  ipcMain.handle('questions.update', async (_event, rawId, rawInput): Promise<Question> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const input = QuestionInput.parse(rawInput)
    const found = findQuestionWithOwner(db, id, ownerId)

    db.update(questions).set(questionColumns(input)).where(eq(questions.id, id)).run()
    db.update(exams).set({ updatedAt: new Date() }).where(eq(exams.id, found.examId)).run()

    const row = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!row) throw new DomainError('Questão não encontrada', 'NOT_FOUND')
    return rowToQuestion(row)
  })

  ipcMain.handle('questions.delete', async (_event, rawId): Promise<null> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const found = findQuestionWithOwner(db, id, ownerId)

    db.transaction((tx) => {
      tx.delete(questions).where(eq(questions.id, id)).run()
      // Compact positions so the remaining questions stay 0..N-1.
      const remaining = tx
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.examId, found.examId))
        .orderBy(asc(questions.position))
        .all()
      for (let i = 0; i < remaining.length; i++) {
        tx.update(questions)
          .set({ position: -1 - i })
          .where(eq(questions.id, remaining[i].id))
          .run()
      }
      for (let i = 0; i < remaining.length; i++) {
        tx.update(questions).set({ position: i }).where(eq(questions.id, remaining[i].id)).run()
      }
      tx.update(exams).set({ updatedAt: new Date() }).where(eq(exams.id, found.examId)).run()
    })
    return null
  })

  ipcMain.handle('questions.reorder', async (_event, rawExamId, rawIds): Promise<Question[]> => {
    const ownerId = requireTeacherId(db)
    const examId = typeof rawExamId === 'string' ? rawExamId : ''
    const orderedIds = Array.isArray(rawIds)
      ? rawIds.filter((i): i is string => typeof i === 'string')
      : []
    assertExamOwnership(db, examId, ownerId)

    const current = db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.examId, examId))
      .all()
    const currentIds = new Set(current.map((r) => r.id))
    if (orderedIds.length !== current.length || !orderedIds.every((id) => currentIds.has(id))) {
      throw new DomainError('Ordem inválida', 'NOT_FOUND')
    }

    db.transaction((tx) => {
      // Two-phase to dodge the (exam_id, position) UNIQUE constraint, which is
      // checked per-statement: first park every row at a temporary negative
      // position (can't collide with the 0..N-1 finals or each other), then
      // assign the final positions.
      for (let i = 0; i < orderedIds.length; i++) {
        tx.update(questions)
          .set({ position: -1 - i })
          .where(eq(questions.id, orderedIds[i]))
          .run()
      }
      for (let i = 0; i < orderedIds.length; i++) {
        tx.update(questions).set({ position: i }).where(eq(questions.id, orderedIds[i])).run()
      }
      tx.update(exams).set({ updatedAt: new Date() }).where(eq(exams.id, examId)).run()
    })

    const rows = db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.position))
      .all()
    return rows.map(rowToQuestion)
  })
}
