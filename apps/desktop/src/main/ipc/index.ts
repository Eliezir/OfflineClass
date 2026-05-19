import { registerAuthHandlers, type AuthContext } from './auth'
import { registerDiscoveryHandlers, type DiscoveryContext } from './discovery'

export interface IpcContext {
  auth: AuthContext
  discovery: DiscoveryContext
}

export function registerIpcHandlers(ctx: IpcContext): void {
  registerAuthHandlers(ctx.auth)
  registerDiscoveryHandlers(ctx.discovery)
}
