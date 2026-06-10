import type { Garage } from '../../types/garage'
import { MOCK_GARAGE_ID, mockGarage } from '../garage'

export const ADMIN_GARAGE_Q7_ID = 'garage-q7-hcm-01'
export const ADMIN_GARAGE_DN_ID = 'garage-dn-haichau-01'

export const mockAdminGarageQ7: Garage = {
  id: ADMIN_GARAGE_Q7_ID,
  name: 'Carivo Quận 7',
  garage_code: 'Q7-HCM-01',
  address: '123 Nguyễn Thị Thập, Quận 7',
  city: 'TP. Hồ Chí Minh',
  phone: '02838761234',
  opening_time: '07:30',
  closing_time: '19:00',
  slot_interval_minutes: 30,
  is_active: true,
}

export const mockAdminGarageDaNang: Garage = {
  id: ADMIN_GARAGE_DN_ID,
  name: 'Carivo Hải Châu',
  garage_code: 'DN-HC-01',
  address: '45 Lê Duẩn, Hải Châu',
  city: 'Đà Nẵng',
  phone: '02363567890',
  opening_time: '08:00',
  closing_time: '18:30',
  slot_interval_minutes: 30,
  is_active: true,
}

/** 3 garages toàn hệ thống — tái dùng garage Staff + 2 chi nhánh mới. */
export const mockAdminGarages: Garage[] = [
  { ...mockGarage },
  mockAdminGarageQ7,
  mockAdminGarageDaNang,
]

export { MOCK_GARAGE_ID }
