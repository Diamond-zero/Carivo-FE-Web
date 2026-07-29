import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Nhãn hiển thị trong UI lỗi, mặc định 'trang này' */
  scope?: string
  /** Cho phép reset state ngoài reload (mặc định chỉ reload) */
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Bắt các lỗi render/runtime trong subtree. Khi có lỗi, hiển thị UI thân thiện
 * kèm nút Tải lại — tránh trường hợp React crash im lặng làm React Router bị
 * "đứng" và người dùng không thể chuyển trang.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log ra console để dev dễ debug, không nuốt lỗi
    console.error('[ErrorBoundary]', error, info)
  }

  private handleReset = () => {
    this.setState({ error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    const { error } = this.state
    const { children, scope = 'trang này' } = this.props

    if (!error) {
      return children
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Không thể hiển thị {scope}
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Đã xảy ra lỗi khi tải nội dung. Bạn có thể tải lại để thử lại.
          </p>
          {error.message ? (
            <p className="mt-3 max-w-md break-words rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
              {error.message}
            </p>
          ) : null}
        </div>
        <Button onClick={this.handleReset}>
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </Button>
      </div>
    )
  }
}
