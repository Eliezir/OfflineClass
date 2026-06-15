/**
 * Resolve a path inside /public against the Vite base URL so it works both in
 * dev ('/') and on GitHub Pages ('/apresenta.ai/'), on every route.
 * Pass paths without a leading slash, e.g. asset('assets/logo.png').
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL // always ends with '/'
  return base + path.replace(/^\//, '')
}
