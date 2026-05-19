import { Bonjour, type Service } from 'bonjour-service'

export interface MdnsHandle {
  name: string
  unpublish: () => Promise<void>
}

const SERVICE_NAME = 'offlineclass'
const SERVICE_TYPE = 'http'

export async function publishMdns(port: number): Promise<MdnsHandle> {
  const bonjour = new Bonjour()
  const service: Service = bonjour.publish({
    name: SERVICE_NAME,
    type: SERVICE_TYPE,
    port,
    txt: { app: 'OfflineClass' }
  })

  return {
    name: `${SERVICE_NAME}.local`,
    unpublish: () =>
      new Promise((resolve) => {
        const done = (): void => {
          bonjour.destroy()
          resolve()
        }
        if (typeof service.stop === 'function') {
          service.stop(done)
        } else {
          done()
        }
      })
  }
}
