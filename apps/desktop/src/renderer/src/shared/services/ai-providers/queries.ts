import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { checkProvider, saveCredential } from './api'
import type {
  CheckProviderInput,
  CheckProviderResult,
  Credential,
  SaveCredentialInput
} from './types'

export function useCheckProvider(): UseMutationResult<
  CheckProviderResult,
  Error,
  CheckProviderInput
> {
  return useMutation({ mutationFn: checkProvider })
}

export function useSaveCredential(): UseMutationResult<Credential, Error, SaveCredentialInput> {
  return useMutation({ mutationFn: saveCredential })
}
