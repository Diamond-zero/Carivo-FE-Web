import {
  Droplets,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export const heroImage =
  'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1800&q=80'

export const publicNavItems = [
  { label: 'Dịch vụ', href: '#services' },
  { label: 'Đặt lịch', href: '#booking' },
  { label: 'Loyalty', href: '#loyalty' },
  { label: 'Chi nhánh', href: '#branches' },
]

export const heroStats = [
  { value: '4.9/5', label: 'Đánh giá dịch vụ' },
  { value: '12+', label: 'Gói chăm sóc xe' },
  { value: '07:00', label: 'Mở cửa mỗi ngày' },
]

export interface PublicService {
  name: string
  description: string
  price: string
  time: string
  icon: LucideIcon
}

export const publicServices: PublicService[] = [
  {
    name: 'Rửa xe tiêu chuẩn',
    description: 'Làm sạch ngoại thất, bánh xe, kính và lau khô theo quy trình an toàn.',
    price: 'Từ 50.000đ',
    time: '15-30 phút',
    icon: Droplets,
  },
  {
    name: 'Vệ sinh nội thất',
    description: 'Hút bụi, làm sạch ghế, taplo, khe cửa và khử mùi khoang cabin.',
    price: 'Từ 180.000đ',
    time: '60 phút',
    icon: Sparkles,
  },
  {
    name: 'Chăm sóc khoang máy',
    description: 'Vệ sinh chi tiết, dưỡng nhựa và kiểm tra an toàn các khu vực nhạy cảm.',
    price: 'Từ 250.000đ',
    time: '90 phút',
    icon: Wrench,
  },
  {
    name: 'Phủ bảo vệ sơn',
    description: 'Đánh bóng, phủ ceramic và bảo vệ bề mặt sơn sau mỗi hành trình.',
    price: 'Từ 900.000đ',
    time: '3-5 giờ',
    icon: ShieldCheck,
  },
]

export const bookingBranches = [
  'Carivo Tân Phú',
  'Carivo Quận 9',
  'Carivo Phú Nhuận',
]

export const bookingServices = [
  'Rửa xe tiêu chuẩn',
  'Vệ sinh nội thất',
  'Basic Clean combo',
  'Phủ ceramic',
]

export const timeSlots = ['07:00', '08:30', '10:00', '13:00', '15:30', '17:00']

export const processSteps = [
  'Xác nhận booking bằng biển số hoặc số điện thoại',
  'Kiểm tra xe trước dịch vụ và lưu hình ảnh',
  'Gán buồng rửa theo loại xe và slot trống',
  'Theo dõi tiến độ từng bước chăm sóc xe',
]

export const loyaltyTiers = [
  { tier: 'Bronze', bookingWindow: '7 ngày', multiplier: 'x1.1' },
  { tier: 'Silver', bookingWindow: '10 ngày', multiplier: 'x1.2' },
  { tier: 'Gold', bookingWindow: '12 ngày', multiplier: 'x1.35' },
  { tier: 'Platinum', bookingWindow: '14 ngày', multiplier: 'x1.5' },
]

export const branches = [
  'Carivo Tân Phú - 87 Bờ Bao Tân Thắng',
  'Carivo Quận 9 - 77 Đỗ Xuân Hợp',
  'Carivo Phú Nhuận - 84 Cù Lao',
]
