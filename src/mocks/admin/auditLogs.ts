import type { AuditLog } from '../../types/auditLog'

const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'TOGGLE_STATUS']
const entities = [
  'Garage',
  'WashBay',
  'ServicePackage',
  'Promotion',
  'TierRule',
  'Booking',
  'User',
  'StaffProfile',
]
const actorIds = ['user-adm-001', 'user-stf-001', 'user-stf-005', 'user-stf-007']

function buildAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = []

  for (let index = 1; index <= 100; index += 1) {
    const day = 1 + (index % 30)
    const hour = index % 24
    const minute = (index * 3) % 60
    const entity = entities[index % entities.length]
    const action = actions[index % actions.length]
    const createdAt = `2026-06-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    logs.push({
      id: `audit-${String(index).padStart(3, '0')}`,
      actor_id: actorIds[index % actorIds.length],
      actor_role: index % 5 === 0 ? 'STAFF' : 'ADMIN',
      action,
      entity,
      entity_id: `${entity.toLowerCase()}-${index}`,
      old_value:
        action === 'UPDATE' || action === 'DELETE'
          ? { is_active: true, updated_at: createdAt }
          : null,
      new_value:
        action === 'CREATE' || action === 'UPDATE'
          ? { is_active: true, updated_at: createdAt }
          : action === 'DELETE'
            ? { is_active: false, updated_at: createdAt }
            : null,
      created_at: createdAt,
    })
  }

  return logs.reverse()
}

export const mockAdminAuditLogs: AuditLog[] = buildAuditLogs()

export function getAdminAuditLogsByEntity(entity: string) {
  return mockAdminAuditLogs.filter((log) => log.entity === entity)
}
