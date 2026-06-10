import type { Garage } from '../../types/garage'
import { mockAdminGarages } from './garages'

function cloneGarages(items: Garage[]): Garage[] {
  return items.map((garage) => ({ ...garage }))
}

let garages = cloneGarages(mockAdminGarages)

export function getAdminGaragesFromStore(): Garage[] {
  return cloneGarages(garages)
}

export function getAdminGarageById(id: string) {
  const garage = garages.find((item) => item.id === id)
  return garage ? { ...garage } : undefined
}

export function getAdminGarageName(id: string) {
  return getAdminGarageById(id)?.name ?? id
}

export function isGarageCodeTaken(garageCode: string, excludeGarageId?: string) {
  const normalized = garageCode.trim().toUpperCase()
  return garages.some(
    (garage) =>
      garage.garage_code.toUpperCase() === normalized && garage.id !== excludeGarageId,
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

export function createAdminGarage(input: Omit<Garage, 'id'>) {
  if (isGarageCodeTaken(input.garage_code)) {
    return { ok: false as const, message: 'Mã garage đã tồn tại.' }
  }

  const garage: Garage = {
    ...input,
    id: `garage-${slugify(input.garage_code)}-${Date.now()}`,
    garage_code: input.garage_code.trim().toUpperCase(),
    name: input.name.trim(),
  }

  garages = [...garages, garage]
  return { ok: true as const, garage }
}

export function updateAdminGarage(
  garageId: string,
  input: Omit<Garage, 'id'>,
) {
  const index = garages.findIndex((garage) => garage.id === garageId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy garage.' }
  }

  if (isGarageCodeTaken(input.garage_code, garageId)) {
    return { ok: false as const, message: 'Mã garage đã tồn tại.' }
  }

  const updated: Garage = {
    ...input,
    id: garageId,
    garage_code: input.garage_code.trim().toUpperCase(),
    name: input.name.trim(),
  }

  garages = [...garages.slice(0, index), updated, ...garages.slice(index + 1)]
  return { ok: true as const, garage: updated }
}

export function toggleAdminGarageActive(garageId: string) {
  const index = garages.findIndex((garage) => garage.id === garageId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy garage.' }
  }

  const current = garages[index]
  const updated: Garage = { ...current, is_active: !current.is_active }
  garages = [...garages.slice(0, index), updated, ...garages.slice(index + 1)]

  return { ok: true as const, garage: updated }
}
