import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { Exam, ExamInput, ExamSummary, ExamUpdate } from '@offlineclass/shared'
import { createExam, deleteExam, listExams, updateExam } from './api'

export const examKeys = {
  all: ['exams'] as const,
  list: () => [...examKeys.all, 'list'] as const
}

export function useExamsQuery(): UseQueryResult<ExamSummary[], Error> {
  return useQuery({ queryKey: examKeys.list(), queryFn: listExams })
}

function useInvalidateExams(): () => void {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: examKeys.all })
}

export function useCreateExam(): UseMutationResult<Exam, Error, ExamInput> {
  const invalidate = useInvalidateExams()
  return useMutation({ mutationFn: createExam, onSuccess: invalidate })
}

export function useUpdateExam(): UseMutationResult<Exam, Error, { id: string; patch: ExamUpdate }> {
  const invalidate = useInvalidateExams()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ExamUpdate }) => updateExam(id, patch),
    onSuccess: invalidate
  })
}

export function useDeleteExam(): UseMutationResult<null, Error, string> {
  const invalidate = useInvalidateExams()
  return useMutation({ mutationFn: deleteExam, onSuccess: invalidate })
}
