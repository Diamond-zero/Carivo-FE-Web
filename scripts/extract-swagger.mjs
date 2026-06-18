import { writeFileSync } from 'node:fs'

const response = await fetch(
  'https://wdp301-project-backend.onrender.com/api-docs/swagger-ui-init.js',
)
const text = await response.text()
const marker = '"swaggerDoc": '
const start = text.indexOf(marker)
if (start === -1) throw new Error('swaggerDoc not found')

let i = start + marker.length
while (text[i] !== '{') i += 1

let depth = 0
let inString = false
let escaped = false
let end = i

for (; end < text.length; end += 1) {
  const ch = text[end]
  if (inString) {
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') inString = false
    continue
  }

  if (ch === '"') {
    inString = true
    continue
  }
  if (ch === '{') depth += 1
  if (ch === '}') {
    depth -= 1
    if (depth === 0) {
      end += 1
      break
    }
  }
}

const doc = JSON.parse(text.slice(i, end))
writeFileSync('.tmp-swagger.json', JSON.stringify(doc, null, 2))

const bookingPaths = Object.keys(doc.paths).filter((path) =>
  path.includes('/admin/bookings'),
)

console.log('ADMIN BOOKING PATHS:')
for (const path of bookingPaths) {
  for (const [method, operation] of Object.entries(doc.paths[path])) {
    console.log(`${method.toUpperCase()} ${path} - ${operation.summary ?? ''}`)
  }
}

const schemaNames = [
  'Booking',
  'CreateWalkInBookingRequest',
  'CancelBookingRequest',
  'MarkNoShowRequest',
  'ResolveLateArrivalRequest',
  'BookingOperationRequest',
  'AssignWashBayRequest',
  'ServiceStepDoneRequest',
]

for (const name of schemaNames) {
  const schema = doc.components?.schemas?.[name]
  if (schema) {
    writeFileSync(`.tmp-${name}.json`, JSON.stringify(schema, null, 2))
    console.log(`Wrote .tmp-${name}.json`)
  }
}
