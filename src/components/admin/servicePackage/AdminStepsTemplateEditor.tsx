import { GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import {
  SERVICE_STEP_TYPE_LABELS,
  SERVICE_STEP_TYPES,
} from '../../../constants/serviceStep'
import { STAFF_TYPE_LABELS, STAFF_TYPES } from '../../../constants/staffType'
import { adminServicePackageStepsSchema } from '../../../lib/validations/adminServicePackageSteps'
import type { ServiceStepTemplate } from '../../../types/servicePackage'
import {
  cloneStepsTemplate,
  createBlankStepTemplate,
  normalizeStepOrders,
  reorderStepsTemplate,
} from '../../../utils/adminServicePackageSteps'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

interface AdminStepsTemplateEditorProps {
  packageSlug: string
  initialSteps: ServiceStepTemplate[]
  onSave: (steps: ServiceStepTemplate[]) => Promise<void>
  isSubmitting?: boolean
}

export function AdminStepsTemplateEditor({
  packageSlug,
  initialSteps,
  onSave,
  isSubmitting = false,
}: AdminStepsTemplateEditorProps) {
  const [steps, setSteps] = useState(() => normalizeStepOrders(cloneStepsTemplate(initialSteps)))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const updateStep = (index: number, patch: Partial<ServiceStepTemplate>) => {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)),
    )
  }

  const updateInstruction = (stepIndex: number, instructionIndex: number, value: string) => {
    setSteps((current) =>
      current.map((step, index) => {
        if (index !== stepIndex) return step
        const instructions = [...step.instructions]
        instructions[instructionIndex] = value
        return { ...step, instructions }
      }),
    )
  }

  const addInstruction = (stepIndex: number) => {
    setSteps((current) =>
      current.map((step, index) =>
        index === stepIndex ? { ...step, instructions: [...step.instructions, ''] } : step,
      ),
    )
  }

  const removeInstruction = (stepIndex: number, instructionIndex: number) => {
    setSteps((current) =>
      current.map((step, index) => {
        if (index !== stepIndex) return step
        if (step.instructions.length <= 1) return step
        return {
          ...step,
          instructions: step.instructions.filter((_, itemIndex) => itemIndex !== instructionIndex),
        }
      }),
    )
  }

  const addStep = () => {
    setSteps((current) => [
      ...current,
      createBlankStepTemplate(packageSlug, current.length),
    ])
  }

  const confirmDeleteStep = () => {
    if (deleteIndex === null) return
    setSteps((current) => normalizeStepOrders(current.filter((_, index) => index !== deleteIndex)))
    setDeleteIndex(null)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDropIndex(index)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    if (draggedIndex === null) return
    setSteps((current) => reorderStepsTemplate(current, draggedIndex, index))
    setDraggedIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropIndex(null)
  }

  const handleSubmit = async () => {
    const sanitized = normalizeStepOrders(
      steps.map((step) => ({
        ...step,
        step_code: step.step_code.trim(),
        step_name: step.step_name.trim(),
        instructions: step.instructions.map((item) => item.trim()),
      })),
    )

    const parsed = adminServicePackageStepsSchema.safeParse({ steps: sanitized })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dữ liệu steps không hợp lệ.')
      return
    }

    setFormError(null)
    await onSave(
      parsed.data.steps.map((step) => ({
        ...step,
        instructions: step.instructions.filter(Boolean),
      })),
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Kéo thả để đổi thứ tự bước. Mỗi bước cần mã, tên, loại, vai trò và ít nhất một hướng dẫn.
      </p>

      {formError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={`${step.step_code}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={(event) => handleDrop(event, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'rounded-2xl border bg-white p-4 shadow-sm transition',
              draggedIndex === index && 'opacity-60',
              dropIndex === index && draggedIndex !== index
                ? 'border-brand-400 ring-2 ring-brand-100'
                : 'border-slate-200/80',
            )}
          >
            <div className="mb-4 flex items-start gap-3">
              <button
                type="button"
                className="mt-1 cursor-grab rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                aria-label={`Kéo để sắp xếp bước ${index + 1}`}
              >
                <GripVertical className="h-5 w-5" />
              </button>

              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    Bước {index + 1}
                  </span>
                  <span className="font-mono text-xs text-slate-400">order: {index + 1}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`step-name-${index}`}>Tên bước</Label>
                    <Input
                      id={`step-name-${index}`}
                      value={step.step_name}
                      onChange={(event) => updateStep(index, { step_name: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`step-code-${index}`}>Mã bước (step_code)</Label>
                    <Input
                      id={`step-code-${index}`}
                      value={step.step_code}
                      onChange={(event) => updateStep(index, { step_code: event.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`step-type-${index}`}>Loại bước</Label>
                    <Select
                      id={`step-type-${index}`}
                      value={step.step_type}
                      onChange={(event) =>
                        updateStep(index, {
                          step_type: event.target.value as ServiceStepTemplate['step_type'],
                        })
                      }
                    >
                      {SERVICE_STEP_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {SERVICE_STEP_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`step-staff-${index}`}>Vai trò hiển thị</Label>
                    <Select
                      id={`step-staff-${index}`}
                      value={step.display_staff_type}
                      onChange={(event) =>
                        updateStep(index, { display_staff_type: event.target.value })
                      }
                    >
                      {STAFF_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {STAFF_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={step.is_required}
                    onChange={(event) => updateStep(index, { is_required: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Bước bắt buộc</span>
                </label>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label>Hướng dẫn thực hiện</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addInstruction(index)}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm dòng
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {step.instructions.map((instruction, instructionIndex) => (
                      <div key={instructionIndex} className="flex items-start gap-2">
                        <Input
                          value={instruction}
                          placeholder={`Hướng dẫn ${instructionIndex + 1}`}
                          onChange={(event) =>
                            updateInstruction(index, instructionIndex, event.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={step.instructions.length <= 1}
                          onClick={() => removeInstruction(index, instructionIndex)}
                          aria-label="Xóa hướng dẫn"
                        >
                          <Trash2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={steps.length <= 1}
                onClick={() => setDeleteIndex(index)}
                aria-label={`Xóa bước ${index + 1}`}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={addStep}>
          <Plus className="h-4 w-4" />
          Thêm bước
        </Button>

        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu steps template'
          )}
        </Button>
      </div>

      <Modal
        open={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        title="Xóa bước thực hiện?"
        description={
          deleteIndex !== null
            ? `Bước "${steps[deleteIndex]?.step_name}" sẽ bị xóa khỏi template.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteIndex(null)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeleteStep}>
            Xóa bước
          </Button>
        </div>
      </Modal>
    </div>
  )
}
