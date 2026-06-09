import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Phone } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { QuickStaffLogin } from '../../components/auth/QuickStaffLogin'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { useAuth } from '../../contexts/AuthContext'
import { MockLoginError } from '../../lib/auth/mockStaffLogin'
import { loginSchema, type LoginFormValues } from '../../lib/validations/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
      subtitle="Đăng nhập bằng số điện thoại Staff để truy cập cổng vận hành garage."
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
    </AuthLayout>
  )
}
