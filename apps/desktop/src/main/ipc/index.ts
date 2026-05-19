import { registerDiscoveryHandlers, type DiscoveryContext } from './discovery'

export interface IpcContext {
  discovery: DiscoveryContext
}

export function registerIpcHandlers(ctx: IpcContext): void {
  registerDiscoveryHandlers(ctx.discovery)
}
