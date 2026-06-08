import { useParams } from 'react-router-dom'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'

export function BookingDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title={`Chi tiết booking ${id?.replace('booking-', '#') ?? ''}`}
      description="Trang chi tiết booking sẽ được triển khai ở commit tiếp theo."
    />
  )
}
