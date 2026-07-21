import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../contexts/ToastContext'
import {
  CASE_CATEGORY_OPTIONS,
  CASE_PRIORITY_LABELS,
  useCreateWalkInCustomerCaseMutation,
  useRequestWalkInOtpMutation,
  useVerifyWalkInOtpMutation,
} from '../../hooks/api/staff/useStaffCustomerCases'

type Step = 'booking' | 'otp' | 'details'

export function StaffWalkInCaseCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [step, setStep] = useState<Step>('booking')
  const [bookingId, setBookingId] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [phoneHint, setPhoneHint] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [verificationToken, setVerificationToken] = useState<string | null>(null)

  const [category, setCategory] = useState(CASE_CATEGORY_OPTIONS[0].value)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<keyof typeof CASE_PRIORITY_LABELS>('NORMAL')

  const otpMutation = useRequestWalkInOtpMutation()
  const verifyMutation = useVerifyWalkInOtpMutation()
  const createMutation = useCreateWalkInCustomerCaseMutation()

  const handleRequestOtp = async () => {
    if (!bookingId.trim()) {
      showToast('Vui lòng nhập mã booking walk-in.', 'error')
      return
    }
    try {
      const result = await otpMutation.mutateAsync({
        booking_id: bookingId.trim(),
      })
      setChallengeId(result.challenge_id)
      setPhoneHint(result.phone)
      setStep('otp')
      showToast(
        `Đã gửi OTP tới SĐT ${result.phone.slice(0, 4)}***${result.phone.slice(-2)}.`,
        'success',
      )
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể gửi OTP. Kiểm tra lại booking walk-in.'),
        'error',
      )
    }
  }

  const handleVerify = async () => {
    if (!challengeId || !otpCode.trim()) {
      showToast('Vui lòng nhập mã OTP.', 'error')
      return
    }
    try {
      const result = await verifyMutation.mutateAsync({
        challenge_id: challengeId,
        otp: otpCode.trim(),
      })
      setVerificationToken(result.verification_token)
      setStep('details')
      showToast('Xác thực OTP thành công.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'OTP không hợp lệ hoặc đã hết hạn.'), 'error')
    }
  }

  const handleCreate = async () => {
    if (!verificationToken) return
    if (!subject.trim()) {
      showToast('Vui lòng nhập chủ đề hồ sơ.', 'error')
      return
    }
    try {
      const created = await createMutation.mutateAsync({
        verification_token: verificationToken,
        category,
        subject: subject.trim(),
        description: description.trim() || undefined,
        priority,
      })
      showToast('Đã tạo hồ sơ khiếu nại cho khách.', 'success')
      navigate(`/staff/cases/${created.id}`)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tạo hồ sơ.'), 'error')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/staff/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title="Tạo hồ sơ walk-in"
        description="Quy trình 3 bước: nhập mã booking walk-in → xác thực OTP → điền thông tin hồ sơ."
      />

      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <StepDot active={step !== undefined} done={step !== 'booking'}>
          1. Nhập booking
        </StepDot>
        <span>→</span>
        <StepDot active={step === 'otp' || step === 'details'} done={step === 'details'}>
          2. Xác thực OTP
        </StepDot>
        <span>→</span>
        <StepDot active={step === 'details'}>3. Điền hồ sơ</StepDot>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            {step === 'booking' && 'Bước 1 — Nhập mã booking walk-in'}
            {step === 'otp' && 'Bước 2 — Xác thực OTP'}
            {step === 'details' && 'Bước 3 — Điền thông tin hồ sơ'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'booking' ? (
            <>
              <div>
                <Label htmlFor="walkin-booking" required>
                  Mã booking walk-in
                </Label>
                <Input
                  id="walkin-booking"
                  placeholder="VD: booking-abc123"
                  value={bookingId}
                  onChange={(event) => setBookingId(event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  BE sẽ tra cứu SĐT liên hệ trên booking và gửi OTP.
                </p>
              </div>
              <Button onClick={handleRequestOtp} disabled={otpMutation.isPending}>
                {otpMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Gửi OTP
              </Button>
            </>
          ) : null}

          {step === 'otp' ? (
            <>
              {phoneHint ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Đã gửi OTP tới SĐT <strong>{phoneHint}</strong>. Vui lòng nhập mã 6 số
                  khách nhận được.
                </div>
              ) : null}
              <div>
                <Label htmlFor="otp-code" required>
                  Mã OTP
                </Label>
                <Input
                  id="otp-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep('booking')}>
                  Quay lại
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Xác thực
                </Button>
              </div>
            </>
          ) : null}

          {step === 'details' ? (
            <>
              <div>
                <Label htmlFor="case-category" required>
                  Phân loại
                </Label>
                <Select
                  id="case-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {CASE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="case-subject" required>
                  Chủ đề
                </Label>
                <Input
                  id="case-subject"
                  placeholder="VD: Xe còn vết bẩn sau rửa"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="case-priority">Mức độ ưu tiên</Label>
                <Select
                  id="case-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as keyof typeof CASE_PRIORITY_LABELS)
                  }
                >
                  {Object.entries(CASE_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="case-description">Mô tả chi tiết</Label>
                <textarea
                  id="case-description"
                  rows={4}
                  className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                  placeholder="Mô tả chi tiết sự việc…"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep('otp')}>
                  Quay lại
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Tạo hồ sơ
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function StepDot({
  active,
  done,
  children,
}: {
  active: boolean
  done?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-800'
          : 'rounded-full bg-slate-100 px-3 py-1 text-slate-500'
      }
    >
      {done ? '✓ ' : ''}
      {children}
    </span>
  )
}