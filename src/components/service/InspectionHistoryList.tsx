import { ClipboardList, ImageOff } from 'lucide-react'
import { useState } from 'react'
import type { VehicleInspection } from '../../types/inspection'
import { INSPECTION_TYPE_LABELS } from '../../constants/inspection'
import { formatDateTime } from '../../utils/format'
import { EmptyState } from '../ui/EmptyState'

interface InspectionHistoryListProps {
  inspections: VehicleInspection[]
}

function InspectionImage({
  src,
  alt,
  index,
  inspectionId,
}: {
  src: string
  alt: string
  index: number
  inspectionId: string
}) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className="aspect-[4/3] flex w-full flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-400"
        title={`Ảnh ${index + 1} không tải được: ${src}`}
      >
        <ImageOff className="h-8 w-8" />
        <span className="mt-1 text-xs">Lỗi tải ảnh</span>
      </div>
    )
  }

  return (
    <img
      key={`${inspectionId}-${index}`}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        console.warn(`[InspectionImage] Ảnh không tải được: ${src}`)
        setHasError(true)
      }}
      className="aspect-[4/3] w-full rounded-lg border border-slate-200 object-cover"
    />
  )
}

export function InspectionHistoryList({
  inspections,
}: InspectionHistoryListProps) {
  if (inspections.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Chưa có biên bản"
        description="Chưa có biên bản kiểm tra nào cho booking này."
        compact
      />
    )
  }

  return (
    <ul className="space-y-4">
      {inspections.map((inspection) => (
        <li
          key={inspection.id}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900">
              {INSPECTION_TYPE_LABELS[inspection.type]}
            </p>
            <p className="text-xs text-slate-500">
              {formatDateTime(inspection.inspected_at)}
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-600">{inspection.note}</p>
          {inspection.images.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {inspection.images.map((image, index) => (
                <InspectionImage
                  key={`${inspection.id}-img-${index}`}
                  src={image}
                  alt={`Inspection ${index + 1}`}
                  index={index}
                  inspectionId={inspection.id}
                />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
