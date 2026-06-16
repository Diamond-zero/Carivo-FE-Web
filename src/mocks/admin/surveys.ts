import type { SurveyResponse } from '../../types/survey'

const comments = [
  'Dịch vụ nhanh, nhân viên thân thiện.',
  'Xe sạch, hài lòng với chất lượng rửa.',
  'Chờ hơi lâu nhưng kết quả tốt.',
  'Buồng rửa sạch sẽ, sẽ quay lại.',
  'Nhân viên tư vấn gói dịch vụ rõ ràng.',
  'Giá hợp lý so với chất lượng.',
  'Cần cải thiện thời gian chờ cuối tuần.',
  'Rất hài lòng, đánh giá 5 sao.',
  'Ổn, không có gì đặc biệt.',
  'Combo spa xe rất đáng tiền.',
]

const customers = [
  'Nguyễn Minh Tuấn',
  'Trần Thị Lan',
  'Hoàng Văn Em',
  'Phạm Thu Hà',
  'Lê Quốc Bảo',
  'Võ Thị Mai',
  'Đặng Hữu Phúc',
  'Bùi Ngọc Anh',
]

const garages = [
  'Carivo FPT Hòa Lạc',
  'Carivo Quận 7',
  'Carivo Hải Châu',
]

export const mockAdminSurveys: SurveyResponse[] = Array.from({ length: 24 }, (_, index) => {
  const day = 1 + (index % 28)
  const hour = 9 + (index % 10)
  const rating = index % 7 === 0 ? 3 : index % 5 === 0 ? 4 : index % 11 === 0 ? 2 : 5

  return {
    id: `survey-${String(index + 1).padStart(3, '0')}`,
    booking_id: `booking-${String(index + 1).padStart(3, '0')}`,
    customer_name: customers[index % customers.length],
    garage_name: garages[index % garages.length],
    rating,
    comment: comments[index % comments.length],
    submitted_at: `2026-06-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:30:00`,
  }
}).sort(
  (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
)
