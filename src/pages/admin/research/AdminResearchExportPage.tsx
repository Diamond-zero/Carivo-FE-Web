import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type { ResearchExportDataset } from '../../../types/survey'
import {
  downloadResearchExport,
  getResearchExportLabel,
  type ResearchExportFormat,
} from '../../../utils/researchExport'

const datasets: ResearchExportDataset[] = [
  'bookings',
  'customers',
  'loyalty',
  'audit_logs',
]

const datasetDescriptions: Record<ResearchExportDataset, string> = {
  bookings: '50 booking toàn hệ thống — trạng thái, giá, garage.',
  customers: '20 khách hàng — thông tin cơ bản và loyalty.',
  loyalty: 'Điểm tích lũy, hạng và lịch sử chi tiêu khách.',
  audit_logs: '100 audit log thao tác admin/staff.',
}

export function AdminResearchExportPage() {
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(260)
  const [format, setFormat] = useState<ResearchExportFormat>('json')
  const [exportingDataset, setExportingDataset] = useState<ResearchExportDataset | null>(
    null,
  )

  const handleExport = async (dataset: ResearchExportDataset) => {
    setExportingDataset(dataset)
    await new Promise((resolve) => setTimeout(resolve, 400))

    try {
      const result = downloadResearchExport(dataset, format)
      showToast(
        `Đã tải ${result.filename} (${result.rowCount} dòng, mock).`,
        'success',
      )
    } finally {
      setExportingDataset(null)
    }
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Research Export"
            description="Xuất dữ liệu nghiên cứu phục vụ khảo sát và báo cáo — tải file mock JSON/CSV."
          />

          <Card className="mb-6 max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Định dạng xuất</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="export-format">File format</Label>
              <Select
                id="export-format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as ResearchExportFormat)
                }
              >
                <option value="json">JSON (.json)</option>
                <option value="csv">CSV (.csv)</option>
              </Select>
              <p className="mt-3 text-sm text-slate-500">
                Dữ liệu lấy từ mock Admin hiện tại — không gọi API backend.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {datasets.map((dataset) => (
              <Card key={dataset}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {format === 'json' ? (
                        <FileJson className="h-4 w-4 text-brand-600" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 text-brand-600" />
                      )}
                      {getResearchExportLabel(dataset)}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {datasetDescriptions[dataset]}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExport(dataset)}
                    disabled={exportingDataset !== null}
                  >
                    {exportingDataset === dataset ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xuất...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Tải {format.toUpperCase()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
