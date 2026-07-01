import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ApiSurvey, ApiSurveyQuestion } from '../../../types/api/admin'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

const questionTypes = [
  'RATING',
  'NPS',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'TEXT',
] as const

const questionTypeLabels: Record<(typeof questionTypes)[number], string> = {
  RATING: 'Đánh giá sao (1-5)',
  NPS: 'NPS (0-10)',
  SINGLE_CHOICE: 'Chọn 1',
  MULTI_CHOICE: 'Chọn nhiều',
  TEXT: 'Văn bản',
}

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(3, 'Câu hỏi tối thiểu 3 ký tự'),
  type: z.enum(questionTypes, { message: 'Chọn loại câu hỏi' }),
  is_required: z.boolean().default(true),
  options: z.array(z.string().min(1)).default([]),
  order: z.number().int().min(0).default(0),
})

const surveySchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  description: z.string().nullable().optional(),
  response_window_days: z
    .preprocess(
      (value) => {
        if (value === '' || value === null || value === undefined) {
          return 7
        }
        if (typeof value === 'string') {
          const parsed = Number(value)
          return Number.isFinite(parsed) && parsed > 0 ? parsed : 7
        }
        return value
      },
      z.number().int().min(1).max(365),
    ),
  questions: z.array(questionSchema).min(1, 'Khảo sát cần ít nhất 1 câu hỏi'),
})

export type SurveyFormValues = z.infer<typeof surveySchema>

interface AdminSurveyFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialSurvey?: ApiSurvey
  onClose: () => void
  onSubmit: (values: SurveyFormValues) => Promise<void>
  isSubmitting?: boolean
}

const mapQuestionToForm = (question: ApiSurveyQuestion, index: number) => ({
  id: question.id,
  text: question.text,
  type: (question.type ?? 'TEXT') as (typeof questionTypes)[number],
  is_required: question.is_required ?? true,
  options: question.options ?? [],
  order: question.order ?? index,
})

export function AdminSurveyFormModal({
  open,
  mode,
  initialSurvey,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminSurveyFormModalProps) {
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: '',
      description: '',
      response_window_days: 7,
      questions: [
        {
          text: '',
          type: 'RATING',
          is_required: true,
          options: [],
          order: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      form.reset({
        title: '',
        description: '',
        response_window_days: 7,
        questions: [
          {
            id: undefined,
            text: '',
            type: 'RATING',
            is_required: true,
            options: [],
            order: 0,
          },
        ],
      })
      return
    }

    if (initialSurvey) {
      const questions = initialSurvey.questions?.length
        ? initialSurvey.questions.map(mapQuestionToForm)
        : [
            {
              id: undefined,
              text: '',
              type: 'RATING' as const,
              is_required: true,
              options: [],
              order: 0,
            },
          ]
      form.reset({
        title: initialSurvey.title,
        description: initialSurvey.description ?? '',
        response_window_days: initialSurvey.response_window_days ?? 7,
        questions,
      })
    }
  }, [open, mode, initialSurvey, form])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Tạo khảo sát' : 'Sửa khảo sát'}
      description={
        mode === 'create'
          ? 'Tạo khảo sát mới để gửi cho khách sau dịch vụ.'
          : initialSurvey
            ? `Cập nhật khảo sát "${initialSurvey.title}".`
            : undefined
      }
      className="max-w-3xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div>
          <Label htmlFor="title" required>
            Tiêu đề
          </Label>
          <Input
            id="title"
            placeholder="Khảo sát trải nghiệm rửa xe"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              placeholder="Khảo sát sau dịch vụ rửa xe tháng 6"
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />
          </div>
          <div>
            <Label htmlFor="response_window_days">Số ngày mở</Label>
            <Controller
              control={form.control}
              name="response_window_days"
              render={({ field, fieldState }) => (
                <Input
                  id="response_window_days"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="7"
                  value={String(field.value ?? 7)}
                  onChange={(event) => {
                    const raw = event.target.value
                    if (raw === '') {
                      field.onChange(7)
                      return
                    }
                    const parsed = Number(raw)
                    field.onChange(Number.isFinite(parsed) ? parsed : 7)
                  }}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Câu hỏi</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                append({
                  text: '',
                  type: 'RATING',
                  is_required: true,
                  options: [],
                  order: fields.length,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const questionType = form.watch(`questions.${index}.type`)
              const needsOptions =
                questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE'
              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Câu {index + 1}
                    </p>
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => remove(index)}
                        aria-label="Xóa câu hỏi"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label htmlFor={`questions.${index}.text`} required>
                        Nội dung
                      </Label>
                      <Input
                        id={`questions.${index}.text`}
                        placeholder="Bạn đánh giá trải nghiệm rửa xe như thế nào?"
                        error={form.formState.errors.questions?.[index]?.text?.message}
                        {...form.register(`questions.${index}.text`)}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`questions.${index}.type`}>Loại</Label>
                        <Select
                          id={`questions.${index}.type`}
                          {...form.register(`questions.${index}.type`)}
                        >
                          {questionTypes.map((type) => (
                            <option key={type} value={type}>
                              {questionTypeLabels[type]}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                        <input
                          id={`questions.${index}.is_required`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          {...form.register(`questions.${index}.is_required`)}
                        />
                        <Label
                          htmlFor={`questions.${index}.is_required`}
                          className="mb-0 cursor-pointer"
                        >
                          Bắt buộc trả lời
                        </Label>
                      </div>
                    </div>

                    {needsOptions ? (
                      <OptionEditor
                        form={form}
                        questionIndex={index}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
          {form.formState.errors.questions?.message ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.questions.message}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : mode === 'create' ? (
              'Tạo khảo sát'
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface OptionEditorProps {
  form: ReturnType<typeof useForm<SurveyFormValues>>
  questionIndex: number
}

function OptionEditor({ form, questionIndex }: OptionEditorProps) {
  const optionsField = useFieldArray({
    control: form.control,
    name: `questions.${questionIndex}.options` as const,
  })

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Lựa chọn
      </p>
      <div className="space-y-2">
        {optionsField.fields.map((option, optionIndex) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              placeholder={`Lựa chọn ${optionIndex + 1}`}
              {...form.register(
                `questions.${questionIndex}.options.${optionIndex}` as const,
              )}
            />
            <button
              type="button"
              className="text-slate-400 hover:text-red-500"
              onClick={() => optionsField.remove(optionIndex)}
              aria-label="Xóa lựa chọn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => optionsField.append('')}
      >
        <Plus className="h-4 w-4" />
        Thêm lựa chọn
      </Button>
    </div>
  )
}