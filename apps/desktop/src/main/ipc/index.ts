import { registerAppHandlers } from './handlers/app'
import { registerWindowHandlers } from './handlers/window'
import { registerProviderHandlers } from './handlers/provider'

export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerWindowHandlers()
  registerProviderHandlers()
}
