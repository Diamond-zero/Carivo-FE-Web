import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearAdminSession } from '../lib/auth/mockAuthLogin'
import {
  MockLoginError,
  type StaffAuthSession,
} from '../lib/auth/mockStaffLogin'
import {
  restoreStaffSession,
  refreshStaffSession,
  staffLogin,
  staffLogout,
} from '../lib/auth/staffAuthService'

interface AuthContextValue {
  session: StaffAuthSession | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (phone: string, password: string) => Promise<StaffAuthSession>
  logout: () => Promise<void>
  refreshSession: () => Promise<StaffAuthSession>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffAuthSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const restored = await restoreStaffSession()
        if (!cancelled) {
          setSession(restored)
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false)
        }
      }
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    clearAdminSession()
    const nextSession = await staffLogin(phone, password)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    await staffLogout()
    setSession(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const nextSession = await refreshStaffSession()
    setSession(nextSession)
    return nextSession
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isInitializing,
      login,
      logout,
      refreshSession,
    }),
    [session, isInitializing, login, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export { MockLoginError }
