import { useEffect, useState } from 'react'

/** Brief skeleton flash on page mount — mimics data fetch in UI-only phase */
export function useInitialPageSkeleton(delayMs = 320) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return isLoading
}
