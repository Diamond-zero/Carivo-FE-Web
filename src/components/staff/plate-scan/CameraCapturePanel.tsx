// ============================================================================
// CameraCapturePanel — UI camera capture cho StaffArrivalQueuePage.
//
// Flow:
//   1. Staff bấm "Bật camera" → stream bắt đầu
//   2. Staff bấm "Chụp" để capture frame JPEG (max 5 frames cho LIVE_BATCH)
//   3. Có thể xoá từng frame hoặc "Chụp lại"
//   4. Staff bấm "Gửi nhận diện" → callback `onSubmit(files)` ở parent
//
// Phù hợp với BE validator:
//   - upload_ids: 1–5 frames
//   - mode = SINGLE (1 ảnh) | LIVE_BATCH (2–5 ảnh)
//   - capture_source = STAFF_CAMERA (auto khi dùng panel này)
// ============================================================================

import {
  AlertCircle,
  Camera,
  CircleSlash,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Send,
  Trash2,
  Video,
  VideoOff,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { cn } from '../../../lib/utils'
import {
  useCameraCapture,
  type CameraCaptureErrorCode,
  type CapturedFrame,
} from '../../../hooks/useCameraCapture'

export interface CameraCapturePanelProps {
  /** Callback khi staff gửi — nhận danh sách File đã capture (1–5). */
  onSubmit: (files: File[], mode: 'SINGLE' | 'LIVE_BATCH') => void
  /** Disabled khi đang submit (parent mutation đang chạy). */
  isSubmitting?: boolean
  /** Optional className cho wrapper. */
  className?: string
  /** Label nút submit (mặc định "Gửi nhận diện"). */
  submitLabel?: string
}

const ERROR_COPY: Record<
  CameraCaptureErrorCode,
  { title: string; description: string }
> = {
  PERMISSION_DENIED: {
    title: 'Quyền truy cập camera bị từ chối',
    description:
      'Vui lòng mở cài đặt trình duyệt, cấp quyền camera cho trang này rồi tải lại.',
  },
  NOT_FOUND: {
    title: 'Không tìm thấy thiết bị camera',
    description:
      'Thiết bị chưa kết nối camera hoặc camera đang bận bởi ứng dụng khác.',
  },
  OVERCONSTRAINED: {
    title: 'Camera không hỗ trợ cấu hình yêu cầu',
    description:
      'Vui lòng thử camera khác hoặc sử dụng upload ảnh từ thư viện.',
  },
  NOT_SUPPORTED: {
    title: 'Trình duyệt không hỗ trợ camera',
    description:
      'Vui lòng dùng Chrome/Edge/Safari mới nhất, hoặc upload ảnh từ thư viện.',
  },
  UNKNOWN: {
    title: 'Lỗi không xác định',
    description: 'Vui lòng thử lại hoặc liên hệ quản trị viên nếu lỗi tiếp diễn.',
  },
}

export function CameraCapturePanel({
  onSubmit,
  isSubmitting = false,
  className,
  submitLabel = 'Gửi nhận diện',
}: CameraCapturePanelProps) {
  const camera = useCameraCapture({
    maxFrames: 5,
    width: 1280,
    height: 720,
  })

  const [isShutterPressed, setIsShutterPressed] = useState(false)
  const lastCaptureAtRef = useRef(0)

  const handleCapture = useCallback(async () => {
    // Tránh spam nút (debounce 600ms)
    const now = Date.now()
    if (now - lastCaptureAtRef.current < 600) return
    lastCaptureAtRef.current = now

    setIsShutterPressed(true)
    try {
      const frame = await camera.capture()
      if (!frame) {
        // Có thể camera chưa ready; silent — staff thấy state preview vẫn idle.
      }
    } finally {
      // Animation nút shutter
      setTimeout(() => setIsShutterPressed(false), 200)
    }
  }, [camera])

  // Spacebar / Enter trigger capture khi streaming (tiện cho tablet)
  useEffect(() => {
    if (!camera.isStreaming) return
    const handler = (event: KeyboardEvent) => {
      // Tránh trigger khi đang focus vào input/textarea
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        void handleCapture()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [camera.isStreaming, handleCapture])

  const handleSubmit = useCallback(() => {
    if (camera.frames.length === 0 || isSubmitting) return
    const files = camera.frames.map((frame) => frame.file)
    const mode = files.length > 1 ? 'LIVE_BATCH' : 'SINGLE'
    onSubmit(files, mode)
  }, [camera.frames, isSubmitting, onSubmit])

  const handleStart = useCallback(() => {
    void camera.start()
  }, [camera])

  const handleStop = useCallback(() => {
    camera.stop()
  }, [camera])

  const handleRemoveFrame = useCallback(
    (index: number) => {
      camera.removeFrame(index)
    },
    [camera],
  )

  const handleRetake = useCallback(() => {
    camera.clearFrames()
    if (!camera.isStreaming) {
      void camera.start()
    }
  }, [camera])

  // ---- Render: states -----------------------------------------------------

  if (!camera.isSupported) {
    return (
      <div
        className={cn(
          'rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800',
          className,
        )}
      >
        <p className="flex items-start gap-2 font-semibold">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Trình duyệt không hỗ trợ camera.
        </p>
        <p className="mt-1">
          Hãy dùng tab "Upload từ thư viện" hoặc trình duyệt Chrome/Edge/Safari mới
          nhất.
        </p>
      </div>
    )
  }

  if (camera.error) {
    const copy = ERROR_COPY[camera.error]
    return (
      <div
        className={cn(
          'rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800',
          className,
        )}
      >
        <p className="flex items-start gap-2 font-semibold">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {copy.title}
        </p>
        <p className="mt-1">{copy.description}</p>
        {camera.errorMessage ? (
          <p className="mt-2 font-mono text-xs text-red-700">
            {camera.errorMessage}
          </p>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={() => {
            camera.reset()
            void camera.start()
          }}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* ----- Video preview / placeholder ----- */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-[var(--shadow-carivo-sm)]">
        <video
          ref={camera.videoRef}
          className={cn(
            'h-full w-full object-cover',
            camera.isStreaming ? 'block' : 'hidden',
          )}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={camera.canvasRef} className="hidden" />

        {!camera.isStreaming ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/80">
              <Video className="h-8 w-8" />
            </div>
            <p className="text-sm">Camera chưa bật</p>
            <p className="text-xs text-slate-400">
              Nhấn nút "Bật camera" bên dưới để xin quyền truy cập.
            </p>
          </div>
        ) : null}

        {/* Status overlay */}
        {camera.isStreaming ? (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600/95 px-2.5 py-1 text-xs font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            LIVE
          </div>
        ) : null}

        {camera.isStreaming ? (
          <div className="absolute right-3 top-3">
            <Badge variant="default" className="bg-black/60 text-white">
              {camera.frames.length} / 5 frame
              {camera.frames.length > 1 ? 's' : ''}
            </Badge>
          </div>
        ) : null}

        {/* Overlay hướng dẫn cho staff */}
        {camera.isStreaming && camera.frames.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Badge variant="default" className="bg-black/60 text-white">
              Căn biển số vào khung, nhấn Space / Chụp để capture
            </Badge>
          </div>
        ) : null}
      </div>

      {/* ----- Capture controls ----- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!camera.isStreaming ? (
          <Button onClick={handleStart} disabled={isSubmitting}>
            <Video className="h-4 w-4" />
            Bật camera
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStop} variant="secondary" disabled={isSubmitting}>
              <VideoOff className="h-4 w-4" />
              Tắt camera
            </Button>
            <Button
              onClick={handleCapture}
              disabled={isSubmitting || camera.frames.length >= 5}
              size="lg"
              className={cn(
                'transition-transform',
                isShutterPressed ? 'scale-95' : 'scale-100',
              )}
            >
              <Camera className="h-5 w-5" />
              Chụp {camera.remainingFrames > 0 ? `(${camera.remainingFrames} còn lại)` : ''}
            </Button>
          </div>
        )}

        {camera.frames.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetake}
            disabled={isSubmitting}
          >
            <RefreshCcw className="h-4 w-4" />
            Chụp lại từ đầu
          </Button>
        ) : null}
      </div>

      {/* ----- Captured frames preview ----- */}
      {camera.frames.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Label className="mb-2">
            Frame đã chụp ({camera.frames.length}
            {camera.frames.length > 1 ? ' — LIVE_BATCH' : ' — SINGLE'})
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {camera.frames.map((frame: CapturedFrame, index: number) => (
              <div
                key={frame.previewUrl}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              >
                <img
                  src={frame.previewUrl}
                  alt={`Frame ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFrame(index)}
                  disabled={isSubmitting}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Xoá frame ${index + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ----- Submit ----- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {camera.frames.length === 0 ? (
            <>
              <CircleSlash className="mr-1 inline h-3 w-3" />
              Chưa có frame nào.
            </>
          ) : camera.frames.length === 1 ? (
            <>
              <ImageIcon className="mr-1 inline h-3 w-3" />
              Sẽ gửi 1 ảnh (SINGLE mode).
            </>
          ) : (
            <>
              <ImageIcon className="mr-1 inline h-3 w-3" />
              Sẽ gửi {camera.frames.length} ảnh (LIVE_BATCH mode — BE sẽ vote kết quả).
            </>
          )}
        </p>
        <Button
          onClick={handleSubmit}
          disabled={camera.frames.length === 0 || isSubmitting}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </div>

      {/* Hidden trigger cho screen reader */}
      <button type="button" onClick={() => camera.clearFrames()} className="hidden">
        <Trash2 />
      </button>
    </div>
  )
}