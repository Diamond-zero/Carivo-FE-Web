import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  adminLogin,
  adminLogout,
  restoreAdminSession,
  type AdminAuthSession,
} from '../lib/auth/adminAuthService'
import { MockLoginError } from '../lib/auth/mockStaffLogin'
import { clearStaffSessionStorage } from '../lib/auth/staffAuthService'

interface AdminAuthContextValue {
  session: AdminAuthSession | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (phone: string, password: string) => Promise<AdminAuthSession>
  establishSession: (session: AdminAuthSession) => void
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminAuthSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const restored = await restoreAdminSession()
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

  const establishSession = useCallback((nextSession: AdminAuthSession) => {
    setSession(nextSession)
  }, [])

  const login = useCallback(async (phone: string, password: string) => {
    clearStaffSessionStorage()
    const nextSession = await adminLogin(phone, password)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(async () => {
    await adminLogout()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isInitializing,
      login,
      establishSession,
      logout,
    }),
    [session, isInitializing, login, establishSession, logout],
  )

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export { MockLoginError }
