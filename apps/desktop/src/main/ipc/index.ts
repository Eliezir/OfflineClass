import { registerAuthHandlers, type AuthContext } from './auth'
import { registerDiscoveryHandlers, type DiscoveryContext } from './discovery'
import { registerExamsHandlers, type ExamsContext } from './exams'
import { registerQuestionsHandlers, type QuestionsContext } from './questions'

export interface IpcContext {
  auth: AuthContext
  discovery: DiscoveryContext
  exams: ExamsContext
  questions: QuestionsContext
}

export function registerIpcHandlers(ctx: IpcContext): void {
  registerAuthHandlers(ctx.auth)
  registerDiscoveryHandlers(ctx.discovery)
  registerExamsHandlers(ctx.exams)
  registerQuestionsHandlers(ctx.questions)
}
