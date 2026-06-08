import type { WashHistory } from '../types/washHistory'
import { normalizeSearchText } from './booking'

export interface WashHistoryFilters {
  date: string
  licensePlate: string
  query: string
}

export const DEFAULT_WASH_HISTORY_FILTERS: WashHistoryFilters = {
  date: '',
  licensePlate: '',
  query: '',
}

export function filterWashHistories(
  histories: WashHistory[],
  filters: WashHistoryFilters,
  garageId?: string,
): WashHistory[] {
  const normalizedPlate = normalizeSearchText(filters.licensePlate.trim())
  const normalizedQuery = normalizeSearchText(filters.query.trim())

  return histories
    .filter((item) => !garageId || item.garage_id === garageId)
    .filter((item) => {
      if (filters.date && !item.washed_at.startsWith(filters.date)) {
        return false
      }

      if (
        normalizedPlate &&
        !normalizeSearchText(item.license_plate).includes(normalizedPlate)
      ) {
        return false
      }

      if (normalizedQuery) {
        const matchesCustomer = normalizeSearchText(item.customer_name).includes(
          normalizedQuery,
        )
        const matchesPlate = normalizeSearchText(item.license_plate).includes(
          normalizedQuery,
        )
        const matchesBooking = item.booking_id
          .replace('booking-', '')
          .includes(normalizedQuery)

        if (!matchesCustomer && !matchesPlate && !matchesBooking) {
          return false
        }
      }

      return true
    })
    .sort(
      (a, b) =>
        new Date(b.washed_at).getTime() - new Date(a.washed_at).getTime(),
    )
}

export function getWashHistoryStats(histories: WashHistory[]) {
  return {
    totalRecords: histories.length,
    totalRevenue: histories.reduce((sum, item) => sum + item.final_price, 0),
    totalPoints: histories.reduce((sum, item) => sum + item.earned_points, 0),
  }
}
