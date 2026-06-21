/** Wash history id from GET /admin/wash-histories (MongoDB ObjectId). */
export function isRealWashHistoryId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

export function formatWashHistoryIdLabel(id: string): string {
  if (isRealWashHistoryId(id)) {
    return `#${id.slice(-6)}`
  }
  return id.startsWith('history-') ? `#${id.slice(-6)}` : `#${id.slice(-6)}`
}

export function formatBookingIdLabel(bookingId: string): string {
  return bookingId.length > 6 ? `#${bookingId.slice(-6)}` : bookingId
}
