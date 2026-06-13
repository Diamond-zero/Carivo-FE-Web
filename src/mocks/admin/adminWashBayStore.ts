import type { VehicleType, WashBay, WashBayStatus } from '../../types/washBay'
import { getAdminGarageById } from './adminGarageStore'
import { mockAdminWashBays } from './washBays'

function cloneWashBays(items: WashBay[]): WashBay[] {
  return items.map((bay) => ({ ...bay }))
}

let washBays = cloneWashBays(mockAdminWashBays)

export function getAdminWashBaysFromStore(): WashBay[] {
  return cloneWashBays(washBays)
}

export function getAdminWashBayById(id: string) {
  const bay = washBays.find((item) => item.id === id)
  return bay ? { ...bay } : undefined
}

export function getAdminWashBaysByGarage(garageId: string) {
  return getAdminWashBaysFromStore().filter((bay) => bay.garage_id === garageId)
}

export function isBayCodeTaken(
  bayCode: string,
  garageId: string,
  excludeBayId?: string,
) {
  const normalized = bayCode.trim().toUpperCase()
  return washBays.some(
    (bay) =>
      bay.garage_id === garageId &&
      bay.bay_code.toUpperCase() === normalized &&
      bay.id !== excludeBayId,
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createAdminWashBay(input: {
  garage_id: string
  name: string
  bay_code: string
  vehicle_type: VehicleType
  is_active: boolean
}) {
  if (!getAdminGarageById(input.garage_id)) {
    return { ok: false as const, message: 'Garage không hợp lệ.' }
  }

  if (isBayCodeTaken(input.bay_code, input.garage_id)) {
    return { ok: false as const, message: 'Mã buồng rửa đã tồn tại tại garage này.' }
  }

  const bay: WashBay = {
    id: `bay-${slugify(input.bay_code)}-${Date.now()}`,
    garage_id: input.garage_id,
    name: input.name.trim(),
    bay_code: input.bay_code.trim().toUpperCase(),
    vehicle_type: input.vehicle_type,
    status: input.is_active ? 'AVAILABLE' : 'INACTIVE',
    current_booking_id: null,
    is_active: input.is_active,
  }

  washBays = [...washBays, bay]
  return { ok: true as const, bay }
}

export function updateAdminWashBay(
  bayId: string,
  input: {
    garage_id: string
    name: string
    bay_code: string
    vehicle_type: VehicleType
    status: WashBayStatus
    is_active: boolean
  },
) {
  const index = washBays.findIndex((bay) => bay.id === bayId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy buồng rửa.' }
  }

  if (!getAdminGarageById(input.garage_id)) {
    return { ok: false as const, message: 'Garage không hợp lệ.' }
  }

  if (isBayCodeTaken(input.bay_code, input.garage_id, bayId)) {
    return { ok: false as const, message: 'Mã buồng rửa đã tồn tại tại garage này.' }
  }

  const current = washBays[index]

  if (current.status === 'OCCUPIED' && input.status !== 'OCCUPIED') {
    return {
      ok: false as const,
      message: 'Buồng đang có booking — không thể đổi trạng thái vận hành.',
    }
  }

  let nextStatus = input.status
  if (!input.is_active) {
    nextStatus = 'INACTIVE'
  } else if (nextStatus === 'INACTIVE') {
    nextStatus = 'AVAILABLE'
  }

  const updated: WashBay = {
    ...current,
    garage_id: input.garage_id,
    name: input.name.trim(),
    bay_code: input.bay_code.trim().toUpperCase(),
    vehicle_type: input.vehicle_type,
    status: nextStatus,
    is_active: input.is_active,
  }

  washBays = [...washBays.slice(0, index), updated, ...washBays.slice(index + 1)]
  return { ok: true as const, bay: updated }
}

export function toggleAdminWashBayActive(bayId: string) {
  const index = washBays.findIndex((bay) => bay.id === bayId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy buồng rửa.' }
  }

  const current = washBays[index]

  if (current.status === 'OCCUPIED') {
    return {
      ok: false as const,
      message: 'Buồng đang sử dụng — không thể ngưng hoạt động.',
    }
  }

  const nextActive = !current.is_active
  const updated: WashBay = {
    ...current,
    is_active: nextActive,
    status: nextActive ? 'AVAILABLE' : 'INACTIVE',
  }

  washBays = [...washBays.slice(0, index), updated, ...washBays.slice(index + 1)]
  return { ok: true as const, bay: updated }
}
