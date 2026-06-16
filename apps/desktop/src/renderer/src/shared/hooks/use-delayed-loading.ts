import { useEffect, useState } from 'react'

export function useDelayedLoading(loading: boolean, delayMs = 200): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(false)
      return
    }
    const timer = setTimeout(() => setShow(true), delayMs)
    return () => clearTimeout(timer)
  }, [loading, delayMs])

  return show
}
