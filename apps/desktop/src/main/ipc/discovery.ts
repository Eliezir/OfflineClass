import { ipcMain } from 'electron'
import type { DiscoveryStatus } from '@offlineclass/shared'

import { getLanIp } from '../discovery/ip'
import { makeQrDataUrl } from '../discovery/qr'

export interface DiscoveryContext {
  port: number
  mdnsName: string
}

export function registerDiscoveryHandlers(ctx: DiscoveryContext): void {
  ipcMain.handle('discovery.getStatus', async (): Promise<DiscoveryStatus> => {
    const lanIp = getLanIp()
    const url = `http://${lanIp}:${ctx.port}/`
    const qrDataUrl = await makeQrDataUrl(url)
    return {
      lanIp,
      port: ctx.port,
      mdnsName: ctx.mdnsName,
      qrDataUrl
    }
  })
}
