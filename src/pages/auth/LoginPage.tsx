import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
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
  const [showPassword, setShowPassword] = useState(false)
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
      title="Đăng nhập Staff"
      subtitle="Chỉ tài khoản có role Staff mới được truy cập cổng vận hành garage."
      footer={
        <p className="text-slate-600">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
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
          <Input
            id="phone"
            type="tel"
            placeholder="0901000001"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Staff@123"
              autoComplete="current-password"
              error={errors.password?.message}
              className="pr-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {submitError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isSubmitting}>
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
