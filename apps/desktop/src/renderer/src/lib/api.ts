import { DiscoveryStatus } from '@offlineclass/shared'

export const api = {
  discovery: {
    getStatus: async (): Promise<DiscoveryStatus> => {
      const raw = await window.api.discovery.getStatus()
      return DiscoveryStatus.parse(raw)
    }
  }
}
