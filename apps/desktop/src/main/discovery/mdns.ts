import { Bonjour, type Service } from 'bonjour-service'

export interface MdnsHandle {
  name: string
  unpublish: () => Promise<void>
}

const SERVICE_NAME = 'offlineclass'
// `_https._tcp` / `_http._tcp` per the scheme the server actually serves.
// Browsers don't dispatch on this — they resolve the .local name and let the
// URL's scheme pick the port — but tools like `dns-sd -B` enumerate by type,
// so matching the real scheme keeps the announce honest.

export async function publishMdns(
  port: number,
  scheme: 'https' | 'http' = 'https'
): Promise<MdnsHandle> {
  const bonjour = new Bonjour()
  // bonjour-service uses `service.host` verbatim as the name on the A record
  // (no `.local` is appended). The system mDNS resolver queries for the FQDN
  // `offlineclass.local.`, so the host string also has to include `.local`.
  const HOSTNAME_FQDN = `${SERVICE_NAME}.local`
  const service: Service = bonjour.publish({
    name: SERVICE_NAME,
    type: scheme,
    port,
    host: HOSTNAME_FQDN,
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
