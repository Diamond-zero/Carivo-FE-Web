import { createColumnHelper } from '@tanstack/react-table'
import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getServicePackageName } from '../../mocks/servicePackages'
import type { WashHistory } from '../../types/washHistory'
import { formatDateTime, formatPrice } from '../../utils/format'
import { DataTable, type DataTableEmptyState } from '../ui/DataTable'

const columnHelper = createColumnHelper<WashHistory>()

interface WashHistoryTableProps {
  histories: WashHistory[]
  emptyState?: DataTableEmptyState
  loading?: boolean
}

export function WashHistoryTable({
  histories,
  emptyState,
  loading = false,
}: WashHistoryTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('washed_at', {
        header: 'Thời gian',
        cell: (info) => (
          <div>
            <p className="font-medium text-slate-900">
              {formatDateTime(info.getValue())}
            </p>
            <p className="text-xs text-slate-500">
              {info.row.original.id.replace('wash-history-', '#')}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('booking_id', {
        header: 'Booking',
        cell: (info) => (
          <Link
            to={`/bookings/${info.getValue()}`}
            className="carivo-link"
          >
            {info.getValue().replace('booking-', '#')}
          </Link>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Khách',
        cell: (info) => (
          <span className="font-medium text-slate-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => (
          <span className="font-medium text-slate-800">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói dịch vụ',
        cell: (info) => (
          <span className="text-slate-700">
            {getServicePackageName(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('final_price', {
        header: 'Thành tiền',
        cell: (info) => (
          <span className="font-semibold text-brand-700">
            {formatPrice(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('earned_points', {
        header: 'Điểm',
        cell: (info) => {
          const points = info.getValue()

          if (points <= 0) {
            return <span className="text-xs text-slate-400">—</span>
          }

          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              <Sparkles className="h-3 w-3" />
              +{points}
            </span>
          )
        },
      }),
      columnHelper.accessor('payment_method', {
        header: 'Thanh toán',
        cell: () => (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Tiền mặt
          </span>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={histories}
      emptyState={emptyState}
      loading={loading}
      skeletonRows={4}
    />
  )
}
