import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { updateMyProfileApi } from '../../api/user.api'
import { getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'

const schema = z.object({
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function EditProfileForm() {
  const { session, refreshSession } = useAuth()
  const [feedback, setFeedback] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: session?.user.full_name ?? '',
      email: session?.user.email ?? '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setFeedback(null)
    try {
      await updateMyProfileApi({
        full_name: data.full_name.trim(),
        email: data.email.trim() || undefined,
      })
      await refreshSession()
      setFeedback('Cập nhật hồ sơ thành công.')
    } catch (error) {
      setFeedback(getApiErrorMessage(error, 'Cập nhật hồ sơ thất bại.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="full_name" required>
          Họ và tên
        </Label>
        <Input
          id="full_name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
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
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
      </Button>
    </form>
  )
}
