import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import {
  registerSchema,
  type RegisterFormValues,
} from '../../lib/validations/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (_data: RegisterFormValues) => {
    setSubmitError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      navigate('/login')
    } catch {
      setSubmitError('Đăng ký thất bại. Vui lòng thử lại sau.')
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Đăng ký tài khoản mới. Tài khoản Staff sẽ được quản trị viên kích hoạt sau khi xác minh."
      footer={
        <p className="text-slate-600">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="full_name" required>
            Họ và tên
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
        </div>

        <div>
          <Label htmlFor="phone" required>
            Số điện thoại
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0901234567"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
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
              placeholder="••••••••"
              autoComplete="new-password"
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

        <div>
          <Label htmlFor="confirm_password" required>
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              className="pr-11"
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label={
                showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
              }
            >
              {showConfirmPassword ? (
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

        <p className="text-xs leading-relaxed text-slate-500">
          Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách bảo
          mật của Carivo.
        </p>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : (
            'Đăng ký'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
