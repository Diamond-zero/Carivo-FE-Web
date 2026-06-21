export interface WashHistory {
  id: string
  booking_id: string
  garage_id: string
  license_plate: string
  service_package_id: string
  service_package_name?: string
  customer_name: string
  final_price: number
  payment_method: 'CASH' | 'PAYOS'
  washed_at: string
  earned_points: number
}
