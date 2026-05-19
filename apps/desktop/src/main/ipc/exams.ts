import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { and, asc, eq, sql } from 'drizzle-orm'
import {
  Exam,
  ExamInput,
  ExamSummary,
  ExamUpdate,
  type McqOption,
  type Question
} from '@offlineclass/shared'

import { requireTeacherId } from './auth'
import type { Db } from '../db/client'
import { exams, questions } from '../db/schema'

export interface ExamsContext {
  db: Db
}

export class DomainError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'FORBIDDEN'
  ) {
    super(message)
  }
}

function rowToQuestion(row: typeof questions.$inferSelect): Question {
  if (row.kind === 'mcq') {
    const opts = row.optionsJson ? (JSON.parse(row.optionsJson) as McqOption[]) : []
    return {
      kind: 'mcq',
      id: row.id,
      position: row.position,
      prompt: row.prompt,
      options: opts
    }
  }
  return {
    kind: 'essay',
    id: row.id,
    position: row.position,
    prompt: row.prompt
  }
}

function loadExam(db: Db, examId: string, ownerId: string): Exam {
  const exam = db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.ownerId, ownerId)))
    .get()
  if (!exam) throw new DomainError('Prova não encontrada', 'NOT_FOUND')

  const rows = db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId))
    .orderBy(asc(questions.position))
    .all()

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    questions: rows.map(rowToQuestion),
    createdAt: exam.createdAt.getTime(),
    updatedAt: exam.updatedAt.getTime()
  }
}

export function registerExamsHandlers(ctx: ExamsContext): void {
  const { db } = ctx

  ipcMain.handle('exams.list', async (): Promise<ExamSummary[]> => {
    const ownerId = requireTeacherId(db)
    const rows = db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
        questionsCount: sql<number>`(
          SELECT COUNT(*) FROM ${questions} WHERE ${questions.examId} = ${exams.id}
        )`
      })
      .from(exams)
      .where(eq(exams.ownerId, ownerId))
      .orderBy(sql`${exams.updatedAt} DESC`)
      .all()
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      questionsCount: Number(r.questionsCount),
      createdAt: r.createdAt.getTime(),
      updatedAt: r.updatedAt.getTime()
    }))
  })

  ipcMain.handle('exams.get', async (_event, rawId: unknown): Promise<Exam> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    return loadExam(db, id, ownerId)
  })

  ipcMain.handle('exams.create', async (_event, raw): Promise<Exam> => {
    const ownerId = requireTeacherId(db)
    const input = ExamInput.parse(raw)
    const id = randomUUID()
    db.insert(exams)
      .values({
        id,
        ownerId,
        title: input.title,
        description: input.description ?? null
      })
      .run()
    return loadExam(db, id, ownerId)
  })

  ipcMain.handle('exams.update', async (_event, rawId, rawPatch): Promise<Exam> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const patch = ExamUpdate.parse(rawPatch)

    // Ensure ownership before touching the row.
    const existing = db
      .select()
      .from(exams)
      .where(and(eq(exams.id, id), eq(exams.ownerId, ownerId)))
      .get()
    if (!existing) throw new DomainError('Prova não encontrada', 'NOT_FOUND')

    const updatedAt = new Date()
    db.update(exams)
      .set({
        title: patch.title ?? existing.title,
        description: patch.description !== undefined ? patch.description : existing.description,
        updatedAt
      })
      .where(eq(exams.id, id))
      .run()
    return loadExam(db, id, ownerId)
  })

  ipcMain.handle('exams.delete', async (_event, rawId: unknown): Promise<null> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const result = db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.ownerId, ownerId)))
      .run()
    if (result.changes === 0) throw new DomainError('Prova não encontrada', 'NOT_FOUND')
    return null
  })

  ipcMain.handle('exams.duplicate', async (_event, rawId: unknown): Promise<Exam> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const source = loadExam(db, id, ownerId)
    const newId = randomUUID()
    db.transaction((tx) => {
      tx.insert(exams)
        .values({
          id: newId,
          ownerId,
          title: `${source.title} (cópia)`,
          description: source.description
        })
        .run()
      for (const q of source.questions) {
        tx.insert(questions)
          .values({
            id: randomUUID(),
            examId: newId,
            position: q.position,
            kind: q.kind,
            prompt: q.prompt,
            optionsJson: q.kind === 'mcq' ? JSON.stringify(q.options) : null
          })
          .run()
      }
    })
    return loadExam(db, newId, ownerId)
  })
}
