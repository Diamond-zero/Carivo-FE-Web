import { MessageSquare, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminSurveyListTable } from '../../../components/admin/survey/AdminSurveyListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import {
  DEFAULT_ADMIN_SURVEY_FILTERS,
  getAdminSurveyGarageOptions,
  getAdminSurveyStats,
  hasActiveAdminSurveyFilters,
  searchAdminSurveys,
  type AdminSurveyFilters,
} from '../../../utils/adminSurveyLookup'

export function AdminSurveysPage() {
  const [filters, setFilters] = useState<AdminSurveyFilters>(DEFAULT_ADMIN_SURVEY_FILTERS)
  const isLoading = useInitialPageSkeleton(280)

  const surveys = useMemo(() => searchAdminSurveys(filters), [filters])
  const stats = useMemo(() => getAdminSurveyStats(), [])
  const garageOptions = getAdminSurveyGarageOptions()
  const hasActiveFilter = hasActiveAdminSurveyFilters(filters)

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Surveys"
            description="Xem kết quả khảo sát khách hàng sau dịch vụ — read-only trên toàn hệ thống."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng phản hồi"
              value={stats.total}
              icon={MessageSquare}
              accent="brand"
            />
            <StatCard
              label="Điểm TB"
              value={stats.avgRating.toFixed(1)}
              icon={Star}
              accent="amber"
            />
            <StatCard
              label="5 sao"
              value={stats.fiveStarCount}
              icon={ThumbsUp}
              accent="emerald"
            />
            <StatCard
              label="≤ 3 sao"
              value={stats.lowRatingCount}
              icon={ThumbsDown}
              accent="violet"
            />
          </div>

          <div className="mb-6 space-y-4">
            <CustomerSearchPanel
              query={filters.query}
              onChange={(query) => setFilters((current) => ({ ...current, query }))}
              onReset={() => setFilters((current) => ({ ...current, query: '' }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="carivo-panel p-4">
                <Label htmlFor="survey-garage" className="mb-1.5">
                  Garage
                </Label>
                <Select
                  id="survey-garage"
                  value={filters.garage}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, garage: event.target.value }))
                  }
                >
                  <option value="ALL">Tất cả garage</option>
                  {garageOptions.map((garage) => (
                    <option key={garage} value={garage}>
                      {garage}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="carivo-panel p-4">
                <Label htmlFor="survey-rating" className="mb-1.5">
                  Điểm tối thiểu
                </Label>
                <Select
                  id="survey-rating"
                  value={filters.minRating === 'ALL' ? 'ALL' : String(filters.minRating)}
                  onChange={(event) => {
                    const value = event.target.value
                    setFilters((current) => ({
                      ...current,
                      minRating: value === 'ALL' ? 'ALL' : Number(value),
                    }))
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="5">5 sao</option>
                  <option value="4">≥ 4 sao</option>
                  <option value="3">≥ 3 sao</option>
                </Select>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {surveys.length} khảo sát
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminSurveyListTable surveys={surveys} hasActiveFilter={hasActiveFilter} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
