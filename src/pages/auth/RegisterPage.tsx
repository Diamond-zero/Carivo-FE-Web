import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  registerApi,
  requestPhoneVerificationApi,
  verifyPhoneOtpApi,
} from '../../api/auth.api'
import { getApiErrorMessage } from '../../api/client'
import { AuthAlert } from '../../components/auth/AuthAlert'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { registerSchema } from '../../lib/validations/auth'

const registerWithOtpSchema = registerSchema.extend({
  otp: z.string().optional(),
})

type RegisterWithOtpFormValues = z.infer<typeof registerWithOtpSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterWithOtpFormValues>({
    resolver: zodResolver(registerWithOtpSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirm_password: '',
      otp: '',
    },
  })

  const handleSendOtp = async () => {
    setSubmitError(null)
    setSuccessMessage(null)

    const isPhoneValid = await trigger('phone')
    if (!isPhoneValid) return

    setIsSendingOtp(true)

    try {
      const challenge = await requestPhoneVerificationApi({
        phone: getValues('phone'),
        purpose: 'REGISTER',
      })

      setChallengeId(challenge.challenge_id)
      setDebugOtp(challenge.debug_otp ?? null)
      setOtpSent(true)
      setSuccessMessage('Mã OTP đã được gửi. Vui lòng kiểm tra tin nhắn hoặc mã demo bên dưới.')
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Không thể gửi mã OTP. Vui lòng thử lại.'))
    } finally {
      setIsSendingOtp(false)
    }
  }

  const onSubmit = async (data: RegisterWithOtpFormValues) => {
    setSubmitError(null)
    setSuccessMessage(null)

    if (!challengeId) {
      setSubmitError('Vui lòng gửi mã OTP trước khi đăng ký.')
      return
    }

    if (!data.otp || data.otp.length < 4) {
      setSubmitError('Vui lòng nhập mã OTP gồm 6 chữ số.')
      return
    }

    try {
      const verification = await verifyPhoneOtpApi({
        challenge_id: challengeId,
        otp: data.otp,
      })

      await registerApi({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        phone_verification_token: verification.verification_token,
      })

      setSuccessMessage(
        'Đăng ký thành công. Tài khoản CUSTOMER đã được tạo — Admin sẽ gán quyền Staff khi phê duyệt.',
      )

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại sau.'))
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="otp" required={otpSent}>
              Mã OTP
            </Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6 chữ số"
              autoComplete="one-time-code"
              error={errors.otp?.message}
              disabled={!otpSent}
              {...register('otp')}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={isSendingOtp}
            onClick={() => void handleSendOtp()}
            className="shrink-0"
          >
            {isSendingOtp ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : otpSent ? (
              'Gửi lại OTP'
            ) : (
              'Gửi mã OTP'
            )}
          </Button>
        </div>

        {debugOtp ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Mã OTP demo (BE dev): <span className="font-mono font-bold">{debugOtp}</span>
          </p>
        ) : null}

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
        {successMessage ? (
          <AuthAlert variant="success">{successMessage}</AuthAlert>
        ) : null}

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <span className="font-medium text-slate-700">điều khoản sử dụng</span> và{' '}
          <span className="font-medium text-slate-700">chính sách bảo mật</span> của
          Carivo.
        </p>

        <Button type="submit" fullWidth disabled={isSubmitting || !otpSent} size="lg">
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
