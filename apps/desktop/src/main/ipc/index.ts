import { registerAppHandlers } from './handlers/app'
import { registerWindowHandlers } from './handlers/window'

export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerWindowHandlers()
}
