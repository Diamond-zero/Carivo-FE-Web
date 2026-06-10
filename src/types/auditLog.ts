export interface AuditLog {
  id: string
  actor_id: string
  actor_role: string
  action: string
  entity: string
  entity_id: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}
