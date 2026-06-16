const TOKEN_KEY = 'offlineclass:student-token'

export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function loadToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}
