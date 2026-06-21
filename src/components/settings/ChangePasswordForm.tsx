import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { changePasswordApi } from '../../api/user.api'
import { getApiErrorMessage } from '../../api/client'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'

const schema = z
  .object({
    current_password: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    new_password: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirm_password: z.string().min(1, 'Xác nhận mật khẩu'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordForm() {
  const [feedback, setFeedback] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setFeedback(null)
    try {
      await changePasswordApi({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      setFeedback('Đổi mật khẩu thành công.')
      reset()
    } catch (error) {
      setFeedback(getApiErrorMessage(error, 'Đổi mật khẩu thất bại.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="current_password" required>
          Mật khẩu hiện tại
        </Label>
        <Input
          id="current_password"
          type="password"
          error={errors.current_password?.message}
          {...register('current_password')}
        />
      </div>
      <div>
        <Label htmlFor="new_password" required>
          Mật khẩu mới
        </Label>
        <Input
          id="new_password"
          type="password"
          error={errors.new_password?.message}
          {...register('new_password')}
        />
      </div>
      <div>
        <Label htmlFor="confirm_password" required>
          Xác nhận mật khẩu
        </Label>
        <Input
          id="confirm_password"
          type="password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
      </div>
      {feedback ? (
        <p
          className={`text-sm ${feedback.includes('thành công') ? 'text-green-700' : 'text-red-600'}`}
        >
          {feedback}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đổi mật khẩu'}
      </Button>
    </form>
  )
}
