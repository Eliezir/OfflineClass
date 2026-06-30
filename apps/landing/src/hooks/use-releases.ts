import { useEffect, useState } from 'react'

export interface ReleaseAsset {
  name: string
  size: number
  browser_download_url: string
  download_count: number
}

export interface Release {
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string
  prerelease: boolean
  draft: boolean
  assets: ReleaseAsset[]
}

interface ReleasesState {
  status: 'loading' | 'success' | 'error'
  releases: Release[]
  latest: Release | null
}

export function useReleases(owner: string, repo: string): ReleasesState {
  const [state, setState] = useState<ReleasesState>({
    status: 'loading',
    releases: [],
    latest: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Release[]) => {
        if (cancelled) return
        const releases = data.filter((r) => !r.draft)
        const latest = releases.find((r) => !r.prerelease) ?? releases[0] ?? null
        setState({ status: 'success', releases, latest })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', releases: [], latest: null })
      })
    return () => {
      cancelled = true
    }
  }, [owner, repo])

  return state
}

export function matchAsset(
  assets: ReleaseAsset[],
  patterns: string[],
): ReleaseAsset | undefined {
  const regs = patterns.map((p) => new RegExp(p, 'i'))
  return assets.find((a) => regs.some((r) => r.test(a.name)))
}

/**
 * Find the installer for a specific app on a specific platform. An asset must
 * match BOTH the app's name discriminator (e.g. teacher vs student) AND one of
 * the platform's patterns — the two apps share the same `…-setup.exe` suffix,
 * so platform matching alone can't tell them apart.
 */
// Auto-update metadata / installer sidecars — never a user-facing download.
const NON_INSTALLER = /\.(blockmap|yml|yaml|sha512|sha256)$/i

export function matchAppAsset(
  assets: ReleaseAsset[],
  appPattern: string,
  platformPatterns: string[],
): ReleaseAsset | undefined {
  const appReg = new RegExp(appPattern, 'i')
  const platformRegs = platformPatterns.map((p) => new RegExp(p, 'i'))
  return assets.find(
    (a) =>
      !NON_INSTALLER.test(a.name) &&
      appReg.test(a.name) &&
      platformRegs.some((r) => r.test(a.name)),
  )
}

export function formatBytes(n: number): string {
  if (!n) return ''
  const mb = n / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
