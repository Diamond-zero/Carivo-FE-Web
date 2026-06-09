import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import {
  registerSchema,
  type RegisterFormValues,
} from '../../lib/validations/auth'

export function RegisterPage() {
  const navigate = useNavigate()
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
      mode="register"
      title="Tạo tài khoản mới"
      subtitle="Điền thông tin cá nhân. Tài khoản Staff sẽ được quản trị viên kích hoạt sau khi xác minh."
      footer={
        <p>
          Đã có tài khoản?{' '}
          <Link to="/login" className="carivo-link">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200/60 bg-brand-50/50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
        <p className="text-xs leading-relaxed text-brand-900">
          Đăng ký chỉ tạo hồ sơ ban đầu. Quyền truy cập Staff và gán garage do Admin
          phê duyệt trước khi bạn có thể vận hành hệ thống.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="full_name" required>
            Họ và tên
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="full_name"
              type="text"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={errors.full_name?.message}
              className="pl-10"
              {...register('full_name')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone" required>
              Số điện thoại
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                autoComplete="tel"
                error={errors.phone?.message}
                className="pl-10"
                {...register('phone')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" required>
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                error={errors.email?.message}
                className="pl-10"
                {...register('email')}
              />
            </div>
          </div>
        </div>

        <PasswordField
          id="password"
          label="Mật khẩu"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password}
        />

        <PasswordField
          id="confirm_password"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          registration={register('confirm_password')}
          error={errors.confirm_password}
        />

        {submitError ? <AuthAlert variant="error">{submitError}</AuthAlert> : null}

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <span className="font-medium text-slate-700">điều khoản sử dụng</span> và{' '}
          <span className="font-medium text-slate-700">chính sách bảo mật</span> của
          Carivo.
        </p>

        <Button type="submit" fullWidth disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
