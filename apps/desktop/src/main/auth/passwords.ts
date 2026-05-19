import bcrypt from 'bcryptjs'

// 12 rounds ≈ ~250ms on a modern CPU — high enough that brute force is
// painful, low enough that login feels instant. Pure-JS implementation so
// we don't need to rebuild a native module against Electron's Node.
const ROUNDS = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
