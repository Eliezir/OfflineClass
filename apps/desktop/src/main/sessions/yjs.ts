import { randomUUID } from 'node:crypto'
import * as Y from 'yjs'
import { eq, inArray } from 'drizzle-orm'
import {
  groupYjsSnapshots,
  groupMembers,
  answers,
  questions
} from '../db/schema'
import type { Db } from '../db/client'

export function syncAnswersFromYdoc(db: Db, groupId: string, doc: Y.Doc): void {
  try {
    const members = db
      .select({ studentId: groupMembers.studentId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .all()
    if (members.length === 0) return

    const now = new Date()

    // Sync all answers (MCQ, essay, code, etc.) from Y.Map('answers')
    const answersMap = doc.getMap<string>('answers')
    for (const [questionId, rawValue] of answersMap.entries()) {
      let value = rawValue
      let updatedBy: string | null = null
      let updatedAt = now

      if (rawValue.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawValue)
          value = parsed.value ?? ''
          updatedBy = parsed.updatedBy ?? null
          if (parsed.updatedAt) {
            updatedAt = new Date(parsed.updatedAt)
          }
        } catch {
          // fallback
        }
      }

      for (const member of members) {
        db.insert(answers)
          .values({
            id: randomUUID(),
            studentId: member.studentId,
            questionId,
            value,
            updatedBy,
            updatedAt
          })
          .onConflictDoUpdate({
            target: [answers.studentId, answers.questionId],
            set: { value, updatedBy, updatedAt }
          })
          .run()
      }
    }
  } catch (err) {
    console.error(`Failed to sync answers from Y.Doc for group ${groupId}:`, err)
  }
}

class YjsManager {
  private docs = new Map<string, Y.Doc>()
  private debouncers = new Map<string, NodeJS.Timeout>()

  getOrCreateDoc(db: Db, groupId: string): Y.Doc {
    let doc = this.docs.get(groupId)
    if (!doc) {
      const newDoc = new Y.Doc()
      doc = newDoc
      this.docs.set(groupId, doc)

      // 1. Try to load existing snapshot from database
      try {
        const row = db
          .select({ snapshot: groupYjsSnapshots.snapshot })
          .from(groupYjsSnapshots)
          .where(eq(groupYjsSnapshots.groupId, groupId))
          .get()
        if (row && row.snapshot) {
          Y.applyUpdate(newDoc, new Uint8Array(row.snapshot as Buffer))
          console.log(`[YjsManager] Loaded Yjs snapshot for group=${groupId}`)
        } else {
          // If no snapshot exists, populate Yjs Doc from existing answers in the database
          const members = db
            .select({ studentId: groupMembers.studentId })
            .from(groupMembers)
            .where(eq(groupMembers.groupId, groupId))
            .all()
          if (members.length > 0) {
            const studentIds = members.map((m) => m.studentId)
            const dbAnswers = db
              .select({
                questionId: answers.questionId,
                value: answers.value,
                kind: questions.kind
              })
              .from(answers)
              .innerJoin(questions, eq(questions.id, answers.questionId))
              .where(inArray(answers.studentId, studentIds))
              .all()

            console.log(`[YjsManager] No snapshot found for group=${groupId}. Seeding Y.Doc from ${dbAnswers.length} DB answers.`)

            newDoc.transact(() => {
              const answersMap = newDoc.getMap<string>('answers')
              for (const ans of dbAnswers) {
                if (ans.kind === 'essay' || ans.kind === 'code') {
                  const xmlFragment = newDoc.getXmlFragment(ans.questionId)
                  if (xmlFragment.length === 0) {
                    const yXmlText = new Y.XmlText()
                    yXmlText.insert(0, ans.value)
                    xmlFragment.insert(0, [yXmlText])
                  }
                } else {
                  answersMap.set(ans.questionId, ans.value)
                }
              }
            })
          }
        }
      } catch (err) {
        console.error(`Failed to load Yjs snapshot for group ${groupId}:`, err)
      }

      // 2. Set up automated debounced snapshot saving on updates
      newDoc.on('update', () => {
        this.scheduleSave(db, groupId, newDoc)
      })
    }
    return doc
  }

  private scheduleSave(db: Db, groupId: string, doc: Y.Doc): void {
    const existing = this.debouncers.get(groupId)
    if (existing) {
      clearTimeout(existing)
    }

    const timer = setTimeout(() => {
      this.debouncers.delete(groupId)
      this.saveSnapshot(db, groupId, doc)
    }, 2000) // Debounce for 2 seconds

    this.debouncers.set(groupId, timer)
  }

  private saveSnapshot(db: Db, groupId: string, doc: Y.Doc): void {
    try {
      const state = Y.encodeStateAsUpdate(doc)
      const now = new Date()
      db.insert(groupYjsSnapshots)
        .values({
          groupId,
          snapshot: Buffer.from(state),
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: groupYjsSnapshots.groupId,
          set: {
            snapshot: Buffer.from(state),
            updatedAt: now
          }
        })
        .run()

      // Synchronize group answers to SQLite answers table
      syncAnswersFromYdoc(db, groupId, doc)
    } catch (err) {
      console.error(`Failed to save Yjs snapshot for group ${groupId}:`, err)
    }
  }

  flushPendingSave(db: Db, groupId: string): void {
    const timer = this.debouncers.get(groupId)
    if (timer) {
      clearTimeout(timer)
      this.debouncers.delete(groupId)
    }
    const doc = this.docs.get(groupId)
    if (doc) {
      this.saveSnapshot(db, groupId, doc)
    }
  }

  flushAll(db: Db): void {
    for (const groupId of this.docs.keys()) {
      this.flushPendingSave(db, groupId)
    }
  }

  destroyDoc(db: Db, groupId: string): void {
    this.flushPendingSave(db, groupId)
    const doc = this.docs.get(groupId)
    if (doc) {
      doc.destroy()
      this.docs.delete(groupId)
    }
  }

  destroyAll(db: Db): void {
    this.flushAll(db)
    for (const doc of this.docs.values()) {
      doc.destroy()
    }
    this.docs.clear()
  }
}

export const yjsManager = new YjsManager()
