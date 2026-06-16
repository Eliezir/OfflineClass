import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { LoginInput, RegisterInput, Teacher } from '@offlineclass/shared'
import { getMe, login, logout, register } from './api'

export const authKeys = {
  me: ['auth', 'me'] as const
}

/** Shared query config for the current teacher. Used by route guards
    (queryClient.fetchQuery) and any component that needs the session. */
export const meQueryOptions = {
  queryKey: authKeys.me,
  queryFn: getMe
}

export function useLogin(): UseMutationResult<Teacher, Error, LoginInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (teacher) => qc.setQueryData(authKeys.me, teacher)
  })
}

export function useRegister(): UseMutationResult<Teacher, Error, RegisterInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (teacher) => qc.setQueryData(authKeys.me, teacher)
  })
}

export function useLogout(): UseMutationResult<null, Error, void> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null)
      void qc.invalidateQueries()
    }
  })
}
