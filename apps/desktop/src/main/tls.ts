import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as selfsigned from 'selfsigned'

import { getLanIp } from './discovery/ip'

export interface TlsBundle {
  key: string
  cert: string
}

const CERT_PATH = (): string => join(app.getPath('userData'), 'tls', 'cert.pem')
const KEY_PATH = (): string => join(app.getPath('userData'), 'tls', 'key.pem')
const META_PATH = (): string => join(app.getPath('userData'), 'tls', 'meta.json')

interface CertMeta {
  lanIp: string
  generatedAt: number
}

function tryReadCached(currentLanIp: string): TlsBundle | null {
  if (!existsSync(CERT_PATH()) || !existsSync(KEY_PATH()) || !existsSync(META_PATH())) {
    return null
  }
  try {
    const meta = JSON.parse(readFileSync(META_PATH(), 'utf-8')) as CertMeta
    // Regenerate if the LAN IP at gen-time no longer matches — keeps the SAN
    // honest after the teacher swaps networks. mDNS-only access would still
    // work without this, but most students join by IP from the QR.
    if (meta.lanIp !== currentLanIp) return null
    return {
      cert: readFileSync(CERT_PATH(), 'utf-8'),
      key: readFileSync(KEY_PATH(), 'utf-8')
    }
  } catch {
    return null
  }
}

function persist(bundle: TlsBundle, lanIp: string): void {
  const dir = join(app.getPath('userData'), 'tls')
  mkdirSync(dir, { recursive: true })
  writeFileSync(CERT_PATH(), bundle.cert, 'utf-8')
  writeFileSync(KEY_PATH(), bundle.key, 'utf-8')
  const meta: CertMeta = { lanIp, generatedAt: Date.now() }
  writeFileSync(META_PATH(), JSON.stringify(meta, null, 2), 'utf-8')
}

export async function ensureSelfSignedCert(): Promise<TlsBundle & { lanIp: string }> {
  const lanIp = getLanIp()
  const cached = tryReadCached(lanIp)
  if (cached) return { ...cached, lanIp }

  const notBefore = new Date()
  const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
  const pems = await selfsigned.generate(
    [{ name: 'commonName', value: 'offlineclass.local' }],
    {
      keySize: 2048,
      algorithm: 'sha256',
      notBeforeDate: notBefore,
      notAfterDate: notAfter,
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'offlineclass.local' },
            { type: 2, value: 'localhost' },
            { type: 7, ip: '127.0.0.1' },
            { type: 7, ip: lanIp }
          ]
        },
        { name: 'basicConstraints', cA: false },
        {
          name: 'keyUsage',
          digitalSignature: true,
          keyEncipherment: true
        },
        { name: 'extKeyUsage', serverAuth: true }
      ]
    }
  )
  const bundle: TlsBundle = { key: pems.private, cert: pems.cert }
  persist(bundle, lanIp)
  return { ...bundle, lanIp }
}
