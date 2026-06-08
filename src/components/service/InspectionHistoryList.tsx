import type { VehicleInspection } from '../../types/inspection'
import { INSPECTION_TYPE_LABELS } from '../../constants/inspection'
import { formatDateTime } from '../../utils/format'

interface InspectionHistoryListProps {
  inspections: VehicleInspection[]
}

export function InspectionHistoryList({
  inspections,
}: InspectionHistoryListProps) {
  if (inspections.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Chưa có biên bản kiểm tra cho booking này.
      </p>
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
                <img
                  key={`${inspection.id}-${index}`}
                  src={image}
                  alt={`Inspection ${index + 1}`}
                  className="aspect-[4/3] w-full rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
