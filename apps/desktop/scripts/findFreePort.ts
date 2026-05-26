import { createServer } from 'node:net'

// O check de porta nativo do Vite/electron-vite não cobre o caso onde outro
// processo bindou em uma pilha (IPv4 ou IPv6) e o nosso bind tenta a outra:
// no macOS as pilhas são independentes, então o bind sucede e o Vite acha que
// 5173 está livre, imprime "Local: 5173", mas o navegador resolve localhost
// pra pilha errada e cai no app vizinho.
//
// Esse util pré-resolve a porta antes da config: tenta bindar em IPv4 (
// 127.0.0.1) E em IPv6 (::1). Se qualquer um falhar, considera a porta em
// uso e tenta a próxima. Retorna a primeira porta livre nas duas pilhas.

function isPortFreeOnHost(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.unref()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    try {
      server.listen(port, host)
    } catch {
      resolve(false)
    }
  })
}

export async function findFreePort(startPort: number, maxAttempts = 100): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const v4 = await isPortFreeOnHost(port, '127.0.0.1')
    const v6 = await isPortFreeOnHost(port, '::1')
    if (v4 && v6) return port
  }
  throw new Error(
    `findFreePort: nenhuma porta livre encontrada no intervalo ${startPort}-${startPort + maxAttempts - 1}`
  )
}
