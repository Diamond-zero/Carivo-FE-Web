import { createColumnHelper } from '@tanstack/react-table'
import { Eye, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '../../contexts/BookingContext'
import type { WashHistory } from '../../types/washHistory'
import { formatDateTime, formatPrice } from '../../utils/format'
import {
  formatBookingIdLabel,
  formatWashHistoryIdLabel,
  isRealWashHistoryId,
} from '../../utils/washHistory'
import { DataTable, type DataTableEmptyState } from '../ui/DataTable'

const columnHelper = createColumnHelper<WashHistory>()

interface WashHistoryTableProps {
  histories: WashHistory[]
  emptyState?: DataTableEmptyState
  loading?: boolean
  onViewDetail?: (history: WashHistory) => void
}

export function WashHistoryTable({
  histories,
  emptyState,
  loading = false,
  onViewDetail,
}: WashHistoryTableProps) {
  const { getServicePackageName } = useBookings()
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
              {formatWashHistoryIdLabel(info.row.original.id)}
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
            title={info.getValue()}
          >
            {formatBookingIdLabel(info.getValue())}
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
            {info.row.original.service_package_name ??
              getServicePackageName(info.getValue())}
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
        cell: (info) => {
          const method = info.getValue()
          const label = method === 'PAYOS' ? 'PayOS' : 'Tiền mặt'
          const className =
            method === 'PAYOS'
              ? 'bg-violet-100 text-violet-700'
              : 'bg-slate-100 text-slate-700'

          return (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
            >
              {label}
            </span>
          )
        },
      }),
      ...(onViewDetail
        ? [
            columnHelper.display({
              id: 'actions',
              header: '',
              cell: (info) => {
                const history = info.row.original
                if (!isRealWashHistoryId(history.id)) {
                  return (
                    <span className="text-xs text-slate-400" title="Chỉ xem qua booking">
                      —
                    </span>
                  )
                }

                return (
                  <button
                    type="button"
                    onClick={() => onViewDetail(history)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Chi tiết
                  </button>
                )
              },
            }),
          ]
        : []),
    ],
    [getServicePackageName, onViewDetail],
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
