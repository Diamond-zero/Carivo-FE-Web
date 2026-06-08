import type { WashBayStatus } from '../types/washBay'

export const WASH_BAY_STATUS_LABELS: Record<WashBayStatus, string> = {
  AVAILABLE: 'Trống',
  OCCUPIED: 'Đang sử dụng',
  MAINTENANCE: 'Bảo trì',
  INACTIVE: 'Ngưng hoạt động',
}

export const WASH_BAY_STATUS_COLORS: Record<WashBayStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  OCCUPIED: 'bg-blue-100 text-blue-800 border-blue-200',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
}
