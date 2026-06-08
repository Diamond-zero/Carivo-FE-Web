import { Car, Star } from 'lucide-react'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import type { Vehicle } from '../../types/vehicle'
import { EmptyState } from '../ui/EmptyState'

interface CustomerVehicleListProps {
  vehicles: Vehicle[]
}

export function CustomerVehicleList({ vehicles }: CustomerVehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        compact
        icon={Car}
        title="Chưa có xe đăng ký"
        description="Khách chưa thêm phương tiện vào tài khoản."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id} className="flex gap-4 px-1 py-4 first:pt-0 last:pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Car className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{vehicle.raw_license_plate}</p>
              {vehicle.is_default ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Star className="h-3 w-3" />
                  Mặc định
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
              {vehicle.brand || vehicle.model
                ? ` · ${[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}`
                : ''}
              {vehicle.color ? ` · ${vehicle.color}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
