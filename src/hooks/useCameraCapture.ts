// ============================================================================
// useCameraCapture — hook chụp ảnh từ camera thiết bị (back-camera preferred).
// Dùng cho StaffArrivalQueuePage UI thay cho upload file.
//
// Đặc điểm:
//   - getUserMedia với `facingMode: { exact: 'environment' }` (back camera)
//   - Nếu exact fail → fallback `facingMode: 'environment'`
//   - Nếu fallback fail → fallback camera trước (front) cho desktop
//   - Capture qua <canvas> → blob JPEG → File
//   - Hỗ trợ multi-frame batch (1–5 ảnh) — Phase 2.1 dùng cho LIVE_BATCH mode
//   - Strictly cleanup track + revoke preview URL on unmount
//
// Browser support: yêu cầu HTTPS hoặc localhost. Tablet tại garage phải dùng
// HTTPS domain (vd: gate.carivo.vn). Localhost dev OK.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type CameraCaptureErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'NOT_SUPPORTED'
  | 'OVERCONSTRAINED'
  | 'UNKNOWN'

export type CameraCaptureStatus =
  | 'idle' // chưa start
  | 'requesting' // đang xin permission
  | 'streaming' // đang stream
  | 'paused' // pause
  | 'error' // lỗi

export interface CapturedFrame {
  /** File blob JPEG đã compress (quality 0.85). */
  file: File
  /** Object URL để preview trong UI; revoke khi clear. */
  previewUrl: string
  /** Kích thước gốc của frame (sau crop nếu có). */
  width: number
  height: number
  /** Timestamp khi capture (client-side, BE dùng để set `captured_at`). */
  capturedAt: string
}

export interface UseCameraCaptureOptions {
  /** Số frame tối đa (1–5). Mặc định 5 cho LIVE_BATCH mode. */
  maxFrames?: number
  /** JPEG quality (0–1). Mặc định 0.85 — đủ rõ cho BE nhận diện, ~80-150KB/frame. */
  quality?: number
  /** Width canvas (BE yêu cầu tối thiểu 640px). */
  width?: number
  /** Height canvas (BE yêu cầu tối thiểu 360px). */
  height?: number
}

const DEFAULT_MAX_FRAMES = 5
const DEFAULT_QUALITY = 0.85
const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720

const mapMediaError = (error: unknown): CameraCaptureErrorCode => {
  if (!(error instanceof DOMException)) return 'UNKNOWN'
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'PERMISSION_DENIED'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'NOT_FOUND'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'UNKNOWN'
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'OVERCONSTRAINED'
    case 'TypeError':
      return 'NOT_SUPPORTED'
    default:
      return 'UNKNOWN'
  }
}

const buildConstraints = (width: number, height: number): MediaStreamConstraints[] => [
  // Ưu tiên back camera
  {
    audio: false,
    video: {
      facingMode: { exact: 'environment' },
      width: { ideal: width },
      height: { ideal: height },
    },
  },
  // Fallback không exact
  {
    audio: false,
    video: {
      facingMode: 'environment',
      width: { ideal: width },
      height: { ideal: height },
    },
  },
  // Fallback camera bất kỳ (desktop)
  {
    audio: false,
    video: {
      width: { ideal: width },
      height: { ideal: height },
    },
  },
]

const blobToFile = (blob: Blob, filename: string): File =>
  new File([blob], filename, { type: blob.type || 'image/jpeg', lastModified: Date.now() })

export function useCameraCapture(options: UseCameraCaptureOptions = {}) {
  const {
    maxFrames = DEFAULT_MAX_FRAMES,
    quality = DEFAULT_QUALITY,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
  } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<CameraCaptureStatus>('idle')
  const [error, setError] = useState<CameraCaptureErrorCode | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [frames, setFrames] = useState<CapturedFrame[]>([])

  // ---- Internal helpers ---------------------------------------------------

  const stopStream = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    stream.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const clearFrames = useCallback(() => {
    setFrames((current) => {
      current.forEach((frame) => URL.revokeObjectURL(frame.previewUrl))
      return []
    })
  }, [])

  const removeFrame = useCallback((index: number) => {
    setFrames((current) => {
      const next = current.slice()
      const removed = next.splice(index, 1)[0]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return next
    })
  }, [])

  // ---- Lifecycle ----------------------------------------------------------

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('NOT_SUPPORTED')
      setErrorMessage('Trình duyệt không hỗ trợ camera.')
      return
    }
    setStatus('requesting')
    setError(null)
    setErrorMessage(null)

    const constraintsList = buildConstraints(width, height)
    let lastError: unknown = null
    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play().catch(() => {
            /* autoplay có thể bị block; user vẫn xem được frame khi play thủ công */
          })
        }
        setStatus('streaming')
        return
      } catch (err) {
        lastError = err
        // Nếu là OVERCONSTRAINED (no back camera) thì fallback tiếp; nếu là
        // PERMISSION_DENIED thì dừng ngay không thử lại.
        const code = mapMediaError(err)
        if (code === 'PERMISSION_DENIED' || code === 'NOT_FOUND') {
          setStatus('error')
          setError(code)
          setErrorMessage(
            code === 'PERMISSION_DENIED'
              ? 'Bạn đã từ chối quyền truy cập camera. Hãy bật lại trong cài đặt trình duyệt.'
              : 'Không tìm thấy thiết bị camera trên máy này.',
          )
          return
        }
        // OVERCONSTRAINED / UNKNOWN → thử constraint tiếp theo
      }
    }

    // Hết fallback
    setStatus('error')
    setError(mapMediaError(lastError))
    setErrorMessage(
      'Không thể truy cập camera. Vui lòng kiểm tra quyền và thử lại.',
    )
  }, [width, height])

  const stop = useCallback(() => {
    stopStream()
    setStatus('paused')
  }, [stopStream])

  const reset = useCallback(() => {
    stopStream()
    clearFrames()
    setError(null)
    setErrorMessage(null)
    setStatus('idle')
  }, [stopStream, clearFrames])

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      stopStream()
      // Revoke tất cả preview URL còn lại
      setFrames((current) => {
        current.forEach((frame) => URL.revokeObjectURL(frame.previewUrl))
        return current
      })
    }
  }, [stopStream])

  // ---- Capture ------------------------------------------------------------

  const capture = useCallback(async (): Promise<CapturedFrame | null> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    if (status !== 'streaming') return null

    // Lấy kích thước video thật (có thể khác ideal)
    const vw = video.videoWidth || width
    const vh = video.videoHeight || height
    if (vw === 0 || vh === 0) return null

    canvas.width = vw
    canvas.height = vh
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, vw, vh)

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
    if (!blob) return null

    const file = blobToFile(blob, `plate-${Date.now()}.jpg`)
    const previewUrl = URL.createObjectURL(blob)

    const frame: CapturedFrame = {
      file,
      previewUrl,
      width: vw,
      height: vh,
      capturedAt: new Date().toISOString(),
    }

    setFrames((current) => {
      const next = [...current, frame]
      if (next.length > maxFrames) {
        // Drop frame cũ + revoke URL
        const dropped = next.shift()
        if (dropped) URL.revokeObjectURL(dropped.previewUrl)
      }
      return next
    })

    return frame
  }, [status, width, height, quality, maxFrames])

  // ---- Derived state ------------------------------------------------------

  const remainingFrames = useMemo(
    () => Math.max(0, maxFrames - frames.length),
    [frames.length, maxFrames],
  )

  const isStreaming = status === 'streaming'
  const isSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  return {
    // refs
    videoRef,
    canvasRef,
    // state
    status,
    isStreaming,
    error,
    errorMessage,
    frames,
    remainingFrames,
    isSupported,
    // actions
    start,
    stop,
    reset,
    capture,
    clearFrames,
    removeFrame,
  }
}

export type UseCameraCaptureReturn = ReturnType<typeof useCameraCapture>
