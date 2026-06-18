import type {
  ApiResponse,
  AuthLoginData,
  PhoneVerificationChallenge,
  PhoneVerificationToken,
  RegisterData,
} from '../types/api'
import { apiClient } from './client'

export interface LoginPayload {
  phone: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  phone: string
  email: string
  password: string
  phone_verification_token: string
}

export interface RequestPhoneVerificationPayload {
  phone: string
  purpose: 'REGISTER' | 'CHANGE_PHONE'
}

export interface VerifyPhoneOtpPayload {
  challenge_id: string
  otp: string
}

export async function loginApi(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiResponse<AuthLoginData>>(
    '/auth/login',
    payload,
  )
  return data.data
}

export async function logoutApi() {
  await apiClient.post('/auth/logout')
}

export async function requestPhoneVerificationApi(
  payload: RequestPhoneVerificationPayload,
) {
  const { data } = await apiClient.post<ApiResponse<PhoneVerificationChallenge>>(
    '/auth/phone-verifications/request',
    payload,
  )
  return data.data
}

export async function verifyPhoneOtpApi(payload: VerifyPhoneOtpPayload) {
  const { data } = await apiClient.post<ApiResponse<PhoneVerificationToken>>(
    '/auth/phone-verifications/verify',
    payload,
  )
  return data.data
}

export async function registerApi(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiResponse<RegisterData>>(
    '/auth/register',
    payload,
  )
  return data.data
}
