import { History, RefreshCcw, UserCog } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import type { ApiStaffTypeChangeHistoryEntry } from '../../../api/staffTypeChange.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { Select } from '../../../components/ui/Select'
import { StatCard } from '../../../components/ui/StatCard'
import {
  STAFF_TYPE_LABELS,
  STAFF_TYPES,
} from '../../../constants/staffType'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminStaff } from '../../../hooks/api/admin/useAdminStaff'
import { useAdminStaffTypeChangeHistory } from '../../../hooks/api/admin/useAdminStaffTypeChangeRequests'

function formatDateTime(value?: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function AdminStaffTypeChangeHistoryPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [staffTypeFilter, setStaffTypeFilter] = useState<string>('ALL')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  )

  const staffQuery = useAdminStaff({
    query,
    staffTypeFilter:
      staffTypeFilter === 'ALL'
        ? 'ALL'
        : (staffTypeFilter as (typeof STAFF_TYPES)[number]),
  })

  // Mặc định chọn staff đầu tiên nếu chưa chọn ai.
  useEffect(() => {
    if (!selectedProfileId && staffQuery.allStaff.length > 0) {
      setSelectedProfileId(staffQuery.allStaff[0].profile.id)
    }
  }, [staffQuery.allStaff, selectedProfileId])

  const historyQuery = useAdminStaffTypeChangeHistory(
    selectedProfileId ?? undefined,
  )

  useEffect(() => {
    if (staffQuery.isError) {
      showToast(
        getApiErrorMessage(staffQuery.error, 'Không tải được danh sách nhân viên.'),
        'error',
      )
    }
    if (historyQuery.isError) {
      showToast(
        getApiErrorMessage(historyQuery.error, 'Không tải được lịch sử.'),
        'error',
      )
    }
  }, [
    staffQuery.isError,
    staffQuery.error,
    historyQuery.isError,
    historyQuery.error,
    showToast,
  ])

  const selectedRecord = useMemo(
    () =>
      staffQuery.allStaff.find(
        (record) => record.profile.id === selectedProfileId,
      ),
    [staffQuery.allStaff, selectedProfileId],
  )

  const history: ApiStaffTypeChangeHistoryEntry[] = historyQuery.data ?? []
  const transitionCount = history.length

  return (
    <div>
      <PageHeader
        eyebrow="Yêu cầu đổi chức năng"
        title="Lịch sử đổi chức năng"
        description="Tổng hợp các lần nhân viên đã chuyển vai trò theo từng hồ sơ. Chọn một nhân viên ở cột trái để xem chi tiết."
        action={
          <Link to="/admin/staff-type-change-requests">
            <Button variant="secondary">
              <History className="h-4 w-4" />
              Xem danh sách yêu cầu
            </Button>
          </Link>
        }
      />

      {staffQuery.isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nhân viên</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-1">
                <div>
                  <Label htmlFor="query">Tìm</Label>
                  <Input
                    id="query"
                    placeholder="Mã NV hoặc tên"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="staffType">Vai trò</Label>
                  <Select
                    id="staffType"
                    value={staffTypeFilter}
                    onChange={(e) => setStaffTypeFilter(e.target.value)}
                  >
                    <option value="ALL">Tất cả</option>
                    {STAFF_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {STAFF_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {staffQuery.allStaff.length === 0 ? (
                <EmptyState
                  icon={UserCog}
                  title="Chưa có nhân viên phù hợp"
                  description="Thử đổi bộ lọc hoặc thêm nhân viên mới."
                />
              ) : (
                <ul className="max-h-[520px] divide-y divide-slate-200 overflow-y-auto">
                  {staffQuery.allStaff.map((record) => {
                    const isSelected = record.profile.id === selectedProfileId
                    return (
                      <li key={record.profile.id}>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                            isSelected ? 'bg-brand-50/60' : ''
                          }`}
                          onClick={() => setSelectedProfileId(record.profile.id)}
                        >
                          <span>
                            <span className="block text-sm font-medium text-slate-900">
                              {record.user.full_name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {record.profile.staff_code} ·{' '}
                              {STAFF_TYPE_LABELS[record.profile.staff_type] ??
                                record.profile.staff_type}
                            </span>
                          </span>
                          {isSelected ? (
                            <span
                              aria-hidden
                              className="h-2 w-2 rounded-full bg-brand-500"
                            />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedRecord ? (
                  <span className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-slate-500" />
                    {selectedRecord.user.full_name}
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedRecord.profile.staff_code})
                    </span>
                  </span>
                ) : (
                  'Chọn nhân viên để xem lịch sử'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Số lần đổi"
                      value={transitionCount}
                      icon={History}
                      accent="brand"
                    />
                    <StatCard
                      label="Vai trò hiện tại"
                      value={
                        STAFF_TYPE_LABELS[
                          selectedRecord.profile.staff_type
                        ] ?? selectedRecord.profile.staff_type
                      }
                      icon={UserCog}
                      accent="emerald"
                    />
                    <StatCard
                      label="Trạng thái"
                      value={selectedRecord.profile.is_active ? 'Đang làm' : 'Ngưng'}
                      icon={UserCog}
                      accent="violet"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Lịch sử các lần đã áp dụng
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => historyQuery.refetch()}
                      disabled={historyQuery.isFetching}
                    >
                      <RefreshCcw
                        className={
                          historyQuery.isFetching
                            ? 'h-4 w-4 animate-spin'
                            : 'h-4 w-4'
                        }
                      />
                      Tải lại
                    </Button>
                  </div>

                  {historyQuery.isLoading ? (
                    <p className="text-sm text-slate-500">Đang tải...</p>
                  ) : history.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Nhân viên chưa từng đổi chức năng.
                    </div>
                  ) : (
                    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                      {history.map((entry) => (
                        <li key={entry.id} className="relative">
                          <span
                            aria-hidden
                            className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 shadow"
                          />
                          <p className="text-xs font-medium uppercase text-slate-500">
                            {formatDateTime(entry.applied_at)}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-slate-900">
                            <span>
                              {STAFF_TYPE_LABELS[
                                entry.from_staff_type as keyof typeof STAFF_TYPE_LABELS
                              ] ?? entry.from_staff_type}
                            </span>
                            <span aria-hidden> → </span>
                            <span>
                              {STAFF_TYPE_LABELS[
                                entry.to_staff_type as keyof typeof STAFF_TYPE_LABELS
                              ] ?? entry.to_staff_type}
                            </span>
                          </p>
                          {entry.note ? (
                            <p className="mt-1 text-xs text-slate-600">
                              {entry.note}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={History}
                  title="Chưa chọn nhân viên"
                  description="Chọn một nhân viên ở danh sách bên trái để xem lịch sử."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
