import { useEffect, useMemo, useState } from 'react'
import { buildMockSession } from './mock-data'
import type { SessionDetail } from './types'

/** Shared by the dashboard and the student detail page: a `now` that ticks every
    few seconds (so relative "há X min" labels stay fresh) plus a stable mock
    running session for the DEV preview. Anchored once so mock timestamps don't
    drift while the labels advance. */
export function useSessaoClock(): { now: number; mockSession: SessionDetail } {
  const [anchor] = useState(() => Date.now())
  const [now, setNow] = useState(anchor)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const mockSession = useMemo(
    () => buildMockSession('running', anchor, anchor - 18 * 60_000),
    [anchor]
  )

  return { now, mockSession }
}
