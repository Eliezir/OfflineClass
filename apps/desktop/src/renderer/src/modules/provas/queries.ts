import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type {
  Exam,
  ExamInput,
  ExamSummary,
  ExamUpdate,
  Question,
  QuestionInput
} from '@offlineclass/shared'
import {
  addQuestion,
  createExam,
  deleteExam,
  deleteQuestion,
  duplicateExam,
  getExam,
  listExams,
  reorderQuestions,
  updateExam,
  updateQuestion
} from './api'

export const examKeys = {
  all: ['exams'] as const,
  list: () => [...examKeys.all, 'list'] as const,
  detail: (id: string) => [...examKeys.all, 'detail', id] as const
}

export function useExamsQuery(): UseQueryResult<ExamSummary[], Error> {
  return useQuery({ queryKey: examKeys.list(), queryFn: listExams })
}

export function useExamQuery(id: string): UseQueryResult<Exam, Error> {
  return useQuery({ queryKey: examKeys.detail(id), queryFn: () => getExam(id) })
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

export function useDuplicateExam(): UseMutationResult<Exam, Error, string> {
  const invalidate = useInvalidateExams()
  return useMutation({ mutationFn: duplicateExam, onSuccess: invalidate })
}

/* Question mutations — all refresh the parent exam's detail (and the list count). */

function useInvalidateExam(examId: string): () => void {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: examKeys.detail(examId) })
    void qc.invalidateQueries({ queryKey: examKeys.list() })
  }
}

export function useAddQuestion(examId: string): UseMutationResult<Question, Error, QuestionInput> {
  const invalidate = useInvalidateExam(examId)
  return useMutation({
    mutationFn: (input: QuestionInput) => addQuestion(examId, input),
    onSuccess: invalidate
  })
}

export function useUpdateQuestion(
  examId: string
): UseMutationResult<Question, Error, { id: string; input: QuestionInput }> {
  const invalidate = useInvalidateExam(examId)
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuestionInput }) => updateQuestion(id, input),
    onSuccess: invalidate
  })
}

export function useDeleteQuestion(examId: string): UseMutationResult<null, Error, string> {
  const invalidate = useInvalidateExam(examId)
  return useMutation({ mutationFn: deleteQuestion, onSuccess: invalidate })
}

export function useReorderQuestions(
  examId: string
): UseMutationResult<Question[], Error, string[], { prev?: Exam }> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderQuestions(examId, orderedIds),
    // Optimistically reorder the cached exam so the drag result sticks immediately
    // (no snap-back to the old order while the write round-trips).
    onMutate: async (orderedIds: string[]) => {
      await qc.cancelQueries({ queryKey: examKeys.detail(examId) })
      const prev = qc.getQueryData<Exam>(examKeys.detail(examId))
      if (prev) {
        const byId = new Map(prev.questions.map((q) => [q.id, q]))
        const questions = orderedIds
          .map((id, i) => {
            const q = byId.get(id)
            return q ? { ...q, position: i } : null
          })
          .filter((q): q is NonNullable<typeof q> => q !== null)
        qc.setQueryData<Exam>(examKeys.detail(examId), { ...prev, questions })
      }
      return { prev }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(examKeys.detail(examId), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: examKeys.detail(examId) })
      void qc.invalidateQueries({ queryKey: examKeys.list() })
    }
  })
}
