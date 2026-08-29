import { addDays, addMonths, addYears, format, parseISO } from 'date-fns'

export interface TrendStatItem {
  period: string
  label: string
  bookings: number
  revenue: number
  forecastBookings?: number
  forecastRevenue?: number
  isForecast?: boolean
}

export type ForecastHorizon = 'NEXT_PERIOD' | 'YEAR_2027'

export interface ForecastSummary {
  horizon: ForecastHorizon
  periodLabel: string
  estimatedBookings: number
  estimatedRevenue: number
  bookingGrowthRate: number // % percentage
  revenueGrowthRate: number // % percentage
}

function calculateLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n < 2) {
    return { slope: 0, intercept: values[0] ?? 0 }
  }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    const x = i
    const y = values[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n }
  }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

function generateNextPeriod(lastPeriod: string, forceFuture = true): { period: string; label: string } {
  // YYYY-MM-DD (e.g. 2026-08-28)
  if (/^\d{4}-\d{2}-\d{2}$/.test(lastPeriod)) {
    let date = parseISO(lastPeriod)
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    // Nếu mốc cuối cùng có dữ liệu trong DB là hôm qua (do hôm nay chưa có phát sinh booking mới),
    // mốc dự báo sẽ tự động lấy từ Ngày mai (29/08) để người xem luôn thấy tương lai chính xác.
    if (forceFuture && lastPeriod <= todayStr) {
      date = today
    }

    const nextDate = addDays(date, 1)
    const nextPeriod = format(nextDate, 'yyyy-MM-dd')
    const nextLabel = `${format(nextDate, 'dd/MM')} (Dự báo)`
    return { period: nextPeriod, label: nextLabel }
  }

  // YYYY-MM (e.g. 2026-08)
  if (/^\d{4}-\d{2}$/.test(lastPeriod)) {
    const date = parseISO(`${lastPeriod}-01`)
    const nextDate = addMonths(date, 1)
    const nextPeriod = format(nextDate, 'yyyy-MM')
    const nextLabel = `T${format(nextDate, 'MM/yyyy')} (Dự báo)`
    return { period: nextPeriod, label: nextLabel }
  }

  // YYYY-Wxx (e.g. 2026-W35)
  const weekMatch = lastPeriod.match(/^(\d{4})-W(\d{2})$/)
  if (weekMatch) {
    let year = parseInt(weekMatch[1], 10)
    let week = parseInt(weekMatch[2], 10) + 1
    if (week > 52) {
      year += 1
      week = 1
    }
    const nextPeriod = `${year}-W${String(week).padStart(2, '0')}`
    const nextLabel = `Tuần ${week} (Dự báo)`
    return { period: nextPeriod, label: nextLabel }
  }

  // YYYY (e.g. 2026)
  if (/^\d{4}$/.test(lastPeriod)) {
    const date = parseISO(`${lastPeriod}-01-01`)
    const nextDate = addYears(date, 1)
    const nextPeriod = format(nextDate, 'yyyy')
    const nextLabel = `Năm ${nextPeriod} (Dự báo)`
    return { period: nextPeriod, label: nextLabel }
  }

  return {
    period: `${lastPeriod}_next`,
    label: `${lastPeriod} +1 (Dự báo)`,
  }
}

export function generateForecastData(
  trendStats: Array<{ period: string; label: string; bookings: number; revenue: number }>,
  horizon: ForecastHorizon = 'YEAR_2027'
): {
  combinedStats: TrendStatItem[]
  summary: ForecastSummary | null
} {
  if (!trendStats || trendStats.length === 0) {
    return { combinedStats: [], summary: null }
  }

  // Map historical data
  const combinedStats: TrendStatItem[] = trendStats.map((item, index) => {
    const isLastItem = index === trendStats.length - 1
    return {
      period: item.period,
      label: item.label,
      bookings: item.bookings,
      revenue: item.revenue,
      // For smooth chart continuity, only set anchor on last item
      forecastBookings: isLastItem ? item.bookings : undefined,
      forecastRevenue: undefined,
      isForecast: false,
    }
  })

  if (trendStats.length < 2) {
    const single = trendStats[0]
    const estBookings = Math.round(single.bookings * 1.25)
    const estRevenue = Math.round(single.revenue * 1.3)
    const nextInfo = generateNextPeriod(single.period)

    const forecastItem: TrendStatItem = {
      period: nextInfo.period,
      label: nextInfo.label,
      bookings: undefined as unknown as number,
      revenue: estRevenue,
      forecastBookings: estBookings,
      forecastRevenue: estRevenue,
      isForecast: true,
    }

    return {
      combinedStats: [
        {
          ...single,
          forecastBookings: single.bookings,
          forecastRevenue: undefined,
          isForecast: false,
        },
        forecastItem,
      ],
      summary: {
        horizon: 'YEAR_2027',
        periodLabel: nextInfo.label.replace(' (Dự báo)', ''),
        estimatedBookings: estBookings,
        estimatedRevenue: estRevenue,
        bookingGrowthRate: 25,
        revenueGrowthRate: 30,
      },
    }
  }

  const bookingValues = trendStats.map((t) => t.bookings)
  const revenueValues = trendStats.map((t) => t.revenue)

  const { slope: bSlope, intercept: bIntercept } = calculateLinearRegression(bookingValues)
  const { slope: rSlope, intercept: rIntercept } = calculateLinearRegression(revenueValues)

  const n = trendStats.length
  let lastPeriod = trendStats[trendStats.length - 1].period

  // Determine number of forecast steps based on horizon
  let steps = 1
  if (horizon === 'YEAR_2027') {
    // If period is weekly (YYYY-Wxx)
    if (/^\d{4}-W\d{2}$/.test(lastPeriod)) {
      const [yStr, wStr] = lastPeriod.split('-W')
      const y = parseInt(yStr, 10)
      const w = parseInt(wStr, 10)
      const remainingWeeks = (2027 - y) * 52 + (52 - w)
      steps = Math.max(1, Math.min(16, remainingWeeks))
    } else if (/^\d{4}-\d{2}$/.test(lastPeriod)) {
      const [yStr, mStr] = lastPeriod.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10)
      // Calculate months until end of 2027
      const remainingMonths = (2027 - y) * 12 + (12 - m)
      steps = Math.max(1, Math.min(24, remainingMonths))
    } else if (/^\d{4}$/.test(lastPeriod)) {
      const y = parseInt(lastPeriod, 10)
      steps = Math.max(1, 2027 - y)
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastPeriod)) {
      steps = 14 // 14 days ahead
    }
  }

  const avgBooking = bookingValues.reduce((a, b) => a + b, 0) / n
  const avgRevenue = revenueValues.reduce((a, b) => a + b, 0) / n
  const minBookingBaseline = Math.max(1, Math.round(avgBooking * 0.35))
  const minRevenueBaseline = Math.max(500000, Math.round(avgRevenue * 0.35))

  const forecastPoints: TrendStatItem[] = []

  for (let step = 1; step <= steps; step++) {
    const targetIndex = n - 1 + step
    const rawBooking = bSlope * targetIndex + bIntercept
    const rawRevenue = rSlope * targetIndex + rIntercept

    // Use baseline so operational forecast never collapses to negative or zero
    const estimatedBookings = Math.max(minBookingBaseline, Math.round(rawBooking))
    const estimatedRevenue = Math.max(minRevenueBaseline, Math.round(rawRevenue))

    const nextInfo = generateNextPeriod(lastPeriod)
    lastPeriod = nextInfo.period

    const newItem: TrendStatItem = {
      period: nextInfo.period,
      label: nextInfo.label,
      bookings: undefined as unknown as number,
      revenue: estimatedRevenue,
      forecastBookings: estimatedBookings,
      forecastRevenue: estimatedRevenue,
      isForecast: true,
    }

    combinedStats.push(newItem)
    forecastPoints.push(newItem)
  }

  // Calculate summary metrics
  let summary: ForecastSummary | null = null

  if (horizon === 'YEAR_2027') {
    const items2027 = forecastPoints.filter((item) => item.period.startsWith('2027'))
    const targetItems = items2027.length > 0 ? items2027 : forecastPoints
    if (targetItems.length > 0) {
      const totalBookings = targetItems.reduce((sum, i) => sum + (i.forecastBookings || 0), 0)
      const totalRevenue = targetItems.reduce((sum, i) => sum + (i.forecastRevenue || 0), 0)

      const historyBookings = bookingValues.reduce((a, b) => a + b, 0) || 1
      const historyRevenue = revenueValues.reduce((a, b) => a + b, 0) || 1

      const bGrowth = Math.round(((totalBookings - historyBookings) / historyBookings) * 100)
      const rGrowth = Math.round(((totalRevenue - historyRevenue) / historyRevenue) * 100)

      summary = {
        horizon: 'YEAR_2027',
        periodLabel: items2027.length > 0 ? 'Cả năm 2027' : `Giai đoạn hướng tới 2027 (${targetItems.length} tuần)`,
        estimatedBookings: totalBookings,
        estimatedRevenue: totalRevenue,
        bookingGrowthRate: bGrowth,
        revenueGrowthRate: rGrowth,
      }
    }
  }

  // Fallback if NEXT_PERIOD or not enough 2027 specific points
  if (!summary && forecastPoints.length > 0) {
    const firstPoint = forecastPoints[0]
    const lastBooking = bookingValues[bookingValues.length - 1] || 1
    const lastRevenue = revenueValues[revenueValues.length - 1] || 1
    const bGrowth = Math.round((((firstPoint.forecastBookings || 0) - lastBooking) / lastBooking) * 100)
    const rGrowth = Math.round((((firstPoint.forecastRevenue || 0) - lastRevenue) / lastRevenue) * 100)

    summary = {
      horizon: 'NEXT_PERIOD',
      periodLabel: firstPoint.label.replace(' (Dự báo)', ''),
      estimatedBookings: firstPoint.forecastBookings || 0,
      estimatedRevenue: firstPoint.forecastRevenue || 0,
      bookingGrowthRate: bGrowth,
      revenueGrowthRate: rGrowth,
    }
  }

  return {
    combinedStats,
    summary,
  }
}
