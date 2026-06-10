import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAdminSession,
  clearStaffSession,
  mockAuthLogin,
  persistAdminSession,
  readStoredAdminSession,
  type AdminAuthSession,
} from '../lib/auth/mockAuthLogin'
import { MockLoginError } from '../lib/auth/mockStaffLogin'

interface AdminAuthContextValue {
  session: AdminAuthSession | null
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<AdminAuthSession>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminAuthSession | null>(() =>
    readStoredAdminSession(),
  )

  const login = useCallback(async (phone: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const result = mockAuthLogin(phone, password)
    if (result.type !== 'admin') {
      throw new MockLoginError(
        result.type === 'staff' ? 'NOT_ADMIN_ROLE' : 'NOT_STAFF_ROLE',
      )
    }

    clearStaffSession()
    persistAdminSession(result.session)
    setSession(result.session)
    return result.session
  }, [])

  const logout = useCallback(() => {
    clearAdminSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, login, logout],
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
