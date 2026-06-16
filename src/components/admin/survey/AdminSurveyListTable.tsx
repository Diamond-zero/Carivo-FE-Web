import { createColumnHelper } from '@tanstack/react-table'
import { MessageSquare, Star } from 'lucide-react'
import { useMemo } from 'react'
import type { SurveyResponse } from '../../../types/survey'
import { cn } from '../../../lib/utils'
import { formatDateTime } from '../../../utils/format'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<SurveyResponse>()

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            index < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200',
          )}
        />
      ))}
    </div>
  )
}

interface AdminSurveyListTableProps {
  surveys: SurveyResponse[]
  hasActiveFilter?: boolean
}

export function AdminSurveyListTable({
  surveys,
  hasActiveFilter = false,
}: AdminSurveyListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('submitted_at', {
        header: 'Thời gian',
        cell: (info) => (
          <span className="text-sm text-slate-600">{formatDateTime(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Khách',
        cell: (info) => (
          <div>
            <p className="font-medium text-slate-900">{info.getValue()}</p>
            <p className="font-mono text-xs text-slate-500">
              {info.row.original.booking_id.replace('booking-', 'BK-')}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('garage_name', {
        header: 'Garage',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('rating', {
        header: 'Đánh giá',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <RatingStars rating={info.getValue()} />
            <span className="text-sm font-medium text-slate-700">{info.getValue()}/5</span>
          </div>
        ),
      }),
      columnHelper.accessor('comment', {
        header: 'Nhận xét',
        cell: (info) => (
          <p className="max-w-xs truncate text-sm text-slate-600" title={info.getValue()}>
            {info.getValue()}
          </p>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={surveys}
      emptyState={{
        icon: MessageSquare,
        title: hasActiveFilter ? 'Không tìm thấy khảo sát' : 'Chưa có khảo sát',
        description: hasActiveFilter
          ? 'Thử đổi bộ lọc garage hoặc điểm đánh giá.'
          : 'Phản hồi khách hàng sau dịch vụ sẽ hiển thị tại đây.',
      }}
    />
  )
}
