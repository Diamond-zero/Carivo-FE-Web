import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'

interface PasswordFieldProps {
  id: string
  label: string
  placeholder?: string
  autoComplete?: string
  registration: UseFormRegisterReturn
  error?: FieldError
  required?: boolean
}

export function PasswordField({
  id,
  label,
  placeholder = '••••••••',
  autoComplete,
  registration,
  error,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          error={error?.message}
          className="pr-11"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 top-3 rounded-md text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
