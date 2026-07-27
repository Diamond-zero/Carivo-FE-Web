import {
  ArrowRight,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  CircleUserRound,
  Eye,
  FileImage,
  Globe2,
  Image as ImageIcon,
  Info,
  KeyRound,
  ListTree,
  type LucideIcon,
  MessageSquareQuote,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserCog,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  AUDIT_ACTOR_ROLE_LABELS,
  humanizeAuditResource,
} from '../../../constants/auditLog'
import {
  useGarageNameLookup,
  formatGarageIdWithLookup,
} from '../../../hooks/useGarageNameLookup'
import type { AuditLog } from '../../../types/auditLog'
import {
  describeAuditChange,
  describeAuditMetadata,
  describeAuditSummary,
  extractAuditImages,
  extractInspectionImages,
  extractPlateScanImages,
  extractUploadImageUrl,
  type AuditFieldChange,
  type AuditImage,
  type AuditMetadataEntry,
} from '../../../utils/adminAuditLogDetail'
import {
  getAdminAuditLogActorLabel,
  getAdminAuditLogActorRole,
} from '../../../utils/adminAuditLogLookup'
import { formatDateTime } from '../../../utils/format'
import { cn } from '../../../lib/utils'

interface AdminAuditLogDetailModalProps {
  log: AuditLog | null
  onClose: () => void
}

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  STAFF_TYPE_CHANGE_REQUEST: Shield,
  STAFF_PROFILE: UserCog,
  BOOKING: CalendarClock,
  BOOKING_PLATE_SCAN: Camera,
  BOOKING_HANDOVER: CheckCircle2,
  UPLOAD: Upload,
  GARAGE: Building2,
  USER: CircleUserRound,
  WASH_HISTORY: ListTree,
}

const TONE_CLASSES: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200',
}

function renderAuditValue(
  value: unknown,
  options: { fallbackWhenEmpty?: string; tone?: 'before' | 'after' } = {},
): ReactNode {
  const fallback =
    options.fallbackWhenEmpty ??
    (options.tone === 'before' ? 'Chưa có' : 'Không áp dụng')
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic">{fallback}</span>
  }
  if (typeof value === 'object' && value !== null && 'display' in value) {
    return (
      <span className="font-medium text-slate-900">
        {(value as { display: string }).display}
      </span>
    )
  }
  return <span className="font-medium text-slate-900">{String(value)}</span>
}

function ChangeRow({ change }: { change: AuditFieldChange }) {
  const hasBefore =
    change.before !== null && change.before !== undefined && change.before !== ''
  const hasAfter =
    change.after !== null && change.after !== undefined && change.after !== ''

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 transition-shadow hover:shadow-[var(--shadow-carivo-sm)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {change.label}
        </span>
        {!hasBefore && hasAfter ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            Mới
          </span>
        ) : null}
        {hasBefore && !hasAfter ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
            Đã xoá
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div
          className={cn(
            'rounded-xl border px-4 py-3 transition-colors',
            hasBefore
              ? 'border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-white'
              : 'border-dashed border-slate-200 bg-slate-50/40',
          )}
        >
          <span
            className={cn(
              'block text-[10px] font-bold uppercase tracking-widest',
              hasBefore ? 'text-rose-600' : 'text-slate-400',
            )}
          >
            Trước
          </span>
          <div className="mt-1.5 text-sm leading-relaxed">
            {renderAuditValue(change.before, {
              tone: 'before',
              fallbackWhenEmpty: 'Chưa có',
            })}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div
          className={cn(
            'rounded-xl border px-4 py-3 transition-colors',
            hasAfter
              ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white'
              : 'border-dashed border-slate-200 bg-slate-50/40',
          )}
        >
          <span
            className={cn(
              'block text-[10px] font-bold uppercase tracking-widest',
              hasAfter ? 'text-emerald-700' : 'text-slate-400',
            )}
          >
            Sau
          </span>
          <div className="mt-1.5 text-sm leading-relaxed">
            {renderAuditValue(change.after, {
              tone: 'after',
              fallbackWhenEmpty: 'Không áp dụng',
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function GarageChangeRow({
  change,
  lookup,
}: {
  change: AuditFieldChange
  lookup: Map<string, { name: string; code: string; city?: string }>
}) {
  const beforeId =
    typeof change.before === 'object' && change.before
      ? (change.before.display as string | null)
      : (change.before as string | null)
  const afterId =
    typeof change.after === 'object' && change.after
      ? (change.after.display as string | null)
      : (change.after as string | null)

  const before = formatGarageIdWithLookup(beforeId, lookup)
  const after = formatGarageIdWithLookup(afterId, lookup)

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 transition-shadow hover:shadow-[var(--shadow-carivo-sm)]">
      <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {change.label}
      </span>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <GarageColumn tone="before" value={before} />
        <div className="flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <GarageColumn tone="after" value={after} />
      </div>
    </div>
  )
}

function GarageColumn({
  tone,
  value,
}: {
  tone: 'before' | 'after'
  value: { name: string; code: string; city?: string; isKnown: boolean }
}) {
  const isEmpty = !value.name || value.name === '—'
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        tone === 'before'
          ? 'border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-white'
          : 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white',
        isEmpty && 'opacity-60',
      )}
    >
      <span
        className={cn(
          'block text-[10px] font-bold uppercase tracking-widest',
          tone === 'before' ? 'text-rose-600' : 'text-emerald-700',
        )}
      >
        {tone === 'before' ? 'Trước' : 'Sau'}
      </span>
      <div className="mt-1.5 flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            tone === 'before'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700',
          )}
        >
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{value.name}</p>
          {value.isKnown ? (
            <p className="text-xs text-slate-500">
              Mã {value.code}
              {value.city ? ` · ${value.city}` : ''}
            </p>
          ) : value.name === '—' ? null : (
            <p className="text-xs text-slate-400">ID chưa rõ garage</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MetadataRow({ entry }: { entry: AuditMetadataEntry }) {
  const tone = entry.tone ?? 'default'
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border px-3.5 py-2.5 transition-colors',
        tone === 'warning' && 'border-amber-200/70 bg-amber-50/40',
        tone === 'info' && 'border-sky-200/70 bg-sky-50/40',
        tone === 'danger' && 'border-rose-200/70 bg-rose-50/40',
        tone === 'success' && 'border-emerald-200/70 bg-emerald-50/40',
        tone === 'default' && 'border-slate-200/70 bg-slate-50/30',
      )}
    >
      <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
        {entry.label}
      </span>
      <span
        className={cn(
          'text-right text-sm font-medium',
          TONE_CLASSES[tone]?.split(' ').find((c) => c.startsWith('text-')) ??
            'text-slate-900',
        )}
      >
        {entry.value}
      </span>
    </div>
  )
}

function Section({
  index,
  icon: Icon,
  title,
  description,
  children,
}: {
  index: number
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      className="carivo-fade-in"
      style={{ animationDelay: `${index * 60}ms` } as React.CSSProperties}
    >
      <header className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {title}
          </h4>
          {description ? (
            <p className="text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  )
}

/**
 * Hiển thị 2 cột ảnh: "Trước khi rửa" và "Sau khi rửa" từ
 * `inspection_snapshot` của BOOKING_HANDOVER (Staff kiểm tra xe).
 */
/**
 * Hiển thị hình ảnh từ BOOKING_PLATE_SCAN: ảnh cắt biển số (crop)
 * + grid các frame đã chụp.
 */
function PlateScanImages({
  crop,
  frames,
  onImageClick,
}: {
  crop: AuditImage | null
  frames: AuditImage[]
  onImageClick: (image: AuditImage) => void
}) {
  if (!crop && frames.length === 0) return null
  return (
    <div className="space-y-3">
      {crop ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Biển số cắt
              </span>
              <span className="text-xs text-slate-600">
                Vùng biển số trích từ khung hình nhận diện
              </span>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              crop
            </span>
          </div>
          <button
            type="button"
            onClick={() => onImageClick(crop)}
            className="group relative block max-h-72 w-full overflow-hidden rounded-xl border border-amber-200/70 bg-slate-900 transition-all hover:ring-2 hover:ring-amber-400"
          >
            <img
              src={crop.url}
              alt={crop.caption ?? 'plate crop'}
              loading="lazy"
              className="max-h-72 w-full object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition-colors group-hover:bg-navy-950/30">
              <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        </div>
      ) : null}
      {frames.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/70 to-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Khung hình đã chụp
              </span>
              <span className="text-xs text-slate-600">
                Các frame camera gửi về khi quét biển số
              </span>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
              {frames.length} frame
            </span>
          </div>
          <div
            className={cn(
              'grid gap-2',
              frames.length === 1
                ? 'grid-cols-1'
                : frames.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3',
            )}
          >
            {frames.map((img, index) => (
              <button
                key={`${img.url}-${index}`}
                type="button"
                onClick={() => onImageClick(img)}
                className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:ring-2 hover:ring-brand-400"
              >
                <img
                  src={img.url}
                  alt={img.caption ?? `frame ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition-colors group-hover:bg-navy-950/40">
                  <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                  #{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InspectionImages({
  beforeImages,
  afterImages,
  onImageClick,
}: {
  beforeImages: AuditImage[]
  afterImages: AuditImage[]
  onImageClick: (image: AuditImage) => void
}) {
  if (beforeImages.length === 0 && afterImages.length === 0) return null
  const totalBefore = beforeImages.length
  const totalAfter = afterImages.length
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ImageColumn
        tone="before"
        label="Trước khi rửa"
        subLabel="Nhân viên chụp khi bắt đầu"
        images={beforeImages}
        onImageClick={onImageClick}
        badge={`${totalBefore} ảnh`}
      />
      <ImageColumn
        tone="after"
        label="Sau khi rửa"
        subLabel="Nhân viên chụp khi hoàn tất"
        images={afterImages}
        onImageClick={onImageClick}
        badge={`${totalAfter} ảnh`}
      />
    </div>
  )
}

function ImageColumn({
  tone,
  label,
  subLabel,
  images,
  onImageClick,
  badge,
}: {
  tone: 'before' | 'after' | 'neutral'
  label: string
  subLabel: string
  images: AuditImage[]
  onImageClick: (image: AuditImage) => void
  badge?: string
}) {
  const toneClassName =
    tone === 'before'
      ? 'border-rose-200/70 bg-gradient-to-br from-rose-50/70 to-white'
      : tone === 'after'
        ? 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white'
        : 'border-slate-200/70 bg-gradient-to-br from-slate-50/70 to-white'
  const labelColor =
    tone === 'before'
      ? 'text-rose-600'
      : tone === 'after'
        ? 'text-emerald-700'
        : 'text-slate-600'

  return (
    <div className={cn('rounded-2xl border p-4', toneClassName)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <span
            className={cn(
              'block text-[10px] font-bold uppercase tracking-widest',
              labelColor,
            )}
          >
            {label}
          </span>
          <span className="text-xs text-slate-600">{subLabel}</span>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {badge ?? `${images.length} ảnh`}
        </span>
      </div>
      {images.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-xs italic text-slate-400">
          <ImageIcon className="mb-1 h-6 w-6 text-slate-300" />
          Không có ảnh đính kèm
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-2',
            images.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}
        >
          {images.map((img, index) => (
            <button
              key={`${img.url}-${index}`}
              type="button"
              onClick={() => onImageClick(img)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:ring-2 hover:ring-brand-400"
            >
              <img
                src={img.url}
                alt={img.caption ?? `${label} #${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition-colors group-hover:bg-navy-950/40">
                <Eye className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              {img.caption ? (
                <span className="absolute bottom-0 left-0 right-0 line-clamp-2 bg-gradient-to-t from-navy-950/80 to-transparent px-2 py-1.5 text-[10px] text-white">
                  {img.caption}
                </span>
              ) : null}
              <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                #{index + 1}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Hiển thị ảnh đơn cho resource UPLOAD (nếu upload còn URL).
 */
function UploadImageCard({
  side,
  image,
  onClick,
}: {
  side: 'before' | 'after'
  image: AuditImage
  onClick: (image: AuditImage) => void
}) {
  const toneClass =
    side === 'before'
      ? 'border-rose-200/70 bg-gradient-to-br from-rose-50/70 to-white'
      : 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white'
  const labelColor =
    side === 'before' ? 'text-rose-600' : 'text-emerald-700'
  const sideLabel = side === 'before' ? 'Trước' : 'Sau'
  const isImage = (image.caption ?? '').length === 0
    ? true
    : !image.caption || image.caption.toLowerCase().includes('image')

  return (
    <div className={cn('rounded-2xl border p-4', toneClass)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span
            className={cn(
              'block text-[10px] font-bold uppercase tracking-widest',
              labelColor,
            )}
          >
            {sideLabel}
          </span>
          <span className="text-xs text-slate-600">
            {side === 'before'
              ? 'Trạng thái tệp trước sự kiện'
              : 'Trạng thái tệp sau sự kiện'}
          </span>
        </div>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {isImage ? 'Ảnh' : 'Tệp'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onClick(image)}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:ring-2 hover:ring-brand-400"
      >
        <img
          src={image.url}
          alt={image.caption ?? 'uploaded image'}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition-colors group-hover:bg-navy-950/40">
          <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
    </div>
  )
}

function ImageEmptyState({
  message,
  description,
}: {
  message: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileImage className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      {description ? (
        <p className="text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}

function ImageLightbox({
  image,
  onClose,
}: {
  image: AuditImage | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!image) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [image, onClose])

  if (!image) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        aria-label="Đóng"
      >
        <X className="h-5 w-5" />
      </button>
      <figure
        className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-carivo-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.caption ?? 'image'}
          className="max-h-[80vh] w-auto object-contain"
        />
        {image.caption ? (
          <figcaption className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
            {image.caption}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body,
  )
}

export function AdminAuditLogDetailModal({
  log,
  onClose,
}: AdminAuditLogDetailModalProps) {
  const garageLookup = useGarageNameLookup()

  const change = useMemo(() => {
    if (!log) return null
    return describeAuditChange(
      log.resource_type,
      log.action,
      log.before,
      log.after,
    )
  }, [log])

  const metadataEntries = useMemo(() => {
    if (!log) return []
    return describeAuditMetadata(log.metadata)
  }, [log])

  const inspectionImages = useMemo(() => {
    if (!log) return { before: [] as AuditImage[], after: [] as AuditImage[] }
    const fromSnapshot = extractInspectionImages(log.after)
    const fromBeforeField = extractAuditImages(log.before)
    const fromAfterField = extractAuditImages(log.after)
    return {
      before: [...fromSnapshot.before, ...fromBeforeField],
      after: [...fromSnapshot.after, ...fromAfterField],
    }
  }, [log])

  const plateScanImages = useMemo(() => {
    if (!log) return { crop: null as AuditImage | null, frames: [] as AuditImage[] }
    const beforeImages = extractPlateScanImages(log.before)
    const afterImages = extractPlateScanImages(log.after)
    const crop =
      afterImages.find((img) => img.kind === 'crop') ??
      beforeImages.find((img) => img.kind === 'crop') ??
      null
    const frames = [
      ...afterImages.filter((img) => img.kind === 'frame'),
      ...beforeImages.filter((img) => img.kind === 'frame'),
    ].map((img) => ({
      url: img.url,
      caption: img.caption,
      type: 'OTHER' as const,
    }))
    return {
      crop: crop
        ? {
            url: crop.url,
            caption: crop.caption,
            type: 'OTHER' as const,
          }
        : null,
      frames,
    }
  }, [log])

  const uploadImageBefore = useMemo(() => {
    if (!log) return null
    const extracted = extractUploadImageUrl(log.before)
    if (!extracted.url) return null
    return {
      url: extracted.url,
      caption: extracted.caption,
      type: 'OTHER' as const,
    } satisfies AuditImage
  }, [log])

  const uploadImageAfter = useMemo(() => {
    if (!log) return null
    const extracted = extractUploadImageUrl(log.after)
    if (!extracted.url) return null
    return {
      url: extracted.url,
      caption: extracted.caption,
      type: 'OTHER' as const,
    } satisfies AuditImage
  }, [log])

  const [lightboxImage, setLightboxImage] = useState<AuditImage | null>(null)

  // Lock body scroll + Escape key
  useEffect(() => {
    if (!log) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [log, onClose])

  if (!log) return null

  const ResourceIcon =
    RESOURCE_ICONS[log.resource_type.toUpperCase()] ?? ShieldCheck
  const summary = describeAuditSummary(log.resource_type, log.action)
  const role = getAdminAuditLogActorRole(log)
  const roleLabel =
    AUDIT_ACTOR_ROLE_LABELS[role as keyof typeof AUDIT_ACTOR_ROLE_LABELS] ??
    role
  const actorLabel = getAdminAuditLogActorLabel(log)

  const actorBadgeTone =
    role === 'ADMIN'
      ? 'bg-violet-50 text-violet-800 ring-violet-200'
      : role === 'STAFF'
        ? 'bg-brand-50 text-brand-800 ring-brand-200'
        : 'bg-slate-100 text-slate-700 ring-slate-200'

  const actorBadgeIcon =
    role === 'ADMIN' ? ShieldCheck : role === 'STAFF' ? UserCog : ShieldOff

  const ActorBadgeIcon = actorBadgeIcon

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-navy-950/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="carivo-fade-in relative z-10 flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white shadow-[var(--shadow-carivo-lg)]"
      >
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-violet-50/50 px-6 py-6 sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-200/25 blur-3xl" />

          <div className="relative flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-[var(--shadow-carivo-md)] ring-1 ring-brand-100">
              <ResourceIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200">
                <Sparkles className="h-3 w-3" />
                {humanizeAuditResource(log.resource_type)}
              </span>
              <h2
                id="audit-detail-title"
                className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                {summary}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  {formatDateTime(log.created_at)}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  #{log.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-slate-500 transition-colors hover:bg-white hover:text-slate-700 ring-1 ring-slate-200"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actor quick view */}
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/60 p-3.5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[var(--shadow-carivo-sm)] ring-1 ring-slate-200">
                <ActorBadgeIcon className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Người thực hiện
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {actorLabel}
                </span>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                actorBadgeTone,
              )}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/40 px-6 py-6 sm:px-8 sm:py-7">
          <div className="space-y-7">
            {change && change.changes.length > 0 ? (
              <Section
                index={1}
                icon={MessageSquareQuote}
                title={change.title}
                description={`Theo dõi ${change.changes.length} thuộc tính đã thay đổi trong yêu cầu này`}
              >
                <div className="space-y-3">
                  {change.changes.map((row) =>
                    row.label.toLowerCase().includes('garage') ? (
                      <GarageChangeRow
                        key={row.label}
                        change={row}
                        lookup={garageLookup}
                      />
                    ) : (
                      <ChangeRow key={row.label} change={row} />
                    ),
                  )}
                </div>
              </Section>
            ) : null}

            {/* Hình ảnh kiểm tra xe (BOOKING_HANDOVER + travel UPLOAD còn URL) */}
            {inspectionImages.before.length > 0 ||
            inspectionImages.after.length > 0 ? (
              <Section
                index={2}
                icon={ImageIcon}
                title="Hình ảnh kiểm tra xe"
                description="Ảnh trước và sau khi rửa do nhân viên kiểm tra xe đính kèm"
              >
                <InspectionImages
                  beforeImages={inspectionImages.before}
                  afterImages={inspectionImages.after}
                  onImageClick={setLightboxImage}
                />
              </Section>
            ) : null}

            {/* Hình ảnh quét biển số (BOOKING_PLATE_SCAN) */}
            {log.resource_type.toUpperCase() === 'BOOKING_PLATE_SCAN' &&
            (plateScanImages.crop || plateScanImages.frames.length > 0) ? (
              <Section
                index={2}
                icon={Camera}
                title="Hình ảnh quét biển số"
                description="Ảnh cắt biển số và các khung hình camera đã ghi nhận"
              >
                <PlateScanImages
                  crop={plateScanImages.crop}
                  frames={plateScanImages.frames}
                  onImageClick={setLightboxImage}
                />
              </Section>
            ) : null}

            {/* Hình ảnh quét biển số đã bị purge (BOOKING_PLATE_SCAN_IMAGES_PURGED) */}
            {log.resource_type.toUpperCase() === 'BOOKING_PLATE_SCAN' &&
            !plateScanImages.crop &&
            plateScanImages.frames.length === 0 ? (
              <Section
                index={2}
                icon={Trash2}
                title="Hình ảnh quét biển số"
                description="Ảnh đã hết hạn lưu trữ"
              >
                <ImageEmptyState
                  message="Ảnh không còn khả dụng"
                  description="Hệ thống đã purge ảnh theo chính sách retention — chỉ còn metadata để tra cứu."
                />
              </Section>
            ) : null}

            {/* Ảnh đơn cho resource UPLOAD (nếu còn URL) */}
            {log.resource_type.toUpperCase() === 'UPLOAD' &&
            (uploadImageBefore || uploadImageAfter) ? (
              <Section
                index={2}
                icon={ImageIcon}
                title="Hình ảnh tệp đính kèm"
                description="Ảnh minh hoạ cho sự kiện trên tệp upload"
              >
                <div
                  className={cn(
                    'grid gap-3',
                    uploadImageBefore && uploadImageAfter
                      ? 'md:grid-cols-2'
                      : 'grid-cols-1',
                  )}
                >
                  {uploadImageBefore ? (
                    <UploadImageCard
                      side="before"
                      image={uploadImageBefore}
                      onClick={setLightboxImage}
                    />
                  ) : null}
                  {uploadImageAfter ? (
                    <UploadImageCard
                      side="after"
                      image={uploadImageAfter}
                      onClick={setLightboxImage}
                    />
                  ) : null}
                </div>
              </Section>
            ) : null}

            {/* UPLOAD resource không có URL: thông báo thân thiện */}
            {log.resource_type.toUpperCase() === 'UPLOAD' &&
            !uploadImageBefore &&
            !uploadImageAfter &&
            !inspectionImages.before.length &&
            !inspectionImages.after.length ? (
              <Section
                index={2}
                icon={Trash2}
                title="Hình ảnh tệp đính kèm"
                description="Tệp đã được xoá hoặc hết hạn lưu trữ"
              >
                <ImageEmptyState
                  message="Tệp không còn khả dụng"
                  description="Hệ thống chỉ giữ metadata sau khi tệp đã được xoá — không thể xem lại ảnh cho sự kiện này."
                />
              </Section>
            ) : null}

            {metadataEntries.length > 0 ? (
              <Section
                index={3}
                icon={Tag}
                title="Thông tin bổ sung"
                description="Các thuộc tính mở rộng kèm theo sự kiện"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {metadataEntries.map((entry) => (
                    <MetadataRow
                      key={`${entry.label}-${entry.value}`}
                      entry={entry}
                    />
                  ))}
                </div>
              </Section>
            ) : null}

            <Section
              index={4}
              icon={Info}
              title="Thông tin kỹ thuật"
              description="Dấu vết hệ thống ghi nhận được"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <KeyRound className="h-3 w-3" />
                    Mã đối tượng
                  </div>
                  <div
                    className="mt-1.5 break-all font-mono text-xs text-slate-900"
                    title={log.resource_id}
                  >
                    {log.resource_id}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Globe2 className="h-3 w-3" />
                    Địa chỉ IP
                  </div>
                  {log.ip ? (
                    <div className="mt-1.5 font-mono text-xs text-slate-900">
                      {log.ip}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-xs italic text-slate-400">
                      {role === 'SYSTEM'
                        ? 'Không áp dụng — tác vụ chạy nền'
                        : 'Không ghi nhận IP'}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <MonitorSmartphone className="h-3 w-3" />
                    Trình duyệt / thiết bị
                  </div>
                  {log.user_agent ? (
                    <div
                      className="mt-1.5 line-clamp-2 break-all text-[11px] text-slate-700"
                      title={log.user_agent}
                    >
                      {log.user_agent}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-xs italic text-slate-400">
                      {role === 'SYSTEM'
                        ? 'Không áp dụng — tác vụ chạy nền'
                        : 'Không ghi nhận thiết bị'}
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>,
    document.body,
  )
}