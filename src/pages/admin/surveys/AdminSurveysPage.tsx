import { Eye, Loader2, MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminSurveyListTable } from '../../../components/admin/survey/AdminSurveyListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  SURVEY_STATUS_LABELS,
  useAdminSurveyMutations,
  useAdminSurveyResponses,
  useAdminSurveys,
} from '../../../hooks/api/admin/useAdminSurveys'
import type { ApiSurvey } from '../../../types/api/admin'

export function AdminSurveysPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [responsesSurveyId, setResponsesSurveyId] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      status:
        statusFilter === 'ALL'
          ? undefined
          : (statusFilter as 'DRAFT' | 'PUBLISHED' | 'CLOSED'),
      search: query.trim() || undefined,
    }),
    [statusFilter, query],
  )

  const { data, isLoading, isError, error } = useAdminSurveys(params)
  const { publishMutation, closeMutation } = useAdminSurveyMutations()
  const responsesQuery = useAdminSurveyResponses(responsesSurveyId ?? undefined)

  const surveys = data?.surveys ?? []
  const publishedCount = surveys.filter((item) => item.status === 'PUBLISHED').length
  const draftCount = surveys.filter((item) => item.status === 'DRAFT').length

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được khảo sát.'), 'error')
    }
  }, [isError, error, showToast])

  const handlePublish = async (survey: ApiSurvey) => {
    try {
      await publishMutation.mutateAsync(survey.id)
      showToast(`Đã xuất bản khảo sát "${survey.title}".`, 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không xuất bản được khảo sát.'), 'error')
    }
  }

  const handleClose = async (survey: ApiSurvey) => {
    try {
      await closeMutation.mutateAsync(survey.id)
      showToast(`Đã đóng khảo sát "${survey.title}".`, 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không đóng được khảo sát.'), 'error')
    }
  }

  const responseSurveys = responsesQuery.data?.responses ?? []

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Khảo sát"
            description="Quản lý khảo sát khách hàng — xuất bản, đóng và xem phản hồi."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Tổng khảo sát" value={surveys.length} icon={MessageSquare} accent="brand" />
            <StatCard label="Đang mở" value={publishedCount} icon={MessageSquare} accent="emerald" />
            <StatCard label="Nháp" value={draftCount} icon={MessageSquare} accent="amber" />
          </div>

          <div className="mb-6 space-y-4">
            <CustomerSearchPanel query={query} onChange={setQuery} onReset={() => setQuery('')} />
            <div className="carivo-panel max-w-xs p-4">
              <Label htmlFor="survey-status-filter">Trạng thái</Label>
              <Select
                id="survey-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {Object.entries(SURVEY_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{surveys.length} khảo sát</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Tiêu đề</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">Câu hỏi</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((survey) => (
                    <tr key={survey.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{survey.title}</p>
                        {survey.description ? (
                          <p className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                            {survey.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">
                          {SURVEY_STATUS_LABELS[survey.status] ?? survey.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {survey.questions?.length ?? 0} câu
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setResponsesSurveyId(survey.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Phản hồi
                          </Button>
                          {survey.status === 'DRAFT' ? (
                            <Button
                              size="sm"
                              onClick={() => void handlePublish(survey)}
                              disabled={publishMutation.isPending}
                            >
                              Xuất bản
                            </Button>
                          ) : null}
                          {survey.status === 'PUBLISHED' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => void handleClose(survey)}
                              disabled={closeMutation.isPending}
                            >
                              Đóng
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {surveys.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">Chưa có khảo sát.</p>
              ) : null}
            </CardContent>
          </Card>

          <Modal
            open={Boolean(responsesSurveyId)}
            onClose={() => setResponsesSurveyId(null)}
            title="Phản hồi khảo sát"
            description={
              responsesSurveyId
                ? `Khảo sát ${responsesSurveyId.slice(-6)}`
                : undefined
            }
          >
            {responsesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : responseSurveys.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">Chưa có phản hồi nào.</p>
            ) : (
              <AdminSurveyListTable surveys={responseSurveys} />
            )}
          </Modal>
        </>
      )}
    </div>
  )
}
