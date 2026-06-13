import type { ServiceStepTemplate } from '../types/servicePackage'

export function cloneStepsTemplate(steps: ServiceStepTemplate[]): ServiceStepTemplate[] {
  return steps.map((step) => ({
    ...step,
    instructions: [...step.instructions],
  }))
}

export function normalizeStepOrders(steps: ServiceStepTemplate[]): ServiceStepTemplate[] {
  return steps.map((step, index) => ({
    ...step,
    order: index + 1,
  }))
}

export function reorderStepsTemplate(
  steps: ServiceStepTemplate[],
  fromIndex: number,
  toIndex: number,
): ServiceStepTemplate[] {
  if (fromIndex === toIndex) return steps

  const next = cloneStepsTemplate(steps)
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return normalizeStepOrders(next)
}

export function createBlankStepTemplate(packageSlug: string, index: number): ServiceStepTemplate {
  const suffix = `${Date.now()}-${index}`
  return {
    step_code: `${packageSlug}-step-${suffix}`,
    step_name: `Bước ${index + 1}`,
    order: index + 1,
    step_type: 'MANUAL_SERVICE_STEP',
    is_required: true,
    display_staff_type: 'VEHICLE_CARE_STAFF',
    instructions: [''],
  }
}

export function sanitizeStepsTemplate(steps: ServiceStepTemplate[]): ServiceStepTemplate[] {
  return normalizeStepOrders(
    steps.map((step) => ({
      ...step,
      step_code: step.step_code.trim(),
      step_name: step.step_name.trim(),
      instructions: step.instructions.map((item) => item.trim()).filter(Boolean),
    })),
  )
}
