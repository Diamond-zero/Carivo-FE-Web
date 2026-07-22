import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearAdminSession } from '../lib/auth/adminAuthService'
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
  establishSession: (session: StaffAuthSession) => void
  logout: () => Promise<void>
  refreshSession: () => Promise<StaffAuthSession>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Single-flight guard cho việc init session. React 19 StrictMode + Vite dev
// sẽ double-invoke useEffect mount khiến `restoreStaffSession` chạy 2 lần
// liên tiếp, mỗi lần gọi BE. Nếu BE trả 401/403 (token hết hạn hoặc role
// request không hợp lệ), component bị remount liên tục và UI văng.
// Module-scope promise đảm bảo chỉ có 1 lần restore thực sự bay tới BE.
let staffInitPromise: Promise<StaffAuthSession | null> | null = null
function initStaffSession(): Promise<StaffAuthSession | null> {
  if (!staffInitPromise) {
    staffInitPromise = restoreStaffSession().finally(() => {
      staffInitPromise = null
    })
  }
  return staffInitPromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffAuthSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    void initStaffSession().then((restored) => {
      if (cancelled) return
      setSession(restored)
      setIsInitializing(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const establishSession = useCallback((nextSession: StaffAuthSession) => {
    setSession(nextSession)
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
      establishSession,
      logout,
      refreshSession,
    }),
    [session, isInitializing, login, establishSession, logout, refreshSession],
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
