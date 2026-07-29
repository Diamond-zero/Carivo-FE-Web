import { CircleCheck, CircleX, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'

export function PayosReturnPage() {
  const [searchParams] = useSearchParams()
  const cancelled = searchParams.get('result') === 'cancelled'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
              cancelled
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {cancelled ? (
              <CircleX className="h-6 w-6" />
            ) : (
              <CircleCheck className="h-6 w-6" />
            )}
          </div>
          <CardTitle>
            {cancelled ? 'Đã quay lại từ PayOS' : 'Đã gửi yêu cầu thanh toán'}
          </CardTitle>
          <CardDescription>
            {cancelled
              ? 'QR chưa được ghi nhận thanh toán. Staff có thể quay lại tab Carivo để tạo QR mới hoặc chuyển sang thu tiền mặt.'
              : 'Trạng thái cuối cùng sẽ được Carivo cập nhật sau khi PayOS xác nhận.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => window.close()}>
            <X className="h-4 w-4" />
            Đóng cửa sổ
          </Button>
          <p className="text-center text-xs text-slate-500">
            Nếu cửa sổ không tự đóng, hãy đóng tab này và tiếp tục tại tab nhân
            viên đang mở.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
