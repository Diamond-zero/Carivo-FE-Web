export interface AuditLogActor {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  role: string
  is_active: boolean
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor: AuditLogActor | null
  action: string
  resource_type: string
  resource_id: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}
