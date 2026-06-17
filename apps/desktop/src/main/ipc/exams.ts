import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { and, asc, eq, sql } from 'drizzle-orm'
import { Exam, ExamInput, ExamSummary, ExamUpdate } from '@offlineclass/shared'

import { requireTeacherId } from './auth'
import type { Db } from '../db/client'
import { exams, questions } from '../db/schema'
import { questionColumns, rowToQuestion } from '../db/questions-map'

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
    subject: exam.subject,
    gradeLevel: exam.gradeLevel,
    icon: exam.icon,
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
        subject: exams.subject,
        gradeLevel: exams.gradeLevel,
        icon: exams.icon,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt
      })
      .from(exams)
      .where(eq(exams.ownerId, ownerId))
      .orderBy(sql`${exams.updatedAt} DESC`)
      .all()

    // Counts via a grouped query + map. (A correlated subquery built from sql`...`
    // loses table qualifiers and silently returns 0 — see git history.)
    const counts = db
      .select({ examId: questions.examId, n: sql<number>`count(*)` })
      .from(questions)
      .groupBy(questions.examId)
      .all()
    const countByExam = new Map(counts.map((c) => [c.examId, Number(c.n)]))

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      subject: r.subject,
      gradeLevel: r.gradeLevel,
      icon: r.icon,
      questionsCount: countByExam.get(r.id) ?? 0,
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
        description: input.description ?? null,
        subject: input.subject ?? null,
        gradeLevel: input.gradeLevel ?? null,
        icon: input.icon ?? null
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
        subject: patch.subject !== undefined ? patch.subject : existing.subject,
        gradeLevel: patch.gradeLevel !== undefined ? patch.gradeLevel : existing.gradeLevel,
        icon: patch.icon !== undefined ? patch.icon : existing.icon,
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
          description: source.description,
          subject: source.subject,
          gradeLevel: source.gradeLevel,
          icon: source.icon
        })
        .run()
      for (const q of source.questions) {
        tx.insert(questions)
          .values({ id: randomUUID(), examId: newId, position: q.position, ...questionColumns(q) })
          .run()
      }
    })
    return loadExam(db, newId, ownerId)
  })
}
