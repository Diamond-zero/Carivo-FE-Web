import type { ServicePackage, ServiceStepTemplate } from '../../types/servicePackage'
import type { VehicleType } from '../../types/washBay'
import { mockAdminServicePackages } from './servicePackages'

function clonePackages(items: ServicePackage[]): ServicePackage[] {
  return items.map((pkg) => ({
    ...pkg,
    included_service_ids: [...pkg.included_service_ids],
    steps_template: pkg.steps_template.map((step) => ({
      ...step,
      instructions: [...step.instructions],
    })),
  }))
}

let packages = clonePackages(mockAdminServicePackages)

export function createDefaultStepsTemplate(slug: string, vehicleLabel: string): ServiceStepTemplate[] {
  return [
    {
      step_code: `${slug}-prewash`,
      step_name: 'Tiền xử lý',
      order: 1,
      step_type: 'AUTOMATED_WASH_STEP',
      is_required: true,
      display_staff_type: 'WASH_OPERATOR',
      instructions: [`Kiểm tra ${vehicleLabel} trước khi đưa vào buồng rửa`],
    },
    {
      step_code: `${slug}-wash`,
      step_name: 'Rửa chính',
      order: 2,
      step_type: 'AUTOMATED_WASH_STEP',
      is_required: true,
      display_staff_type: 'WASH_OPERATOR',
      instructions: ['Chạy chu trình rửa theo gói đã chọn'],
    },
    {
      step_code: `${slug}-dry`,
      step_name: 'Sấy & hoàn tất',
      order: 3,
      step_type: 'MANUAL_SERVICE_STEP',
      is_required: true,
      display_staff_type: 'VEHICLE_CARE_STAFF',
      instructions: ['Lau khô và kiểm tra chất lượng trước bàn giao'],
    },
  ]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getAdminServicePackagesFromStore(): ServicePackage[] {
  return clonePackages(packages)
}

export function getAdminServicePackageById(id: string) {
  const pkg = packages.find((item) => item.id === id)
  return pkg ? clonePackages([pkg])[0] : undefined
}

export function getAdminServicePackageName(id: string) {
  return getAdminServicePackageById(id)?.name ?? id
}

export type AdminServicePackageInput = {
  name: string
  vehicle_type: VehicleType
  service_type: ServicePackage['service_type']
  description: string
  base_price: number
  duration_minutes: number
  wash_bay_duration_minutes: number | null
  points_earned: number
  requires_wash_bay: boolean
  requires_care_staff: boolean
  included_service_ids: string[]
  is_active: boolean
}

export function createAdminServicePackage(input: AdminServicePackageInput) {
  const slug = slugify(input.name) || 'package'
  const vehicleLabel = input.vehicle_type === 'CAR' ? 'ô tô' : 'xe máy'

  const pkg: ServicePackage = {
    id: `pkg-${slug}-${Date.now()}`,
    name: input.name.trim(),
    vehicle_type: input.vehicle_type,
    service_type: input.service_type,
    description: input.description.trim(),
    base_price: input.base_price,
    duration_minutes: input.duration_minutes,
    wash_bay_duration_minutes: input.requires_wash_bay
      ? input.wash_bay_duration_minutes
      : null,
    points_earned: input.points_earned,
    requires_wash_bay: input.requires_wash_bay,
    requires_care_staff: input.requires_care_staff,
    included_service_ids: input.included_service_ids,
    steps_template: createDefaultStepsTemplate(slug, vehicleLabel),
    is_active: input.is_active,
  }

  packages = [...packages, pkg]
  return { ok: true as const, package: pkg }
}

export function updateAdminServicePackage(packageId: string, input: AdminServicePackageInput) {
  const index = packages.findIndex((item) => item.id === packageId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy gói dịch vụ.' }
  }

  const current = packages[index]
  const updated: ServicePackage = {
    ...current,
    name: input.name.trim(),
    vehicle_type: input.vehicle_type,
    service_type: input.service_type,
    description: input.description.trim(),
    base_price: input.base_price,
    duration_minutes: input.duration_minutes,
    wash_bay_duration_minutes: input.requires_wash_bay
      ? input.wash_bay_duration_minutes
      : null,
    points_earned: input.points_earned,
    requires_wash_bay: input.requires_wash_bay,
    requires_care_staff: input.requires_care_staff,
    included_service_ids: input.included_service_ids,
    is_active: input.is_active,
  }

  packages = [...packages.slice(0, index), updated, ...packages.slice(index + 1)]
  return { ok: true as const, package: updated }
}

export function toggleAdminServicePackageActive(packageId: string) {
  const index = packages.findIndex((item) => item.id === packageId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy gói dịch vụ.' }
  }

  const current = packages[index]
  const updated: ServicePackage = {
    ...current,
    is_active: !current.is_active,
  }

  packages = [...packages.slice(0, index), updated, ...packages.slice(index + 1)]
  return { ok: true as const, package: updated }
}
