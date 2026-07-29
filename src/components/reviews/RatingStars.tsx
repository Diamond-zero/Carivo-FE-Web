import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

interface RatingStarsProps {
  value: number
  showValue?: boolean
  size?: 'sm' | 'md'
  label?: string
}

export function RatingStars({
  value,
  showValue = false,
  size = 'sm',
  label,
}: RatingStarsProps) {
  const roundedValue = Math.max(0, Math.min(5, Math.round(value)))

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${label ? `${label}: ` : ''}${value}/5 sao`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
              star <= roundedValue
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300',
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span className="font-semibold text-slate-700">{value.toFixed(1)}</span>
      ) : null}
    </span>
  )
}
