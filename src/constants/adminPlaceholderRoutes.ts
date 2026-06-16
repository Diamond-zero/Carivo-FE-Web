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
]
