export const MOCK_GARAGE_ID = 'garage-fpt-hoa-lac'

export const mockGarage = {
  id: MOCK_GARAGE_ID,
  name: 'Carivo FPT Hòa Lạc',
  garage_code: 'FPT-HL-01',
  address: 'Khu Công nghệ cao Hòa Lạc, Thạch Thất',
  city: 'Hà Nội',
  phone: '02432001234',
  opening_time: '07:00',
  closing_time: '18:00',
  slot_interval_minutes: 30,
  is_active: true,
} as const
