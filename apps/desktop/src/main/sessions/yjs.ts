import { randomUUID } from 'node:crypto'
import * as Y from 'yjs'
import { eq } from 'drizzle-orm'
import {
  groupYjsSnapshots,
  groupMembers,
  answers
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
    for (const [questionId, value] of answersMap.entries()) {
      for (const member of members) {
        db.insert(answers)
          .values({
            id: randomUUID(),
            studentId: member.studentId,
            questionId,
            value,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [answers.studentId, answers.questionId],
            set: { value, updatedAt: now }
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
