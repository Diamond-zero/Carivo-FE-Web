import type { MockUser } from '../types/user'
import { mockStaffProfiles } from './staffProfile'

export const mockUsers: MockUser[] = [
  {
    id: 'user-stf-001',
    full_name: 'Nguyễn Văn An',
    email: 'an.nguyen@carivo.vn',
    phone: '0901000001',
    password: 'Staff@123',
    role: 'STAFF',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-stf-002',
    full_name: 'Trần Thị Bình',
    email: 'binh.tran@carivo.vn',
    phone: '0901000002',
    password: 'Staff@123',
    role: 'STAFF',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-stf-003',
    full_name: 'Lê Văn Cường',
    email: 'cuong.le@carivo.vn',
    phone: '0901000003',
    password: 'Staff@123',
    role: 'STAFF',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-stf-004',
    full_name: 'Phạm Thị Dung',
    email: 'dung.pham@carivo.vn',
    phone: '0901000004',
    password: 'Staff@123',
    role: 'STAFF',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-adm-001',
    full_name: 'Admin Hệ Thống',
    email: 'admin@carivo.vn',
    phone: '0902000001',
    password: 'Admin@123',
    role: 'ADMIN',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-cus-001',
    full_name: 'Khách Hàng Demo',
    email: 'customer@example.com',
    phone: '0903000001',
    password: 'Customer@123',
    role: 'CUSTOMER',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-cus-002',
    full_name: 'Nguyễn Minh Tuấn',
    email: 'tuan.nguyen@example.com',
    phone: '0912345678',
    password: 'Customer@123',
    role: 'CUSTOMER',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-cus-003',
    full_name: 'Trần Thị Lan',
    email: 'lan.tran@example.com',
    phone: '0988776655',
    password: 'Customer@123',
    role: 'CUSTOMER',
    avatar_url: null,
    is_active: true,
  },
  {
    id: 'user-cus-004',
    full_name: 'Hoàng Văn Em',
    email: 'em.hoang@example.com',
    phone: '0909112233',
    password: 'Customer@123',
    role: 'CUSTOMER',
    avatar_url: null,
    is_active: true,
  },
]

export const mockStaffUsers = mockUsers.filter((user) => user.role === 'STAFF')

export const mockCustomerUsers = mockUsers.filter((user) => user.role === 'CUSTOMER')

export const mockQuickLoginAccounts = mockStaffUsers.map((user) => ({
  user,
  staffProfile: mockStaffProfiles.find((profile) => profile.user_id === user.id)!,
}))
