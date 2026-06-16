import { useEffect, useState } from 'react'

export interface Contributor {
  login: string
  name: string
  avatar_url: string
  html_url: string
  contributions: number
}

/** Logins to hide from the contributors grid (CI bots, automation accounts). */
const HIDDEN = new Set(['checkpointer'])

type ApiContributor = {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
  type: string
}

/**
 * Live team grid sourced from the repo's GitHub contributors — anyone who
 * commits (with an email linked to their GitHub account) shows up automatically.
 * Returns [] until it resolves; callers can fall back to a static list.
 * Names aren't in the contributors payload, so we enrich them from each user
 * profile, degrading gracefully to the login (and to no enrichment on rate-limit).
 */
export function useContributors(owner: string, repo: string): Contributor[] {
  const [list, setList] = useState<Contributor[]>([])

  useEffect(() => {
    let cancelled = false

    async function run(): Promise<void> {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
        )
        if (!res.ok) return
        const data = (await res.json()) as ApiContributor[]

        const people = data
          .filter((c) => c.type !== 'Bot' && !c.login.includes('[bot]') && !HIDDEN.has(c.login.toLowerCase()))
          .map((c) => ({
            login: c.login,
            name: c.login,
            avatar_url: c.avatar_url,
            html_url: c.html_url,
            contributions: c.contributions,
          }))

        // Show logins immediately, then enrich with display names.
        if (!cancelled) setList(people)

        const enriched = await Promise.all(
          people.map(async (c) => {
            try {
              const r = await fetch(`https://api.github.com/users/${c.login}`)
              if (r.ok) {
                const u = (await r.json()) as { name?: string }
                return { ...c, name: u.name?.trim() || c.login }
              }
            } catch {
              /* keep login as name */
            }
            return c
          }),
        )
        if (!cancelled) setList(enriched)
      } catch {
        /* leave empty so the caller can fall back to the static team */
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [owner, repo])

  return list
}
