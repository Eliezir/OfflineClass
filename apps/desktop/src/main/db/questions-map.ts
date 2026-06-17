import type { CodeLanguage, McqOption, Question, QuestionInput } from '@offlineclass/shared'
import type { questions } from './schema'

type QuestionRow = typeof questions.$inferSelect

function parseOptions(json: string | null): McqOption[] {
  return json ? (JSON.parse(json) as McqOption[]) : []
}

/** Map a DB row to the shared `Question` shape (teacher-facing, with answers). */
export function rowToQuestion(row: QuestionRow): Question {
  const base = {
    id: row.id,
    position: row.position,
    prompt: row.prompt,
    points: row.points,
    image: row.image ?? null
  }
  switch (row.kind) {
    case 'multi':
      return { kind: 'multi', ...base, options: parseOptions(row.optionsJson) }
    case 'truefalse':
      return { kind: 'truefalse', ...base, answer: row.answerBool ?? false }
    case 'code':
      return {
        kind: 'code',
        ...base,
        language: (row.language ?? 'plaintext') as CodeLanguage,
        starterCode: row.starterCode ?? ''
      }
    case 'essay':
      return { kind: 'essay', ...base }
    case 'mcq':
    default:
      return { kind: 'mcq', ...base, options: parseOptions(row.optionsJson) }
  }
}

/** The kind-specific columns to write when inserting/updating a question. */
export function questionColumns(
  input: QuestionInput
): Pick<
  typeof questions.$inferInsert,
  'kind' | 'prompt' | 'points' | 'image' | 'optionsJson' | 'answerBool' | 'language' | 'starterCode'
> {
  const hasOptions = input.kind === 'mcq' || input.kind === 'multi'
  return {
    kind: input.kind,
    prompt: input.prompt,
    points: input.points,
    image: input.image ?? null,
    optionsJson: hasOptions ? JSON.stringify(input.options) : null,
    answerBool: input.kind === 'truefalse' ? input.answer : null,
    language: input.kind === 'code' ? input.language : null,
    starterCode: input.kind === 'code' ? input.starterCode : null
  }
}
