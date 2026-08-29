import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatCurrency } from '../lib/utils'
import type { AnalyticsFilterValues } from './adminAnalyticsFilters'

interface OverviewData {
  total_bookings: number
  total_revenue: number
  unique_registered_customers: number
  completion_rate: number
}

interface TrendRow {
  period: string
  label: string
  bookings: number
  revenue: number
}

function formatExportDate(period: string, label: string): string {
  // YYYY-MM-DD (e.g. 2026-07-01) -> 01/07/2026 (tránh Excel hiểu nhầm 01/07 thành 7-Jan)
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [year, month, day] = period.split('-')
    return `${day}/${month}/${year}`
  }
  // YYYY-MM (e.g. 2026-07) -> Tháng 07/2026
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-')
    return `Tháng ${month}/${year}`
  }
  // YYYY-Wxx (e.g. 2026-W35) -> Tuần 35/2026
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const [year, week] = period.split('-W')
    return `Tuần ${week}/${year}`
  }
  // YYYY (e.g. 2026) -> Năm 2026
  if (/^\d{4}$/.test(period)) {
    return `Năm ${period}`
  }
  return label || period
}

export function exportDashboardReportToCsv({
  overview,
  trendStats,
  filters,
  garageName,
}: {
  overview?: OverviewData
  trendStats: TrendRow[]
  filters: AnalyticsFilterValues
  garageName?: string
}) {
  const rows: string[][] = []

  // 1. Title & Metadata
  rows.push(['BÁO CÁO THỐNG KÊ DOANH THU & ĐẶT LỊCH CARIVO'])
  rows.push([`Thời gian xuất báo cáo: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}`])

  let filterDesc = 'Mặc định (Toàn bộ thời gian)'
  if (filters.from && filters.to) {
    filterDesc = `Từ ${filters.from} đến ${filters.to}`
  } else if (filters.from) {
    filterDesc = `Từ ngày ${filters.from}`
  } else if (filters.to) {
    filterDesc = `Đến ngày ${filters.to}`
  } else if (filters.groupBy === 'MONTH') {
    filterDesc = 'Theo các tháng trong năm'
  } else if (filters.groupBy === 'YEAR') {
    filterDesc = 'Theo các năm'
  } else if (filters.groupBy === 'WEEK') {
    filterDesc = 'Theo các tuần'
  } else if (filters.groupBy === 'DAY') {
    filterDesc = '7 ngày gần đây'
  }

  const groupByLabels: Record<string, string> = {
    DAY: 'Theo ngày',
    WEEK: 'Theo tuần',
    MONTH: 'Theo tháng',
    YEAR: 'Theo năm',
  }
  rows.push([`Khoảng thời gian: ${filterDesc}`])
  rows.push([`Kiểu gom nhóm: ${groupByLabels[filters.groupBy] || filters.groupBy}`])
  rows.push([`Chi nhánh: ${garageName || 'Tất cả chi nhánh'}`])
  rows.push([]) // empty row separator

  // 2. Summary KPIs
  if (overview) {
    rows.push(['--- TỔNG QUAN CHỈ SỐ ---'])
    rows.push(['Chỉ số', 'Giá trị'])
    rows.push(['Tổng lượt booking', overview.total_bookings.toLocaleString('vi-VN')])
    rows.push(['Tổng doanh thu', formatCurrency(overview.total_revenue)])
    rows.push(['Khách đã đặt lịch', overview.unique_registered_customers.toLocaleString('vi-VN')])
    rows.push(['Tỷ lệ hoàn thành', `${Math.round(overview.completion_rate || 0)}%`])
    rows.push([]) // empty row separator
  }

  // 3. Detailed Trend Data Table
  rows.push(['--- CHI TIẾT THEO THỜI GIAN ---'])
  rows.push(['Mốc thời gian', 'Lượt đặt lịch (Booking)', 'Doanh thu (VNĐ)'])

  trendStats.forEach((stat) => {
    rows.push([
      formatExportDate(stat.period, stat.label),
      stat.bookings.toString(),
      stat.revenue.toString(),
    ])
  })

  // 4. Convert to CSV string with proper quoting
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const stringCell = (cell ?? '').toString()
          if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
            return `"${stringCell.replace(/"/g, '""')}"`
          }
          return stringCell
        })
        .join(',')
    )
    .join('\r\n')

  // 5. Add UTF-8 BOM (\uFEFF) to make Excel parse Vietnamese properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const dateSlug = format(new Date(), 'yyyy-MM-dd_HHmm')
  const fileName = `Bao_cao_Carivo_${dateSlug}.csv`

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
