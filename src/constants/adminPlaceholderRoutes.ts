export interface AdminPlaceholderRoute {
  path: string
  title: string
  description: string
}

export const adminPlaceholderRoutes: AdminPlaceholderRoute[] = [
  {
    path: '/admin/loyalty/overview',
    title: 'Loyalty — Overview',
    description: 'Tổng quan chương trình loyalty và phân bố hạng khách hàng.',
  },
  {
    path: '/admin/promotions',
    title: 'Promotions',
    description: 'Tạo và quản lý mã khuyến mãi, ưu đãi theo chiến dịch.',
  },
  {
    path: '/admin/analytics/revenue',
    title: 'Analytics — Revenue',
    description: 'Biểu đồ doanh thu theo thời gian và theo garage.',
  },
  {
    path: '/admin/analytics/bookings',
    title: 'Analytics — Bookings',
    description: 'Thống kê lượt đặt, tỷ lệ hoàn thành và xu hướng theo ngày.',
  },
  {
    path: '/admin/analytics/wash-bay',
    title: 'Analytics — WashBay Performance',
    description: 'Hiệu suất sử dụng buồng rửa và thời gian chờ trung bình.',
  },
  {
    path: '/admin/research/export',
    title: 'Research Export',
    description: 'Xuất dữ liệu nghiên cứu phục vụ khảo sát và báo cáo.',
  },
  {
    path: '/admin/surveys',
    title: 'Surveys',
    description: 'Xem kết quả khảo sát khách hàng sau dịch vụ.',
  },
  {
    path: '/admin/audit-logs',
    title: 'Audit Logs',
    description: 'Nhật ký thao tác quản trị trên hệ thống (read-only).',
  },
]
