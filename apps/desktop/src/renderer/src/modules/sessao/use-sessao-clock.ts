import { useEffect, useState } from 'react'

/** Shared by the dashboard and the student detail page: a `now` that ticks every
    few seconds so relative "há X min" labels stay fresh. */
export function useSessaoClock(): { now: number } {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  return { now }
}
