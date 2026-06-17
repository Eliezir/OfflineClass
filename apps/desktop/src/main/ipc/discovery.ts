import { ipcMain } from 'electron'
import type { DiscoveryStatus } from '@offlineclass/shared'

import { getLanIp } from '../discovery/ip'
import { makeQrDataUrl } from '../discovery/qr'

export interface DiscoveryContext {
  port: number
  mdnsName: string
  scheme: 'https' | 'http'
}

export function registerDiscoveryHandlers(ctx: DiscoveryContext): void {
  ipcMain.handle('discovery.getStatus', async (): Promise<DiscoveryStatus> => {
    const lanIp = getLanIp()
    // QR encodes the IP URL (resolves on every device, incl. Android where
    // .local is unreliable). `host` is the mDNS form PC students can type.
    const url = `${ctx.scheme}://${lanIp}:${ctx.port}/`
    const host = `${ctx.mdnsName}:${ctx.port}`
    const qrDataUrl = await makeQrDataUrl(url)
    return {
      lanIp,
      port: ctx.port,
      mdnsName: ctx.mdnsName,
      qrDataUrl,
      url,
      host,
      scheme: ctx.scheme
    }
  })
}
