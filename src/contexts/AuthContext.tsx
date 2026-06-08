import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STAFF_SESSION_STORAGE_KEY } from '../lib/auth/constants'
import {
  mockStaffLogin,
  type StaffAuthSession,
} from '../lib/auth/mockStaffLogin'

interface AuthContextValue {
  session: StaffAuthSession | null
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<StaffAuthSession>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): StaffAuthSession | null {
  const raw = sessionStorage.getItem(STAFF_SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StaffAuthSession
  } catch {
    sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffAuthSession | null>(() =>
    readStoredSession(),
  )

  const login = useCallback(async (phone: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const nextSession = mockStaffLogin(phone, password)
    sessionStorage.setItem(
      STAFF_SESSION_STORAGE_KEY,
      JSON.stringify(nextSession),
    )
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
