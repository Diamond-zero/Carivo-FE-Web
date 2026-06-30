import type { AdminStaffRecord, AdminTierRule } from '../../types/admin'
import type { AuditLog } from '../../types/auditLog'
import type { CustomerLoyalty, LoyaltyPointRecord, LoyaltyTier, TierUpgradeRecord } from '../../types/loyalty'
import type { Promotion } from '../../types/promotion'
import type { ServicePackage, ServiceStepTemplate } from '../../types/servicePackage'
import type { Vehicle } from '../../types/vehicle'
import type { ApiGarage, ApiStaffProfile } from '../../types/api'
import type {
  ApiAuditLog,
  ApiLoyaltyCustomer,
  ApiLoyaltyCustomerDetail,
  ApiPromotion,
  ApiSurvey,
  ApiSurveyResponse,
  ApiTierRule,
  ApiVehicle,
} from '../../types/api/admin'
import type { SurveyResponse } from '../../types/survey'
import type { ApiServicePackage } from '../../types/api/staff'
import type { AdminCustomerSummary } from '../../utils/adminCustomerLookup'
import { mapApiGarage, mapApiStaffProfile, mapApiUser, normalizePhoneForDisplay } from '../auth/mapApiTypes'
import { mapApiServicePackage } from './staffMappers'

export function mapApiPromotion(promotion: ApiPromotion): Promotion {
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    description: promotion.description ?? '',
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    max_discount_amount: promotion.max_discount_amount ?? null,
    min_order_amount: promotion.min_order_amount,
    audience: (promotion.audience as Promotion['audience']) ?? 'ALL',
    phone_required: promotion.phone_required ?? false,
    per_phone_limit: promotion.per_phone_limit ?? null,
    applicable_tiers: (promotion.applicable_tiers ?? []) as Promotion['applicable_tiers'],
    applicable_vehicle_types: (promotion.applicable_vehicle_types ??
      []) as Promotion['applicable_vehicle_types'],
    applicable_service_package_ids: promotion.applicable_service_package_ids ?? [],
    usage_limit: promotion.usage_limit ?? null,
    per_customer_limit: promotion.per_customer_limit ?? null,
    used_count: promotion.used_count ?? 0,
    reserved_count: promotion.reserved_count ?? 0,
    start_at: promotion.start_at,
    end_at: promotion.end_at,
    is_active: promotion.is_active,
    created_by_id: promotion.created_by_id ?? null,
    updated_by_id: promotion.updated_by_id ?? null,
    created_at: promotion.created_at,
    updated_at: promotion.updated_at,
  }
}

export function mapApiTierRule(rule: ApiTierRule): AdminTierRule {
  return {
    id: rule.id,
    tier: rule.tier_name,
    booking_window_days: rule.booking_window_days,
    max_upcoming_bookings: rule.max_upcoming_bookings,
    points_multiplier: rule.point_multiplier,
    priority_level: rule.priority_level,
    min_total_spent: rule.min_total_spent,
    min_total_visits: rule.min_total_visits,
    is_active: rule.is_active,
  }
}

function readSurveyAnswerValue(
  answers: unknown[],
  type: 'RATING' | 'TEXT',
): number | string | null {
  for (const item of answers) {
    if (!item || typeof item !== 'object') continue
    const answer = item as Record<string, unknown>
    const questionType = String(answer.question_type ?? answer.questionType ?? '')
    if (type === 'RATING' && (questionType === 'RATING' || answer.numeric_value != null)) {
      const value = answer.numeric_value ?? answer.numericValue
      return typeof value === 'number' ? value : Number(value) || 0
    }
    if (type === 'TEXT' && (questionType === 'TEXT' || answer.text_value != null)) {
      const value = answer.text_value ?? answer.textValue
      return typeof value === 'string' ? value : String(value ?? '')
    }
  }
  return null
}

export function mapApiSurvey(survey: ApiSurvey): SurveyResponse {
  const extended = survey as ApiSurvey & Record<string, unknown>
  const answers = Array.isArray(extended.answers) ? extended.answers : []
  const customer = extended.customer as { full_name?: string } | undefined
  const garage = survey.garage ?? (extended.garage as { name?: string } | undefined)
  const ratingValue =
    readSurveyAnswerValue(answers, 'RATING') ??
    (typeof extended.rating === 'number' ? extended.rating : Number(extended.rating) || 0)
  const commentValue =
    readSurveyAnswerValue(answers, 'TEXT') ??
    String(extended.comment ?? survey.description ?? '')

  return {
    id: survey.id,
    booking_id: String(extended.booking_id ?? extended.bookingId ?? ''),
    customer_name: customer?.full_name ?? String(extended.customer_name ?? 'Khách hàng'),
    garage_name: garage?.name ?? String(extended.garage_name ?? '—'),
    rating: typeof ratingValue === 'number' ? ratingValue : 0,
    comment: typeof commentValue === 'string' ? commentValue : String(commentValue ?? ''),
    submitted_at: String(
      extended.submitted_at ?? extended.submittedAt ?? survey.created_at ?? new Date().toISOString(),
    ),
  }
}

export function mapApiSurveyResponse(response: ApiSurveyResponse): SurveyResponse {
  const answers = response.answers ?? []
  let rating = 0
  let comment = ''

  for (const answer of answers) {
    if (typeof answer.numeric_value === 'number') {
      rating = answer.numeric_value
    } else if (typeof answer.text_value === 'string' && answer.text_value.trim()) {
      comment = answer.text_value
    }
  }

  const garage = response.survey?.garage
  const customer = response.customer as { full_name?: string } | undefined
  return {
    id: response.id,
    booking_id: response.booking_id ?? '',
    customer_name: customer?.full_name ?? 'Khách hàng',
    garage_name: garage?.name ?? '—',
    rating,
    comment,
    submitted_at: response.submitted_at ?? response.created_at ?? new Date().toISOString(),
  }
}

export function mapApiAuditLog(log: ApiAuditLog): AuditLog {
  return {
    id: log.id,
    actor_id: log.actor_id ?? log.actor?.id ?? '',
    actor_role: log.actor?.role ?? '',
    action: log.action,
    entity: log.resource_type,
    entity_id: log.resource_id,
    old_value: log.before ?? null,
    new_value: log.after ?? null,
    created_at: log.created_at,
  }
}

export function mapApiLoyaltyCustomer(record: ApiLoyaltyCustomer): AdminCustomerSummary {
  const user = record.customer
  return {
    user: user
      ? {
          id: user.id,
          full_name: user.full_name,
          email: user.email ?? null,
          phone: user.phone ? normalizePhoneForDisplay(user.phone) : '',
          role: 'CUSTOMER',
          avatar_url: null,
          is_active: user.is_active,
        }
      : {
          id: record.customer_id,
          full_name: 'Khách hàng',
          email: null,
          phone: '',
          role: 'CUSTOMER',
          avatar_url: null,
          is_active: true,
        },
    loyalty: mapApiCustomerLoyalty(record),
    bookingCount: 0,
    is_active: user?.is_active ?? true,
  }
}

export function mapApiCustomerLoyalty(record: ApiLoyaltyCustomer): CustomerLoyalty {
  return {
    customer_id: record.customer_id,
    current_tier: record.current_tier,
    total_points: record.total_points,
    available_points: record.available_points,
    redeemed_points: record.redeemed_points,
    expired_points: record.expired_points,
    total_spent: record.total_spent,
    total_visits: record.total_visits,
    expiring_points: [],
  }
}

export function mapApiLoyaltyDetail(record: ApiLoyaltyCustomerDetail) {
  const tierHistory: TierUpgradeRecord[] = (record.tier_history ?? []).map((item) => ({
    id: item.id,
    customer_id: record.customer_id,
    from_tier: (item.from_tier as LoyaltyTier | null) ?? null,
    to_tier: item.to_tier as LoyaltyTier,
    upgraded_at: item.created_at,
    reason: item.reason ?? '',
  }))

  const pointHistory: LoyaltyPointRecord[] = (record.point_transactions ?? []).map(
    (item) => ({
      id: item.id,
      customer_id: record.customer_id,
      points: item.points,
      type: item.type as LoyaltyPointRecord['type'],
      description: item.description ?? '',
      related_booking_id: item.booking_id ?? null,
      created_at: item.created_at,
    }),
  )

  return {
    user: record.customer
      ? mapApiUser({
          id: record.customer.id,
          full_name: record.customer.full_name,
          email: record.customer.email ?? '',
          phone: record.customer.phone ?? '',
          phone_verified_at: null,
          role: 'CUSTOMER',
          avatar_url: '',
          is_active: record.customer.is_active,
          last_login_at: null,
          password_changed_at: null,
          created_at: '',
          updated_at: '',
        })
      : null,
    loyalty: mapApiCustomerLoyalty(record),
    tierHistory,
    pointHistory,
  }
}

export function mapApiAdminServicePackage(pkg: ApiServicePackage): ServicePackage {
  const mapped = mapApiServicePackage(pkg)
  const stepsTemplate = (pkg.steps_template ?? []) as ServiceStepTemplate[]
  return {
    ...mapped,
    steps_template: stepsTemplate,
  }
}

export function mapApiVehicle(vehicle: ApiVehicle): Vehicle {
  return {
    id: vehicle.id,
    customer_id: vehicle.customer_id,
    raw_license_plate: vehicle.raw_license_plate,
    normalized_license_plate:
      vehicle.normalized_license_plate ?? vehicle.raw_license_plate,
    vehicle_type: vehicle.vehicle_type,
    engine_type: vehicle.engine_type,
    motorbike_cc_group: vehicle.motorbike_cc_group ?? null,
    car_body_type: vehicle.car_body_type ?? null,
    seat_count: vehicle.seat_count ?? null,
    brand: vehicle.brand ?? null,
    model: vehicle.model ?? null,
    color: vehicle.color ?? null,
    is_default: vehicle.is_default ?? false,
    is_active: vehicle.is_active,
  }
}

export function mapApiStaffRecord(
  profile: ApiStaffProfile,
  garage?: ApiGarage | null,
): AdminStaffRecord | null {
  if (!profile.user) return null

  const garageId = profile.garage_id ?? ''
  return {
    user: mapApiUser(profile.user),
    profile: mapApiStaffProfile(profile),
    garage: garage
      ? mapApiGarage(garage)
      : {
          id: garageId,
          name: 'Chưa phân công garage',
          garage_code: '',
          address: '',
          city: '',
          phone: '',
          opening_time: '07:00',
          closing_time: '18:00',
          slot_interval_minutes: 30,
          is_active: true,
        },
  }
}

export { mapApiGarage }
