import type { SurveyResponse } from '../types/survey'
import { normalizeSearchText } from './booking'

export interface AdminSurveyFilters {
  garage: string | 'ALL'
  minRating: number | 'ALL'
  query: string
}

export const DEFAULT_ADMIN_SURVEY_FILTERS: AdminSurveyFilters = {
  garage: 'ALL',
  minRating: 'ALL',
  query: '',
}

export function getAdminSurveyGarageOptions(surveys: SurveyResponse[]) {
  return [...new Set(surveys.map((survey) => survey.garage_name).filter(Boolean))].sort()
}

export function searchAdminSurveys(
  filters: AdminSurveyFilters,
  surveys: SurveyResponse[],
): SurveyResponse[] {
  const normalizedQuery = normalizeSearchText(filters.query.trim())

  return surveys.filter((survey) => {
    if (filters.garage !== 'ALL' && survey.garage_name !== filters.garage) {
      return false
    }

    if (filters.minRating !== 'ALL' && survey.rating < filters.minRating) {
      return false
    }

    if (normalizedQuery) {
      const name = normalizeSearchText(survey.customer_name)
      const bookingId = normalizeSearchText(survey.booking_id)
      const comment = normalizeSearchText(survey.comment)

      if (
        !name.includes(normalizedQuery) &&
        !bookingId.includes(normalizedQuery) &&
        !comment.includes(normalizedQuery)
      ) {
        return false
      }
    }

    return true
  })
}

export function hasActiveAdminSurveyFilters(filters: AdminSurveyFilters) {
  return (
    filters.garage !== 'ALL' ||
    filters.minRating !== 'ALL' ||
    filters.query.trim() !== ''
  )
}

export function getAdminSurveyStats(surveys: SurveyResponse[]) {
  const total = surveys.length
  const avgRating =
    total === 0 ? 0 : surveys.reduce((sum, item) => sum + item.rating, 0) / total
  const fiveStarCount = surveys.filter((item) => item.rating === 5).length
  const lowRatingCount = surveys.filter((item) => item.rating <= 3).length

  return { total, avgRating, fiveStarCount, lowRatingCount }
}
