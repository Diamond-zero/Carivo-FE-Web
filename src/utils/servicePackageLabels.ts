/**
 * Service Package name translation / normalization helpers.
 *
 * Lý do tồn tại:
 *  - BE seed (`BE/WDP301-Project/backend/src/scripts/seedServicePackage.js`)
 *    một số combo (CAR_BASIC_CLEAN, CAR_DETAIL_CLEAN, CAR_ULTIMATE_CLEAN,
 *    CAR_SUPER_CLEAN, MOTORBIKE_WASH_OIL_COMBO) lưu `name` tiếng Anh ("Basic
 *    Clean", "Detail Clean", ...). Các gói khác lại tiếng Việt ("Giặt thảm
 *    sàn xe ô tô", ...). Trong cùng một bảng danh sách booking, nhân viên sẽ
 *    thấy lộn xộn ngôn ngữ — không chuyên nghiệp.
 *  - Vì BE team không sửa trực tiếp (chính sách "FE only") mình map các gói
 *    combo có tên tiếng Anh về bản tiếng Việt ngay tại UI.
 *
 * Khi BE đổi `ServicePackage.name` sang tiếng Việt thì map này trở thành
 * no-op (key normalize sẽ không khớp). Khi đó có thể xoá file.
 *
 * Nguyên tắc:
 *  - So khớp không phân biệt hoa/thường, bỏ khoảng trắng thừa.
 *  - Nếu key đã ở dạng tiếng Việt có dấu → trả về nguyên xi.
 *  - Nếu không match trong map → trả về `name` gốc (không chỉnh sửa) để
 *    không làm hỏng data hợp lệ.
 */

const SERVICE_PACKAGE_NAME_OVERRIDES: Record<string, string> = {
  // CAR combos
  'basic clean': 'Làm sạch cơ bản',
  'detail clean': 'Làm sạch chi tiết',
  'ultimate clean': 'Làm sạch toàn diện',
  'super clean': 'Làm sạch cao cấp',
  // MOTORBIKE combos
  'motorbike wash and oil change combo': 'Combo rửa xe máy và thay dầu',
}

/**
 * Chuẩn hoá tên gói dịch vụ về key so khớp:
 *  - lowercase
 *  - trim
 *  - gộp khoảng trắng liên tiếp thành 1
 *  - KHÔNG bỏ dấu tiếng Việt — chỉ so khớp khi key đã ở dạng tiếng Anh
 *    (các key trong SERVICE_PACKAGE_NAME_OVERRIDES đều là ASCII).
 */
function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Trả về tên gói dịch vụ đã được chuẩn hoá về tiếng Việt nếu có override.
 * Trả về nguyên xi nếu không khớp hoặc input rỗng.
 */
export function normalizeServicePackageName(name?: string | null): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const override = SERVICE_PACKAGE_NAME_OVERRIDES[normalizeKey(trimmed)]
  return override ?? trimmed
}
