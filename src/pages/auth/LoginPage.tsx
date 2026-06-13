import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Phone } from 'lucide-react'
import { useState } from 'react'
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
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAuth } from '../../contexts/AuthContext'
import { MockLoginError } from '../../lib/auth/mockStaffLogin'
import { loginSchema, type LoginFormValues } from '../../lib/validations/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { login: adminLogin } = useAdminAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedQuickPhone, setSelectedQuickPhone] = useState<string>()

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

    try {
      try {
        await adminLogin(data.phone, data.password)
        navigate('/admin/dashboard')
        return
      } catch (adminError) {
        if (
          adminError instanceof MockLoginError &&
          adminError.code !== 'NOT_ADMIN_ROLE'
        ) {
          throw adminError
        }
      }

      await login(data.phone, data.password)
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof MockLoginError) {
        setSubmitError(error.message)
        return
      }

      setSubmitError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
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
              placeholder="0901000001"
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
          placeholder="Staff@123"
          autoComplete="current-password"
          registration={register('password')}
          error={errors.password}
        />

        {submitError ? <AuthAlert variant="error">{submitError}</AuthAlert> : null}

        <Button type="submit" fullWidth disabled={isSubmitting} size="lg">
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
