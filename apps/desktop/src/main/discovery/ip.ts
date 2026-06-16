import { networkInterfaces } from 'node:os'

// Picks the first IPv4 address on a non-loopback, non-internal interface.
// Falls back to 127.0.0.1 so callers never have to handle null.
export function getLanIp(): string {
  const ifaces = networkInterfaces()
  for (const iface of Object.values(ifaces)) {
    if (!iface) continue
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address
      }
    }
  }
  return '127.0.0.1'
}
