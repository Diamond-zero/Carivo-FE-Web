import type { Booking, BookingStatus, PaymentStatus } from '../../types/booking'
import type { VehicleType } from '../../types/washBay'
import { mockBookings } from '../bookings'
import { ADMIN_GARAGE_DN_ID, ADMIN_GARAGE_Q7_ID, MOCK_GARAGE_ID } from './garages'
import { mockAdminServicePackages } from './servicePackages'

const garageIds = [MOCK_GARAGE_ID, ADMIN_GARAGE_Q7_ID, ADMIN_GARAGE_DN_ID]

const customerIds = [
  'user-cus-001',
  'user-cus-002',
  'user-cus-003',
  'user-cus-004',
  'user-cus-005',
  'user-cus-006',
  'user-cus-007',
  'user-cus-008',
  'user-cus-009',
  'user-cus-010',
  'user-cus-011',
  'user-cus-012',
  'user-cus-013',
  'user-cus-014',
  'user-cus-015',
  'user-cus-016',
  'user-cus-017',
  'user-cus-018',
  'user-cus-019',
  'user-cus-020',
]

const statuses: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW',
]

const plates = [
  '30A-123.45',
  '29X1-234.56',
  '51G-567.89',
  '43A-777.66',
  '30F-888.99',
  '59C-112.33',
  '92A-445.67',
  '43B-901.23',
]

function padBookingId(index: number) {
  return `booking-${String(index).padStart(3, '0')}`
}

function buildGeneratedBookings(): Booking[] {
  const activePackages = mockAdminServicePackages.filter((pkg) => pkg.is_active)
  const bookings: Booking[] = []

  for (let index = 9; index <= 50; index += 1) {
    const garageId = garageIds[index % garageIds.length]
    const pkg = activePackages[index % activePackages.length]
    const vehicleType: VehicleType = pkg.vehicle_type
    const status = statuses[index % statuses.length]
    const day = 1 + (index % 28)
    const month = index % 2 === 0 ? '06' : '05'
    const bookingDate = `2026-${month}-${String(day).padStart(2, '0')}`
    const hour = 8 + (index % 9)
    const startTime = `${bookingDate}T${String(hour).padStart(2, '0')}:00:00`
    const endHour = hour + Math.ceil(pkg.duration_minutes / 60)
    const endTime = `${bookingDate}T${String(endHour).padStart(2, '0')}:00:00`
    const discount = index % 4 === 0 ? Math.round(pkg.base_price * 0.1) : 0
    const paymentStatus: PaymentStatus =
      status === 'COMPLETED' || index % 5 === 0 ? 'PAID' : 'UNPAID'

    bookings.push({
      id: padBookingId(index),
      customer_id: customerIds[index % customerIds.length],
      vehicle_id: `vehicle-admin-${index}`,
      is_walk_in: index % 11 === 0,
      guest_name: index % 11 === 0 ? `Khách walk-in ${index}` : null,
      guest_phone: index % 11 === 0 ? `090${String(1000000 + index)}` : null,
      guest_email: null,
      garage_id: garageId,
      wash_bay_id:
        status === 'IN_PROGRESS'
          ? garageId === ADMIN_GARAGE_Q7_ID
            ? 'bay-q7-car-01'
            : garageId === MOCK_GARAGE_ID
              ? 'bay-002'
              : null
          : null,
      service_package_id: pkg.id,
      license_plate: plates[index % plates.length],
      vehicle_type: vehicleType,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      original_price: pkg.base_price,
      discount_amount: discount,
      final_price: pkg.base_price - discount,
      payment_method: 'CASH',
      payment_status: paymentStatus,
      status,
      note: index % 7 === 0 ? 'Ghi chú admin mock' : null,
    })
  }

  return bookings
}

/** 50 booking toàn hệ thống — 8 booking Staff + 42 booking mở rộng. */
export const mockAdminBookings: Booking[] = [
  ...mockBookings.map((booking) => ({ ...booking })),
  ...buildGeneratedBookings(),
]

