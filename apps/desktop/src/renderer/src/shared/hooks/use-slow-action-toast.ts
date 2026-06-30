import { useEffect } from 'react'
import { notify } from '@renderer/shared/services/toast'

/** While `pending` stays true past `delayMs`, surface an info toast with
    `message` (reusing a fixed `id` so it never stacks). The toast is dismissed
    the moment the action settles — the caller's own success/error toast then
    takes over. Use to reassure the user during a slow network call (e.g. a
    flaky SMTP connect) without leaving the UI looking frozen. */
export function useSlowActionToast(
  pending: boolean,
  message: string,
  options?: { id?: string; delayMs?: number }
): void {
  const id = options?.id ?? 'slow-action'
  const delayMs = options?.delayMs ?? 6000

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => notify.info(message, { id }), delayMs)
    return () => {
      clearTimeout(timer)
      notify.dismiss(id)
    }
  }, [pending, message, id, delayMs])
}
