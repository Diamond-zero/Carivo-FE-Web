/** Mock override trạng thái khóa/mở khóa — chỉ dùng trong Admin UI phase 1. */
const statusOverrides = new Map<string, boolean>()

export function getCustomerActiveStatus(customerId: string, defaultActive: boolean) {
  return statusOverrides.has(customerId)
    ? statusOverrides.get(customerId)!
    : defaultActive
}

export function setCustomerActiveStatus(customerId: string, isActive: boolean) {
  statusOverrides.set(customerId, isActive)
}
