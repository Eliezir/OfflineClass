import { createContext, useContext, type ReactNode } from 'react'
import { useReleases } from './use-releases'
import { site } from '@/content'

type ReleasesValue = ReturnType<typeof useReleases>

const ReleasesContext = createContext<ReleasesValue | null>(null)

export function ReleasesProvider({ children }: { children: ReactNode }) {
  const value = useReleases(site.repo.owner, site.repo.name)
  return <ReleasesContext.Provider value={value}>{children}</ReleasesContext.Provider>
}

export function useReleasesContext(): ReleasesValue {
  const ctx = useContext(ReleasesContext)
  if (!ctx) throw new Error('useReleasesContext must be used within ReleasesProvider')
  return ctx
}
