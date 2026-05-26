import { registerAppHandlers } from './handlers/app'

export function registerIpcHandlers(): void {
  registerAppHandlers()
}
