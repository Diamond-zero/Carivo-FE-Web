import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { cn } from '../../lib/utils'
import { EmptyState } from './EmptyState'
import { TableRowsSkeleton } from './Skeleton'

export interface DataTableEmptyState {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  emptyMessage?: string
  emptyState?: DataTableEmptyState
  loading?: boolean
  skeletonRows?: number
  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = 'Không có dữ liệu',
  emptyState,
  loading = false,
  skeletonRows = 5,
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  if (loading) {
    return (
      <TableRowsSkeleton
        rows={skeletonRows}
        columns={Math.min(columns.length, 6)}
      />
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-carivo-sm)]',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full divide-y divide-slate-100 md:min-w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50/90">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100/90 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState?.icon ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description ?? emptyMessage}
                      action={emptyState.action}
                      compact
                    />
                  ) : (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      {emptyMessage}
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-brand-50/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700 md:whitespace-normal"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
