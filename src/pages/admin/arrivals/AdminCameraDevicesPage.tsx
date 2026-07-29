import {
  Camera,
  CheckCircle2,
  KeyRound,
  MapPin,
  Plus,
  PowerOff,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import {
  CameraDeviceStatusBadge,
  CameraHealthBadge,
} from '../../../components/arrival/PlateScanBadges'
import { CreateCameraDeviceModal } from '../../../components/admin/arrivals/CreateCameraDeviceModal'
import { RotateApiKeyModal } from '../../../components/admin/arrivals/RotateApiKeyModal'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { Select } from '../../../components/ui/Select'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminCameraDevices,
  useAdminCreateCameraDeviceMutation,
  useAdminRotateCameraDeviceKeyMutation,
} from '../../../hooks/api/staff/useStaffPlateScans'
import { useAdminGarageOptions } from '../../../hooks/api/admin/useAdminGarages'
import type {
  ApiCameraDevice,
  ApiCameraDeviceWithKey,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  { value: 'REVOKED', label: 'Đã thu hồi' },
]

export function AdminCameraDevicesPage() {
  const { showToast } = useToast()
  const garages = useAdminGarageOptions()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [garageFilter, setGarageFilter] = useState('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [rotatingDevice, setRotatingDevice] = useState<ApiCameraDevice | null>(null)

  const createMutation = useAdminCreateCameraDeviceMutation()
  const rotateMutation = useAdminRotateCameraDeviceKeyMutation(
    rotatingDevice?.id ?? '',
  )

  const params = useMemo(() => {
    const result: { garage_id?: string; status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'REVOKED' } = {}
    if (garageFilter !== 'ALL') result.garage_id = garageFilter
    if (statusFilter !== 'ALL') {
      result.status = statusFilter as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'REVOKED'
    }
    return result
  }, [garageFilter, statusFilter])

  const camerasQuery = useAdminCameraDevices(params)
  const devices = useMemo(
    () => (camerasQuery.data?.data ?? []) as ApiCameraDevice[],
    [camerasQuery.data?.data],
  )

  const summary = useMemo(() => {
    const total = devices.length
    const online = devices.filter((d: ApiCameraDevice) => d.health_status === 'ONLINE').length
    const offline = devices.filter(
      (d: ApiCameraDevice) => d.health_status === 'OFFLINE' || d.health_status === 'STALE',
    ).length
    const active = devices.filter((d: ApiCameraDevice) => d.status === 'ACTIVE').length
    return { total, online, offline, active }
  }, [devices])

  const handleCreate = async (payload: {
    device_code: string
    name: string
    garage_id: string
    location?: string
  }) => {
    return createMutation.mutateAsync(payload)
  }

  const handleRotate = async () => {
    return rotateMutation.mutateAsync()
  }

  if (camerasQuery.isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vận hành cổng"
        title="Camera cổng"
        description="Đăng ký và quản lý camera cổng cố định. Mỗi camera có một API key duy nhất — key chỉ hiển thị 1 lần khi tạo hoặc rotate."
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Đăng ký mới
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng camera" value={summary.total} icon={Camera} accent="brand" />
        <StatCard
          label="ACTIVE"
          value={summary.active}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Online (≤2 phút)"
          value={summary.online}
          icon={Wifi}
          accent="indigo"
        />
        <StatCard
          label="Offline / Stale"
          value={summary.offline}
          icon={WifiOff}
          accent="rose"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="carivo-panel p-4">
          <Label htmlFor="status-filter" className="mb-1.5">
            Trạng thái
          </Label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="carivo-panel p-4">
          <Label htmlFor="garage-filter" className="mb-1.5">
            Garage
          </Label>
          <Select
            id="garage-filter"
            value={garageFilter}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setGarageFilter(event.target.value)}
          >
            <option value="ALL">Tất cả garage</option>
            {garages.map((garage) => (
              <option key={garage.id} value={garage.id}>
                {garage.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="carivo-panel flex items-end justify-end p-4">
          <Button variant="secondary" onClick={() => void camerasQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </section>

      {camerasQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(camerasQuery.error, 'Không thể tải danh sách camera.')}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{devices.length} camera</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {devices.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="Chưa có camera nào"
              description="Đăng ký camera cổng đầu tiên để bắt đầu auto-detect biển số."
              action={
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Đăng ký camera
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Tên / Vị trí</th>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Heartbeat cuối</th>
                    <th className="px-4 py-3">Firmware / Client</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map((device: ApiCameraDevice) => (
                    <CameraRow
                      key={device.id}
                      device={device}
                      onRotate={(d) => {
                        setRotatingDevice(d)
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCameraDeviceModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(result: ApiCameraDeviceWithKey) => {
          showToast(`Đã đăng ký camera ${result.device.name}.`, 'success')
        }}
        createDevice={handleCreate}
      />

      <RotateApiKeyModal
        open={Boolean(rotatingDevice)}
        device={rotatingDevice}
        isRotating={rotateMutation.isPending}
        onClose={() => setRotatingDevice(null)}
        onRotated={() => {
          setRotatingDevice(null)
        }}
        rotateKey={() => handleRotate()}
      />
    </div>
  )
}

interface CameraRowProps {
  device: ApiCameraDevice
  onRotate: (device: ApiCameraDevice) => void
}

function CameraRow({ device, onRotate }: CameraRowProps) {
  const garageName = useGarageName(device.garage_id)
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-900">
            {device.device_code}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{device.name}</p>
        {device.location ? (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" /> {device.location}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{garageName ?? '—'}</td>
      <td className="px-4 py-3">
        <CameraDeviceStatusBadge status={device.status} />
      </td>
      <td className="px-4 py-3">
        <CameraHealthBadge health={device.health_status} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {device.last_heartbeat_at ? (
          <div className="flex items-center gap-1">
            {formatDateTime(device.last_heartbeat_at)}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {device.firmware_version ?? '—'} / {device.client_version ?? '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRotate(device)}
            disabled={device.status === 'REVOKED'}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Rotate key
          </Button>
          {device.status === 'ACTIVE' ? null : (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <PowerOff className="h-3 w-3" />
              {device.status === 'REVOKED' ? 'Bị thu hồi' : 'Không active'}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

interface GarageLike {
  id: string
  name: string
}

function useGarageName(garageId: string): string | null {
  const garages = useAdminGarageOptions() as unknown as GarageLike[]
  return useMemo(() => {
    const match = garages.find((g) => g.id === garageId)
    return match?.name ?? null
  }, [garages, garageId])
}
