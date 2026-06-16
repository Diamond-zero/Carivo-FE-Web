import type { AuditLog } from '../../../types/auditLog'
import { AUDIT_ACTION_LABELS } from '../../../constants/auditLog'
import { formatDateTime } from '../../../utils/format'
import { Modal } from '../../ui/Modal'

interface AdminAuditLogDetailModalProps {
  log: AuditLog | null
  onClose: () => void
}

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
        {value ? JSON.stringify(value, null, 2) : 'null'}
      </pre>
    </div>
  )
}

export function AdminAuditLogDetailModal({ log, onClose }: AdminAuditLogDetailModalProps) {
  return (
    <Modal
      open={log !== null}
      onClose={onClose}
      title={log ? `Audit ${log.id}` : 'Audit log'}
      description={
        log
          ? `${AUDIT_ACTION_LABELS[log.action] ?? log.action} · ${log.entity} · ${formatDateTime(log.created_at)}`
          : undefined
      }
      className="max-w-2xl"
    >
      {log ? (
        <div className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Actor</dt>
              <dd className="font-mono text-slate-900">{log.actor_id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vai trò</dt>
              <dd className="font-medium text-slate-900">{log.actor_role}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Entity ID</dt>
              <dd className="font-mono text-slate-900">{log.entity_id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Entity</dt>
              <dd className="font-medium text-slate-900">{log.entity}</dd>
            </div>
          </dl>
          <JsonBlock label="old_value" value={log.old_value} />
          <JsonBlock label="new_value" value={log.new_value} />
        </div>
      ) : null}
    </Modal>
  )
}
