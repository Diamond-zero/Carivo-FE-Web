export interface SurveyResponse {
  id: string
  booking_id: string
  customer_name: string
  garage_name: string
  rating: number
  comment: string
  submitted_at: string
}

export type ResearchExportDataset =
  | 'bookings'
  | 'customers'
  | 'loyalty'
  | 'audit_logs'
