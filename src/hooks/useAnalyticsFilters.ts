import { useCallback, useState } from 'react'
import {
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsFilterValues,
} from '../utils/adminAnalyticsFilters'

export function useAnalyticsFilters(initial?: Partial<AnalyticsFilterValues>) {
  const [filters, setFilters] = useState<AnalyticsFilterValues>({
    ...DEFAULT_ANALYTICS_FILTERS,
    ...initial,
  })

  const update = useCallback((next: AnalyticsFilterValues) => {
    setFilters(next)
  }, [])

  const reset = useCallback(() => {
    setFilters({ ...DEFAULT_ANALYTICS_FILTERS, ...initial })
  }, [initial])

  return { filters, setFilters: update, reset }
}
