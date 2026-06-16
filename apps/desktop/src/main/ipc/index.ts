import { registerAppHandlers } from './handlers/app'
import { registerWindowHandlers } from './handlers/window'
import { registerAuthHandlers, type AuthContext } from './auth'
import { registerDiscoveryHandlers, type DiscoveryContext } from './discovery'
import { registerExamsHandlers, type ExamsContext } from './exams'
import { registerQuestionsHandlers, type QuestionsContext } from './questions'
import { registerSessionsHandlers, type SessionsContext } from './sessions'

export interface IpcContext {
  auth: AuthContext
  discovery: DiscoveryContext
  exams: ExamsContext
  questions: QuestionsContext
  sessions: SessionsContext
}

export function registerIpcHandlers(ctx: IpcContext): void {
  // Window-chrome + app meta (renderer's typed window.api.invoke bridge).
  registerAppHandlers()
  registerWindowHandlers()
  // Teacher domain (string-channel bridge: window.api.auth/exams/…).
  registerAuthHandlers(ctx.auth)
  registerDiscoveryHandlers(ctx.discovery)
  registerExamsHandlers(ctx.exams)
  registerQuestionsHandlers(ctx.questions)
  registerSessionsHandlers(ctx.sessions)
}
