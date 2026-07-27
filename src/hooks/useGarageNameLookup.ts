import { useMemo } from 'react'
import { useAdminGarages } from '../hooks/api/admin/useAdminGarages'

/**
 * Trả về Map<garageId, { name, code, city }> dùng để hiển thị tên garage
 * thay cho ID trong các modal nhỏ (audit log, v.v.).
 */
export function useGarageNameLookup() {
  const { allGarages } = useAdminGarages()

  return useMemo(() => {
    const map = new Map<
      string,
      { name: string; code: string; city?: string }
    >()
    for (const garage of allGarages) {
      map.set(garage.id, {
        name: garage.name,
        code: garage.garage_code,
        city: garage.city,
      })
    }
    return map
  }, [allGarages])
}

export interface GarageDisplayInfo {
  name: string
  code: string
  city?: string
  isKnown: boolean
}

export function formatGarageIdWithLookup(
  id: string | null | undefined,
  lookup: Map<string, { name: string; code: string; city?: string }>,
): GarageDisplayInfo {
  if (!id) {
    return { name: '—', code: '', isKnown: false }
  }
  const info = lookup.get(id)
  if (!info) {
    return { name: id, code: '', isKnown: false }
  }
  return {
    name: info.name,
    code: info.code,
    city: info.city,
    isKnown: true,
  }
}