import type { AuditLog } from '../../types/auditLog'

const actions = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'EXPORT',
  'TOGGLE_STATUS',
  'APPROVE',
  'ASSIGN',
]
const resourceTypes = [
  'GARAGE',
  'WASH_BAY',
  'SERVICE_PACKAGE',
  'PROMOTION',
  'BOOKING',
  'STAFF_PROFILE',
  'USER',
]
const actorIds = ['user-adm-001', 'user-stf-001', 'user-stf-005', 'user-stf-007']

function buildAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = []

  for (let index = 1; index <= 100; index += 1) {
    const day = 1 + (index % 30)
    const hour = index % 24
    const minute = (index * 3) % 60
    const resource = resourceTypes[index % resourceTypes.length]
    const action = actions[index % actions.length]
    const actorId = actorIds[index % actorIds.length]
    const createdAt = `2026-06-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    const actorRole = index % 5 === 0 ? 'STAFF' : 'ADMIN'

    logs.push({
      id: `audit-${String(index).padStart(3, '0')}`,
      actor_id: actorId,
      actor: {
        id: actorId,
        full_name:
          actorRole === 'ADMIN'
            ? `Quản trị ${(index % 4) + 1}`
            : `Nhân viên ${(index % 4) + 1}`,
        email: `${actorId}@carivo.vn`,
        phone: null,
        role: actorRole,
        is_active: true,
      },
      action,
      resource_type: resource,
      resource_id: `${resource.toLowerCase()}-${index}`,
      before:
        action === 'UPDATE' || action === 'DELETE'
          ? { is_active: true, updated_at: createdAt }
          : null,
      after:
        action === 'CREATE' || action === 'UPDATE'
          ? { is_active: true, updated_at: createdAt }
          : action === 'DELETE'
            ? { is_active: false, updated_at: createdAt }
            : null,
      ip: `10.0.${(index % 250) + 1}.${(index * 7) % 250}`,
      user_agent: 'Mozilla/5.0 CarivoConsole',
      metadata: { source: 'admin-console' },
      created_at: createdAt,
    })
  }

  return logs.reverse()
}

export const mockAdminAuditLogs: AuditLog[] = buildAuditLogs()

export function getAdminAuditLogsByResourceType(resource: string) {
  return mockAdminAuditLogs.filter((log) => log.resource_type === resource)
}