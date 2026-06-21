import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { QuickAdminLogin } from '../../components/auth/QuickAdminLogin'
import { QuickStaffLogin } from '../../components/auth/QuickStaffLogin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { BE_STAFF_QUICK_LOGIN } from '../../constants/quickLogin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { MockLoginError, useAuth } from '../../contexts/AuthContext'
import { getApiErrorMessage, getApiRetryAfterSeconds } from '../../api/client'
import { loginSchema, type LoginFormValues } from '../../lib/validations/auth'

const MIN_LOGIN_INTERVAL_MS = 2_000

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { login: adminLogin } = useAdminAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedQuickPhone, setSelectedQuickPhone] = useState<string>()
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const lastLoginAttemptAt = useRef(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  const currentPhone = watch('phone')

  const handleQuickSelect = (phone: string, password: string) => {
    setSubmitError(null)
    setSelectedQuickPhone(phone)
    setValue('phone', phone, { shouldValidate: true, shouldDirty: true })
    setValue('password', password, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError(null)

    if (cooldownSeconds > 0) {
      setSubmitError(
        `Vui lòng đợi ${cooldownSeconds} giây trước khi đăng nhập lại.`,
      )
      return
    }

    const now = Date.now()
    if (now - lastLoginAttemptAt.current < MIN_LOGIN_INTERVAL_MS) {
      setSubmitError('Vui lòng đợi vài giây trước khi thử đăng nhập lại.')
      return
    }

    lastLoginAttemptAt.current = now
    const normalizedPhone = normalizePhone(data.phone)
    const isStaffBeAccount =
      normalizedPhone === normalizePhone(BE_STAFF_QUICK_LOGIN.phone)

    try {
      if (!isStaffBeAccount) {
        try {
          await adminLogin(data.phone, data.password)
          navigate('/admin/dashboard')
          return
        } catch (adminError: unknown) {
          if (adminError instanceof MockLoginError) {
            const tryStaffLogin =
              adminError.code === 'NOT_ADMIN_ROLE' ||
              adminError.code === 'INVALID_CREDENTIALS'

            if (!tryStaffLogin) {
              throw adminError
            }
          }
        }
      }

      await login(data.phone, data.password)
      navigate('/dashboard')
    } catch (error: unknown) {
      if (error instanceof MockLoginError) {
        if (error.code === 'TOO_MANY_REQUESTS') {
          const retryAfter = getApiRetryAfterSeconds(error) ?? 120
          setCooldownSeconds(retryAfter)
        }

        setSubmitError(error.message)
        return
      }

      const retryAfter = getApiRetryAfterSeconds(error)
      if (retryAfter) {
        setCooldownSeconds(retryAfter)
      }

      setSubmitError(
        getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'),
      )
    }
  }

  return (
    <AuthLayout
      mode="login"
      title="Chào mừng trở lại"
      subtitle="Đăng nhập bằng số điện thoại. Tài khoản Staff vào cổng vận hành garage, tài khoản Admin vào cổng quản trị."
      footer={
        <p>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="carivo-link">
            Đăng ký ngay
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="phone" required>
            Số điện thoại
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="0900000002"
              autoComplete="tel"
              error={errors.phone?.message}
              className="pl-10"
              {...register('phone')}
            />
          </div>
        </div>

        <PasswordField
          id="password"
          label="Mật khẩu"
          placeholder="123456"
          autoComplete="current-password"
          registration={register('password')}
          error={errors.password}
        />

        {submitError ? <AuthAlert variant="error">{submitError}</AuthAlert> : null}

        {cooldownSeconds > 0 ? (
          <AuthAlert variant="error">
            Máy chủ tạm chặn đăng nhập. Thử lại sau {cooldownSeconds} giây.
          </AuthAlert>
        ) : null}

        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting || cooldownSeconds > 0}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <QuickStaffLogin
        onSelect={handleQuickSelect}
        selectedPhone={selectedQuickPhone ?? currentPhone}
      />

      <QuickAdminLogin
        onSelect={handleQuickSelect}
        selectedPhone={selectedQuickPhone ?? currentPhone}
      />
    </AuthLayout>
  )
}
