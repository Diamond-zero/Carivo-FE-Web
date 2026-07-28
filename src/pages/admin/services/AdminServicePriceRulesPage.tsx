import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleDollarSign, Pencil, Plus, Power } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  createServicePriceRuleApi,
  deactivateServicePriceRuleApi,
  getServicePriceRulesApi,
  updateServicePriceRuleApi,
} from '../../../api/pricing.api'
import { getApiErrorMessage } from '../../../api/client'
import { getAdminGaragesApi } from '../../../api/garage.api'
import { getAdminServicePackagesApi } from '../../../api/adminServicePackage.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../contexts/ToastContext'
import type {
  PricingCarBodyType,
  PricingEngineType,
  PricingMotorbikeCcGroup,
  ServicePriceRule,
  ServicePriceRulePayload,
} from '../../../types/api/pricing'
import { formatDateTime, formatPrice } from '../../../utils/format'

interface RuleFormState {
  service_package_id: string
  garage_id: string
  engine_type: PricingEngineType | ''
  motorbike_cc_group: PricingMotorbikeCcGroup | ''
  car_body_type: PricingCarBodyType | ''
  seat_group: '' | '2_5' | '6_7' | '8_16'
  price: string
  duration_minutes: string
  wash_bay_duration_minutes: string
  care_staff_duration_minutes: string
  effective_from: string
  effective_to: string
  note: string
}

const emptyForm: RuleFormState = {
  service_package_id: '',
  garage_id: '',
  engine_type: '',
  motorbike_cc_group: '',
  car_body_type: '',
  seat_group: '',
  price: '',
  duration_minutes: '',
  wash_bay_duration_minutes: '',
  care_staff_duration_minutes: '',
  effective_from: '',
  effective_to: '',
  note: '',
}

const seatRangeByGroup = {
  '': [null, null],
  '2_5': [2, 5],
  '6_7': [6, 7],
  '8_16': [8, 16],
} as const

const bodyLabels: Record<PricingCarBodyType, string> = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  MPV: 'MPV',
  PICKUP: 'Pickup',
  VAN: 'Van',
}

const engineLabels: Record<PricingEngineType, string> = {
  GASOLINE: 'Xăng',
  ELECTRIC: 'Điện',
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getSeatGroup(rule: ServicePriceRule): RuleFormState['seat_group'] {
  if (rule.seat_min === 2 && rule.seat_max === 5) return '2_5'
  if (rule.seat_min === 6 && rule.seat_max === 7) return '6_7'
  if (rule.seat_min === 8 && rule.seat_max === 16) return '8_16'
  return ''
}

function toFormState(rule: ServicePriceRule): RuleFormState {
  return {
    service_package_id: rule.service_package_id,
    garage_id: rule.garage_id || '',
    engine_type: rule.engine_type || '',
    motorbike_cc_group: rule.motorbike_cc_group || '',
    car_body_type: rule.car_body_type || '',
    seat_group: getSeatGroup(rule),
    price: String(rule.price),
    duration_minutes: rule.duration_minutes ? String(rule.duration_minutes) : '',
    wash_bay_duration_minutes:
      rule.wash_bay_duration_minutes !== null
        ? String(rule.wash_bay_duration_minutes)
        : '',
    care_staff_duration_minutes:
      rule.care_staff_duration_minutes !== null
        ? String(rule.care_staff_duration_minutes)
        : '',
    effective_from: toDateTimeLocal(rule.effective_from),
    effective_to: rule.effective_to
      ? toDateTimeLocal(rule.effective_to)
      : '',
    note: rule.note || '',
  }
}

export function AdminServicePriceRulesPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [editingRule, setEditingRule] = useState<ServicePriceRule | null>(null)
  const [form, setForm] = useState<RuleFormState>(emptyForm)
  const [formOpen, setFormOpen] = useState(false)

  const rulesQuery = useQuery({
    queryKey: ['admin', 'service-price-rules'],
    queryFn: getServicePriceRulesApi,
  })
  const packagesQuery = useQuery({
    queryKey: ['admin', 'service-packages', 'pricing'],
    queryFn: () => getAdminServicePackagesApi({ limit: 100 }),
  })
  const garagesQuery = useQuery({
    queryKey: ['admin', 'garages', 'pricing'],
    queryFn: () => getAdminGaragesApi({ limit: 100, is_active: true }),
  })

  const packages = packagesQuery.data?.packages || []
  const garages = garagesQuery.data?.garages || []
  const packageById = useMemo(
    () =>
      new Map(
        (packagesQuery.data?.packages || []).map((item) => [item.id, item]),
      ),
    [packagesQuery.data?.packages],
  )
  const garageById = useMemo(
    () =>
      new Map(
        (garagesQuery.data?.garages || []).map((item) => [item.id, item]),
      ),
    [garagesQuery.data?.garages],
  )
  const selectedPackage = packageById.get(form.service_package_id)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackage || !form.price) {
        throw new Error('Vui lòng chọn gói dịch vụ và nhập giá.')
      }
      const [seatMin, seatMax] = seatRangeByGroup[form.seat_group]
      const payload: ServicePriceRulePayload = {
        service_package_id: form.service_package_id,
        garage_id: form.garage_id || null,
        vehicle_type: selectedPackage.vehicle_type,
        engine_type: form.engine_type || null,
        motorbike_cc_group:
          selectedPackage.vehicle_type === 'MOTORBIKE'
            ? form.motorbike_cc_group || null
            : null,
        car_body_type:
          selectedPackage.vehicle_type === 'CAR'
            ? form.car_body_type || null
            : null,
        seat_min: selectedPackage.vehicle_type === 'CAR' ? seatMin : null,
        seat_max: selectedPackage.vehicle_type === 'CAR' ? seatMax : null,
        price: Number(form.price),
        duration_minutes: form.duration_minutes
          ? Number(form.duration_minutes)
          : null,
        wash_bay_duration_minutes: form.wash_bay_duration_minutes
          ? Number(form.wash_bay_duration_minutes)
          : null,
        care_staff_duration_minutes: form.care_staff_duration_minutes
          ? Number(form.care_staff_duration_minutes)
          : null,
        effective_from: form.effective_from
          ? new Date(form.effective_from).toISOString()
          : undefined,
        effective_to: form.effective_to
          ? new Date(form.effective_to).toISOString()
          : null,
        is_active: editingRule?.is_active ?? true,
        note: form.note.trim() || null,
      }
      return editingRule
        ? updateServicePriceRuleApi(editingRule.id, payload)
        : createServicePriceRuleApi(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'service-price-rules'],
      })
      setFormOpen(false)
      setEditingRule(null)
      setForm(emptyForm)
      showToast('Đã lưu quy tắc giá.', 'success')
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error, 'Không thể lưu quy tắc giá.'), 'error')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateServicePriceRuleApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'service-price-rules'],
      })
      showToast('Đã ngừng áp dụng quy tắc giá.', 'success')
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error, 'Không thể ngừng quy tắc giá.'), 'error')
    },
  })

  const openCreate = () => {
    setEditingRule(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (rule: ServicePriceRule) => {
    setEditingRule(rule)
    setForm(toFormState(rule))
    setFormOpen(true)
  }

  if (rulesQuery.isError || packagesQuery.isError || garagesQuery.isError) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="Không thể tải bảng giá"
        description={getApiErrorMessage(
          rulesQuery.error || packagesQuery.error || garagesQuery.error,
          'Vui lòng thử lại sau.',
        )}
      />
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Bảng giá theo phân loại xe"
        description="Quản lý giá mặc định toàn hệ thống và giá ghi đè theo garage. Quy tắc cụ thể hơn được ưu tiên."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm quy tắc giá
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{rulesQuery.data?.length || 0} quy tắc giá</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Dịch vụ</th>
                <th className="px-5 py-3">Phạm vi</th>
                <th className="px-5 py-3">Phân loại</th>
                <th className="px-5 py-3">Giá</th>
                <th className="px-5 py-3">Hiệu lực</th>
                <th className="px-5 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(rulesQuery.data || []).map((rule) => (
                <tr key={rule.id} className={!rule.is_active ? 'opacity-55' : ''}>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {packageById.get(rule.service_package_id)?.name || rule.service_package_id}
                  </td>
                  <td className="px-5 py-4">
                    {rule.garage_id
                      ? garageById.get(rule.garage_id)?.name || rule.garage_id
                      : 'Toàn hệ thống'}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {[
                      rule.vehicle_type === 'CAR' ? 'Ô tô' : 'Xe máy',
                      rule.engine_type ? engineLabels[rule.engine_type] : 'mọi động cơ',
                      rule.car_body_type ? bodyLabels[rule.car_body_type] : null,
                      rule.motorbike_cc_group === 'UNDER_175CC'
                        ? 'dưới 175cc'
                        : rule.motorbike_cc_group === 'OVER_175CC'
                          ? 'từ 175cc'
                          : null,
                      rule.seat_min ? `${rule.seat_min}-${rule.seat_max} chỗ` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-5 py-4 font-semibold text-brand-700">
                    {formatPrice(rule.price)}
                    {rule.duration_minutes ? (
                      <div className="mt-1 text-xs font-normal text-slate-500">
                        {rule.duration_minutes} phút
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatDateTime(rule.effective_from)}
                    <div className="mt-1 text-xs">
                      {rule.is_active ? `Đang áp dụng · v${rule.version}` : 'Đã ngừng'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </Button>
                      {rule.is_active ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(rule.id)}
                        >
                          <Power className="h-4 w-4" />
                          Ngừng
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRule ? 'Cập nhật quy tắc giá' : 'Thêm quy tắc giá'}
        description="Để trống một thuộc tính nghĩa là quy tắc áp dụng cho mọi giá trị của thuộc tính đó."
        className="max-w-3xl"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div>
            <Label htmlFor="price-package" required>Gói dịch vụ</Label>
            <Select
              id="price-package"
              value={form.service_package_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  service_package_id: event.target.value,
                  motorbike_cc_group: '',
                  car_body_type: '',
                  seat_group: '',
                }))
              }
              required
            >
              <option value="">Chọn gói dịch vụ</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.vehicle_type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="price-garage">Garage</Label>
            <Select
              id="price-garage"
              value={form.garage_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, garage_id: event.target.value }))
              }
            >
              <option value="">Toàn hệ thống</option>
              {garages.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="price-engine">Động cơ</Label>
            <Select
              id="price-engine"
              value={form.engine_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  engine_type: event.target.value as PricingEngineType | '',
                }))
              }
            >
              <option value="">Mọi động cơ</option>
              <option value="GASOLINE">Xăng</option>
              <option value="ELECTRIC">Điện</option>
            </Select>
          </div>
          {selectedPackage?.vehicle_type === 'CAR' ? (
            <>
              <div>
                <Label htmlFor="price-body">Kiểu dáng</Label>
                <Select
                  id="price-body"
                  value={form.car_body_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      car_body_type: event.target.value as PricingCarBodyType | '',
                    }))
                  }
                >
                  <option value="">Mọi kiểu dáng</option>
                  {Object.entries(bodyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="price-seat">Nhóm chỗ ngồi</Label>
                <Select
                  id="price-seat"
                  value={form.seat_group}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      seat_group: event.target.value as RuleFormState['seat_group'],
                    }))
                  }
                >
                  <option value="">Mọi số chỗ</option>
                  <option value="2_5">2-5 chỗ</option>
                  <option value="6_7">6-7 chỗ</option>
                  <option value="8_16">8-16 chỗ</option>
                </Select>
              </div>
            </>
          ) : selectedPackage?.vehicle_type === 'MOTORBIKE' ? (
            <div>
              <Label htmlFor="price-cc">Phân khối</Label>
              <Select
                id="price-cc"
                value={form.motorbike_cc_group}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    motorbike_cc_group:
                      event.target.value as PricingMotorbikeCcGroup | '',
                  }))
                }
              >
                <option value="">Mọi phân khối</option>
                <option value="UNDER_175CC">Dưới 175cc</option>
                <option value="OVER_175CC">Từ 175cc</option>
              </Select>
            </div>
          ) : null}
          <div>
            <Label htmlFor="price-value" required>Giá áp dụng</Label>
            <Input
              id="price-value"
              type="number"
              min={0}
              step={1000}
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="price-duration">Thời lượng ghi đè</Label>
            <Input
              id="price-duration"
              type="number"
              min={1}
              max={1440}
              value={form.duration_minutes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  duration_minutes: event.target.value,
                }))
              }
              placeholder="Để trống để dùng thời lượng gói"
            />
          </div>
          <div>
            <Label htmlFor="price-wash-duration">Thời lượng giữ khoang rửa</Label>
            <Input
              id="price-wash-duration"
              type="number"
              min={0}
              max={1440}
              value={form.wash_bay_duration_minutes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  wash_bay_duration_minutes: event.target.value,
                }))
              }
              placeholder="Để trống để dùng cấu hình gói"
            />
          </div>
          <div>
            <Label htmlFor="price-care-duration">Thời lượng giữ nhân sự chăm sóc</Label>
            <Input
              id="price-care-duration"
              type="number"
              min={0}
              max={1440}
              value={form.care_staff_duration_minutes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  care_staff_duration_minutes: event.target.value,
                }))
              }
              placeholder="Để trống để dùng cấu hình gói"
            />
          </div>
          <div>
            <Label htmlFor="price-effective">Bắt đầu hiệu lực</Label>
            <Input
              id="price-effective"
              type="datetime-local"
              value={form.effective_from}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  effective_from: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="price-effective-to">Kết thúc hiệu lực</Label>
            <Input
              id="price-effective-to"
              type="datetime-local"
              value={form.effective_to}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  effective_to: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="price-note">Ghi chú nghiệp vụ</Label>
            <Input
              id="price-note"
              value={form.note}
              maxLength={500}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu quy tắc'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
