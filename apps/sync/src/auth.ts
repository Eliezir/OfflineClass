import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const jwtSecretStr = process.env['PS_JWT_SECRET']
if (!jwtSecretStr) throw new Error('PS_JWT_SECRET env var is required')

/** HS256 secret shared with the PowerSync Service (client_auth.supabase_jwt_secret). */
const JWT_SECRET = new TextEncoder().encode(jwtSecretStr)

/** URL of the PowerSync Service — used as JWT audience. */
export const PS_SERVICE_URL = process.env['PS_SERVICE_URL'] ?? 'http://localhost:8080'

/** Token lifetime in seconds. */
const TOKEN_TTL_S = 3600 // 1 hour

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Issue a PowerSync-compatible JWT.
 * - `sub` = `localTeacherId` = `owner_id` in all syncable Postgres tables
 * - `aud` = PS_SERVICE_URL (PowerSync Service validates this)
 * - Signed with HS256 using the shared PS_JWT_SECRET
 */
export async function issueToken(
  localTeacherId: string
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_S

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(localTeacherId)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience(PS_SERVICE_URL)
    .sign(JWT_SECRET)

  return { token, expiresAt: exp * 1000 }
}

/**
 * Verify a JWT and return the local teacher ID it was issued for.
 * Throws if the token is invalid, expired, or has the wrong audience.
 */
export async function verifyToken(token: string): Promise<{ localTeacherId: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    audience: PS_SERVICE_URL
  })
  if (!payload.sub) throw new Error('Invalid token: missing sub claim')
  return { localTeacherId: payload.sub }
}
