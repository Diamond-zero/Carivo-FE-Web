import { createColumnHelper } from '@tanstack/react-table'
import { ScrollText } from 'lucide-react'
import { useMemo } from 'react'
import { AUDIT_ACTION_LABELS } from '../../../constants/auditLog'
import type { AuditLog } from '../../../types/auditLog'
import { cn } from '../../../lib/utils'
import { formatDateTime } from '../../../utils/format'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<AuditLog>()

interface AdminAuditLogListTableProps {
  logs: AuditLog[]
  hasActiveFilter?: boolean
  onViewDetail: (logId: string) => void
}

export function AdminAuditLogListTable({
  logs,
  hasActiveFilter = false,
  onViewDetail,
}: AdminAuditLogListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('created_at', {
        header: 'Thời gian',
        cell: (info) => (
          <span className="text-sm text-slate-600">{formatDateTime(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('action', {
        header: 'Hành động',
        cell: (info) => (
          <span className="font-medium text-slate-800">
            {AUDIT_ACTION_LABELS[info.getValue()] ?? info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('entity', {
        header: 'Đối tượng',
        cell: (info) => (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('entity_id', {
        header: 'Mã đối tượng',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('actor_role', {
        header: 'Vai trò',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
              info.getValue() === 'ADMIN'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-700',
            )}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('actor_id', {
        header: 'Người thực hiện',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            className="carivo-link text-sm"
            onClick={() => onViewDetail(row.original.id)}
          >
            Chi tiết
          </button>
        ),
      }),
    ],
    [onViewDetail],
  )

  return (
    <DataTable
      columns={columns}
      data={logs}
      emptyState={{
        icon: ScrollText,
        title: hasActiveFilter ? 'Không tìm thấy nhật ký' : 'Chưa có nhật ký',
        description: hasActiveFilter
          ? 'Thử đổi bộ lọc đối tượng, hành động hoặc từ khóa.'
          : 'Nhật ký thao tác sẽ hiển thị tại đây.',
      }}
    />
  )
}
