import { Bonjour, type Service } from 'bonjour-service'

export interface MdnsHandle {
  name: string
  unpublish: () => Promise<void>
}

const SERVICE_NAME = 'offlineclass'
// `_https._tcp` since the server now terminates TLS. Browsers don't actually
// dispatch on this — they resolve the .local name and let the URL's scheme
// pick the port — but tools like `dns-sd -B` enumerate by type, so picking
// the right one keeps the announce honest.
const SERVICE_TYPE = 'https'

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
