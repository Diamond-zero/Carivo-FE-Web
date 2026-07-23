// ============================================================================
// PlateScanTabs — Controlled tabs để page biết `activeCaptureSource` (để set
// payload `capture_source` cho createPlateScanApi).
//
// Phase 2.9 → 2.12 refactor: thiết kế controlled hoàn toàn — parent
// (`StaffArrivalQueuePage`) owns `activeCaptureSource` state, truyền xuống
// cùng `onChange` callback. Tabs chỉ render UI.
// ============================================================================

import { ArrowRight, Camera, Info, Loader2, type LucideIcon } from 'lucide-react'

import { Badge } from '../../ui/Badge'
import { cn } from '../../../lib/utils'
import type { PlateCaptureSource } from '../../../types/api/plateScan'

interface TabDefinition {
  key: PlateCaptureSource
  label: string
  icon: LucideIcon
  description: string
}

const TABS: TabDefinition[] = [
  {
    key: 'STAFF_CAMERA',
    label: 'Camera thiết bị',
    icon: Camera,
    description: 'Dùng camera back trên tablet/phone của nhân viên.',
  },
  {
    key: 'GALLERY',
    label: 'Upload file',
    icon: ArrowRight,
    description: 'Upload tối đa 5 ảnh từ máy tính/tablet.',
  },
]

interface Props {
  /** 2 children theo thứ tự TABS. */
  children: [React.ReactNode, React.ReactNode]
  /** Đang upload → disable cả 2 tab. */
  isSubmitting: boolean
  /** Source đang active (controlled). */
  activeCaptureSource: PlateCaptureSource
  /** Callback khi user chuyển tab. */
  onChange: (next: PlateCaptureSource) => void
  /** Hiển thị info banner constraint size (mặc định true). */
  showInfoBanner?: boolean
}

export function PlateScanTabs({
  children,
  isSubmitting,
  activeCaptureSource,
  onChange,
  showInfoBanner = true,
}: Props) {
  return (
    <div className="space-y-3">
      {/* ----- Tab list ----- */}
      <div
        role="tablist"
        aria-label="Nguồn ảnh biển số"
        className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeCaptureSource === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.key}`}
              onClick={() => onChange(tab.key)}
              disabled={isSubmitting}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all sm:flex-none',
                isActive
                  ? 'bg-white text-slate-900 shadow-[var(--shadow-carivo-sm)]'
                  : 'text-slate-600 hover:text-slate-900',
                isSubmitting && 'cursor-not-allowed opacity-50',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ----- Info banner ----- */}
      {showInfoBanner ? (
        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-xs text-brand-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Ảnh phải có kích thước tối thiểu{' '}
            <strong>640×360</strong> và dung lượng{' '}
            <strong>≥ 15KB</strong> (BE validator). Ảnh quá nhỏ/mờ sẽ bị
            <Badge variant="warning" className="mx-1">
              QUALITY_REJECTED
            </Badge>
            và staff cần chụp lại.
          </p>
        </div>
      ) : null}

      {/* ----- Description + tab panels ----- */}
      <p className="text-xs text-slate-500">
        {TABS.find((t) => t.key === activeCaptureSource)?.description}
      </p>

      {isSubmitting ? (
        <div className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Đang upload &amp; gửi nhận diện…
        </div>
      ) : null}

      {TABS.map((tab, index) => (
        <div
          key={tab.key}
          id={`tab-panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.key}`}
          hidden={activeCaptureSource !== tab.key}
        >
          {children[index]}
        </div>
      ))}
    </div>
  )
}