import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import type { Teacher } from '@offlineclass/shared'

import { api } from './api'

interface AuthCtx {
  teacher: Teacher | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  teacher: null,
  isLoading: true,
  refresh: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const qc = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.auth.me,
    staleTime: Infinity,
    retry: false
  })

  return (
    <AuthContext.Provider
      value={{
        teacher: data ?? null,
        isLoading: isPending,
        refresh: async () => {
          await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthCtx {
  return useContext(AuthContext)
}

export function RequireAuth({ children }: { children: ReactNode }): React.JSX.Element | null {
  const { teacher, isLoading } = useAuth()
  if (isLoading) return null
  if (!teacher) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RedirectIfAuthed({ children }: { children: ReactNode }): React.JSX.Element | null {
  const { teacher, isLoading } = useAuth()
  if (isLoading) return null
  if (teacher) return <Navigate to="/" replace />
  return <>{children}</>
}
