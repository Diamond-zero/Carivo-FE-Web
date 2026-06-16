import { mockAdminAuditLogs } from '../mocks/admin/auditLogs'
import { getAdminBookingsFromStore } from '../mocks/admin/adminBookingStore'
import { mockAdminCustomers } from '../mocks/admin/customers'
import type { ResearchExportDataset } from '../types/survey'

export type ResearchExportFormat = 'json' | 'csv'

const datasetLabels: Record<ResearchExportDataset, string> = {
  bookings: 'Bookings',
  customers: 'Customers',
  loyalty: 'Loyalty',
  audit_logs: 'Audit Logs',
}

function getExportRows(dataset: ResearchExportDataset): Record<string, unknown>[] {
  switch (dataset) {
    case 'bookings':
      return getAdminBookingsFromStore().map((booking) => ({ ...booking }))
    case 'customers':
      return mockAdminCustomers.map((record) => ({
        customer_id: record.user.id,
        full_name: record.user.full_name,
        phone: record.user.phone,
        email: record.user.email,
        tier: record.loyalty.current_tier,
        total_spent: record.loyalty.total_spent,
        total_visits: record.loyalty.total_visits,
        total_points: record.loyalty.total_points,
      }))
    case 'loyalty':
      return mockAdminCustomers.map((record) => ({
        customer_id: record.user.id,
        current_tier: record.loyalty.current_tier,
        total_points: record.loyalty.total_points,
        available_points: record.loyalty.available_points,
        redeemed_points: record.loyalty.redeemed_points,
        expired_points: record.loyalty.expired_points,
        total_spent: record.loyalty.total_spent,
        total_visits: record.loyalty.total_visits,
      }))
    case 'audit_logs':
      return mockAdminAuditLogs.map((log) => ({ ...log }))
    default:
      return []
  }
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const text = value == null ? '' : String(value)
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ]

  return lines.join('\n')
}

export function getResearchExportLabel(dataset: ResearchExportDataset) {
  return datasetLabels[dataset]
}

export function downloadResearchExport(
  dataset: ResearchExportDataset,
  format: ResearchExportFormat,
) {
  const rows = getExportRows(dataset)
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `carivo-${dataset}-${timestamp}.${format}`

  const content =
    format === 'json'
      ? JSON.stringify({ exported_at: new Date().toISOString(), dataset, rows }, null, 2)
      : rowsToCsv(rows)

  const mimeType = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)

  return {
    filename,
    rowCount: rows.length,
  }
}
