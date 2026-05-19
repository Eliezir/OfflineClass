import { z } from 'zod'

export const DiscoveryStatus = z.object({
  lanIp: z.string(),
  port: z.number().int().positive(),
  mdnsName: z.string(),
  qrDataUrl: z.string()
})
export type DiscoveryStatus = z.infer<typeof DiscoveryStatus>
