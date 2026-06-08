import { Car, Bike } from 'lucide-react'
import {
  VEHICLE_TYPE_LABELS,
  WASH_BAY_CARD_BG,
  WASH_BAY_STATUS_COLORS,
  WASH_BAY_STATUS_LABELS,
} from '../../constants/washBayStatus'
import { mockBookings } from '../../mocks/bookings'
import type { Booking } from '../../types/booking'
import type { WashBay } from '../../types/washBay'
import { cn } from '../../lib/utils'

interface WashBayStatusGridProps {
  washBays: WashBay[]
  bookings?: Booking[]
  className?: string
}

function getOccupiedBooking(
  bay: WashBay,
  bookings: Booking[],
): Booking | undefined {
  if (!bay.current_booking_id) return undefined
  return bookings.find((booking) => booking.id === bay.current_booking_id)
}

export function WashBayStatusGrid({
  washBays,
  bookings = mockBookings,
  className,
}: WashBayStatusGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {washBays.map((bay) => {
        const occupiedBooking = getOccupiedBooking(bay, bookings)
        const VehicleIcon = bay.vehicle_type === 'CAR' ? Car : Bike

        return (
          <div
            key={bay.id}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-white/60 p-4 shadow-[var(--shadow-carivo-sm)] ring-1 ring-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-carivo-md)]',
              WASH_BAY_CARD_BG[bay.status],
            )}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400/70 to-brand-600/70 opacity-80" />

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {bay.name}
                </p>
                <p className="text-xs font-medium text-slate-600">{bay.bay_code}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-900/[0.04]">
                <VehicleIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  WASH_BAY_STATUS_COLORS[bay.status],
                )}
              >
                {WASH_BAY_STATUS_LABELS[bay.status]}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {VEHICLE_TYPE_LABELS[bay.vehicle_type]}
              </span>
            </div>

            {occupiedBooking ? (
              <div className="mt-3 rounded-lg border border-white/70 bg-white/75 px-3 py-2 text-xs shadow-sm">
                <p className="font-semibold text-slate-800">
                  {occupiedBooking.license_plate}
                </p>
                <p className="mt-0.5 text-slate-600">
                  Booking {occupiedBooking.id.replace('booking-', '#')}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-600">
                {bay.status === 'AVAILABLE'
                  ? 'Sẵn sàng nhận xe'
                  : bay.status === 'MAINTENANCE'
                    ? 'Đang bảo trì thiết bị'
                    : bay.status === 'INACTIVE'
                      ? 'Buồng tạm ngưng'
                      : 'Không có booking'}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
