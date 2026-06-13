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
