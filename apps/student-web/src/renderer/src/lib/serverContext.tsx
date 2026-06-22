import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ServerContextValue {
  teacherUrl: string | null
  setTeacherUrl: (url: string) => void
}

const ServerContext = createContext<ServerContextValue | null>(null)

export function ServerProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [teacherUrl, setTeacherUrlState] = useState<string | null>(null)

  const setTeacherUrl = useCallback((url: string) => {
    // Normalize: strip trailing slash
    const normalized = url.replace(/\/+$/, '')
    setTeacherUrlState(normalized)
    // Also persist in main process so it survives window reload.
    window.api?.server?.setUrl?.(normalized)
  }, [])

  return (
    <ServerContext.Provider value={{ teacherUrl, setTeacherUrl }}>
      {children}
    </ServerContext.Provider>
  )
}

export function useServerUrl(): ServerContextValue {
  const ctx = useContext(ServerContext)
  if (!ctx) throw new Error('useServerUrl must be used inside ServerProvider')
  return ctx
}
