import type { User } from '../types/user'

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const str = value == null ? '' : String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `${filename}_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
}

export function exportUsersToCsv(users: User[], roleLabel = 'users'): void {
  if (users.length === 0) return

  const headers = ['Mã', 'Họ tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái']

  const rows = users.map((user) => [
    user.id,
    user.full_name,
    user.email ?? '',
    user.phone,
    ROLE_LABELS[user.role] ?? user.role,
    user.is_active ? 'Đang hoạt động' : 'Đã khóa',
  ])

  downloadCsv(`carivo_${roleLabel}`, headers, rows)
}
