import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function resolveEncryptionKey(): Buffer {
  const rawKey =
    process.env.API_KEY_ENCRYPTION_KEY_BASE64 ?? process.env.API_KEY_ENCRIPTION_KEY_BASE64 ?? ''

  if (!rawKey) {
    throw new Error('Missing API_KEY_ENCRYPTION_KEY_BASE64 environment variable')
  }

  const key = Buffer.from(rawKey, 'base64')

  if (key.length !== 32) {
    throw new Error('API_KEY_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes')
  }

  return key
}

export type EncryptedApiKey = {
  apiKeyEncrypted: string
  apiKeyIv: string
  apiKeyAuthTag: string
}

export function encryptApiKey(apiKey: string): EncryptedApiKey {
  const key = resolveEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    apiKeyEncrypted: encrypted.toString('base64'),
    apiKeyIv: iv.toString('base64'),
    apiKeyAuthTag: authTag.toString('base64')
  }
}

export function decryptApiKey(payload: EncryptedApiKey): string {
  const key = resolveEncryptionKey()
  const iv = Buffer.from(payload.apiKeyIv, 'base64')
  const encrypted = Buffer.from(payload.apiKeyEncrypted, 'base64')
  const authTag = Buffer.from(payload.apiKeyAuthTag, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  return decrypted.toString('utf8')
}
