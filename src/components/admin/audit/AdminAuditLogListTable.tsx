import { createColumnHelper } from '@tanstack/react-table'
import {
  Activity,
  ArrowDownToLine,
  CheckCircle2,
  Edit3,
  Globe,
  KeyRound,
  LogIn,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  AUDIT_ACTOR_ROLE_LABELS,
  categorizeAuditAction,
  humanizeAuditAction,
  humanizeAuditResource,
} from '../../../constants/auditLog'
import type { AuditLog } from '../../../types/auditLog'
import { formatDateTime } from '../../../utils/format'
import {
  getAdminAuditLogActorLabel,
  getAdminAuditLogActorRole,
} from '../../../utils/adminAuditLogLookup'
import { cn } from '../../../lib/utils'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<AuditLog>()

const ACTION_ICON: Record<ReturnType<typeof categorizeAuditAction>, LucideIcon> = {
  create: Plus,
  update: Edit3,
  delete: Trash2,
  auth: LogIn,
  export: ArrowDownToLine,
  status: Power,
  assignment: Activity,
  approval: CheckCircle2,
  other: ShieldCheck,
}

const ACTION_STYLES: Record<
  ReturnType<typeof categorizeAuditAction>,
  { ring: string; bg: string; text: string }
> = {
  create: {
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  update: {
    ring: 'ring-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  delete: {
    ring: 'ring-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
  },
  auth: {
    ring: 'ring-violet-200',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
  export: {
    ring: 'ring-sky-200',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
  },
  status: {
    ring: 'ring-indigo-200',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
  },
  assignment: {
    ring: 'ring-brand-200',
    bg: 'bg-brand-50',
    text: 'text-brand-700',
  },
  approval: {
    ring: 'ring-teal-200',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
  other: {
    ring: 'ring-slate-200',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  },
}

interface AdminAuditLogListTableProps {
  logs: AuditLog[]
  hasActiveFilter?: boolean
  onViewDetail: (logId: string) => void
  isRefreshing?: boolean
}

export function AdminAuditLogListTable({
  logs,
  hasActiveFilter = false,
  onViewDetail,
  isRefreshing = false,
}: AdminAuditLogListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('created_at', {
        header: 'Thời gian',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-slate-900">
              {formatDateTime(info.getValue())}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              {new Date(info.getValue()).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('action', {
        header: 'Hành động',
        cell: (info) => {
          const value = info.getValue()
          const category = categorizeAuditAction(value)
          const Icon = ACTION_ICON[category]
          const styles = ACTION_STYLES[category]
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors',
                styles.bg,
                styles.text,
                styles.ring,
              )}
            >
              <Icon className="h-3 w-3" />
              {humanizeAuditAction(value)}
            </span>
          )
        },
      }),
      columnHelper.accessor('resource_type', {
        header: 'Đối tượng',
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] uppercase text-slate-700">
            <KeyRound className="h-3 w-3 text-slate-400" />
            {humanizeAuditResource(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('resource_id', {
        header: 'Mã đối tượng',
        cell: (info) => {
          const value = info.getValue()
          const truncated = value.length > 14 ? `${value.slice(0, 8)}…` : value
          return (
            <span
              className="font-mono text-[11px] text-slate-500"
              title={value}
            >
              {truncated}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actor',
        header: 'Người thực hiện',
        cell: ({ row }) => {
          const log = row.original
          const role = getAdminAuditLogActorRole(log)
          const roleLabel =
            (AUDIT_ACTOR_ROLE_LABELS as Record<string, string>)[role] ?? role
          const name = getAdminAuditLogActorLabel(log)
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">{name}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {roleLabel}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('ip', {
        header: 'IP',
        cell: (info) => {
          const value = info.getValue()
          if (!value) {
            return (
              <span className="text-xs text-slate-300">—</span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <Globe className="h-3 w-3 text-slate-400" />
              {value}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onViewDetail(row.original.id)}
            className="carivo-link inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-all hover:gap-1.5 hover:text-brand-800"
          >
            Chi tiết
            <Activity className="h-3.5 w-3.5" />
          </button>
        ),
      }),
    ],
    [onViewDetail],
  )

  return (
    <div
      className={cn(
        'transition-opacity duration-300',
        isRefreshing ? 'opacity-60' : 'opacity-100',
      )}
    >
      <DataTable
        columns={columns}
        data={logs}
        enableStagger
        emptyState={{
          icon: ShieldCheck,
          title: hasActiveFilter
            ? 'Không tìm thấy nhật ký phù hợp'
            : 'Chưa có nhật ký nào',
          description: hasActiveFilter
            ? 'Thử đổi bộ lọc đối tượng, hành động hoặc từ khoá.'
            : 'Các thao tác quản trị sẽ xuất hiện tại đây sau khi hệ thống ghi nhận.',
        }}
      />
    </div>
  )
}
