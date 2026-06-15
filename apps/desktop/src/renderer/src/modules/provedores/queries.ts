import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import { criarProvedor, listarProvedores, listarTiposProvedor } from './api'
import type { CriaProvedorInput, Provedor, TipoProvedor } from './schemas'

export const provedorKeys = {
  all: ['provedores'] as const,
  list: () => [...provedorKeys.all, 'list'] as const,
  tipos: () => [...provedorKeys.all, 'tipos'] as const
}

export function useProvedoresQuery(): UseQueryResult<Provedor[], Error> {
  return useQuery({
    queryKey: provedorKeys.list(),
    queryFn: listarProvedores
  })
}

export function useCriarProvedorMutation(): UseMutationResult<Provedor, Error, CriaProvedorInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: criarProvedor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: provedorKeys.list() })
    }
  })
}

export function useTiposProvedorQuery(): UseQueryResult<TipoProvedor[], Error> {
  return useQuery({
    queryKey: provedorKeys.tipos(),
    queryFn: listarTiposProvedor
  })
}
