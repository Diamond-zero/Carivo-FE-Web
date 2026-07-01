import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  registerApi,
  requestPhoneVerificationApi,
  verifyPhoneOtpApi,
} from '../../../api/auth.api'
import {
  adminUpdateUserApi,
  getAdminUsersApi,
} from '../../../api/user.api'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import type {
  AdminCreateUserValues,
  AdminPromoteUserValues,
} from '../../../lib/validations/adminUser'
import type { User } from '../../../types/user'
import { adminQueryKeys } from './queryKeys'

interface CreateUserResult {
  user: User
  otpDebug?: string
}

async function findUserByPhone(phone: string) {
  const { users } = await getAdminUsersApi({ search: phone, limit: 5 })
  return users.find((u) => u.phone === phone)
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: AdminCreateUserValues): Promise<CreateUserResult> => {
      const challenge = await requestPhoneVerificationApi({
        phone: values.phone,
        purpose: 'REGISTER',
      })

      const otp = challenge.debug_otp
      if (!otp) {
        throw new Error(
          'BE không trả OTP debug. Hãy dùng tab "Nâng cấp user có sẵn" hoặc cấu hình mock OTP provider cho môi trường dev.',
        )
      }

      const verification = await verifyPhoneOtpApi({
        challenge_id: challenge.challenge_id,
        otp,
      })

      const existing = await findUserByPhone(values.phone)
      if (existing) {
        throw new Error('Số điện thoại đã tồn tại trên hệ thống.')
      }

      await registerApi({
        full_name: values.full_name,
        phone: values.phone,
        email: values.email ?? '',
        password: values.password,
        phone_verification_token: verification.verification_token,
      })

      const created = await findUserByPhone(values.phone)
      if (!created) {
        throw new Error('Tạo tài khoản thất bại: không tìm thấy user vừa tạo.')
      }

      if (values.role !== 'CUSTOMER') {
        const updated = await adminUpdateUserApi(created.id, {
          role: values.role,
          is_active: values.is_active,
        })
        return {
          user: mapApiUser(updated),
          otpDebug: otp,
        }
      }

      return {
        user: mapApiUser(created),
        otpDebug: otp,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
    },
  })
}

export function useAdminPromoteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: AdminPromoteUserValues): Promise<User> => {
      const updated = await adminUpdateUserApi(values.user_id, { role: values.role })
      return mapApiUser(updated)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.user_id),
      })
    },
  })
}