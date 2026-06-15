import { useEffect, useState } from 'react'

export interface GithubUser {
  login: string
  /** Display name — falls back to the name we already have in site.json. */
  name: string
  avatar_url: string
  bio: string | null
  html_url: string
  location: string | null
  public_repos: number | null
}

interface Member {
  name: string
  github: string
}

/**
 * Enriches the team list with live GitHub data (avatar, bio, location…).
 * Avatars always work via github.com/<login>.png even before the API resolves;
 * the API call upgrades the data when it lands and degrades gracefully on failure.
 */
export function useGithubUsers(members: Member[]): GithubUser[] {
  const [users, setUsers] = useState<GithubUser[]>(() =>
    members.map((m) => ({
      login: m.github,
      name: m.name,
      avatar_url: `https://github.com/${m.github}.png?size=240`,
      bio: null,
      html_url: `https://github.com/${m.github}`,
      location: null,
      public_repos: null,
    })),
  )

  useEffect(() => {
    let cancelled = false
    Promise.all(
      members.map((m) =>
        fetch(`https://api.github.com/users/${m.github}`, {
          headers: { Accept: 'application/vnd.github+json' },
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      setUsers((prev) =>
        prev.map((u, i) => {
          const d = results[i]
          if (!d) return u
          return {
            login: u.login,
            name: d.name || u.name,
            avatar_url: d.avatar_url || u.avatar_url,
            bio: d.bio ?? null,
            html_url: d.html_url || u.html_url,
            location: d.location ?? null,
            public_repos: typeof d.public_repos === 'number' ? d.public_repos : null,
          }
        }),
      )
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return users
}
