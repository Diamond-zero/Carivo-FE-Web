import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { staffQueryKeys } from './queryKeys'

export function useStaffSettings() {
  const { session, refreshSession } = useAuth()

  return useQuery({
    queryKey: staffQueryKeys.settings,
    queryFn: refreshSession,
    enabled: Boolean(session),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
}
