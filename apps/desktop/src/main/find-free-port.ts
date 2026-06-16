import net from 'node:net'

/** True if `port` can be bound on 0.0.0.0 right now. */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.once('error', () => resolve(false))
    tester.once('listening', () => tester.close(() => resolve(true)))
    tester.listen(port, '0.0.0.0')
  })
}

/**
 * First free TCP port at or after `preferred`, scanning up to `maxTries`.
 * The LAN server binds whatever this returns; students always get the actual
 * port from the QR code + mDNS announcement, so a non-default port is fine and
 * we never collide with another running project (or worktree) on the base port.
 */
export async function findFreePort(preferred: number, maxTries = 50): Promise<number> {
  for (let port = preferred; port < preferred + maxTries; port++) {
    if (await isPortFree(port)) return port
  }
  throw new Error(
    `Nenhuma porta livre entre ${preferred} e ${preferred + maxTries - 1}.`
  )
}
