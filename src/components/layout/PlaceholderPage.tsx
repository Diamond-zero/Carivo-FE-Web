import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-slate-500">
            Trang này sẽ được triển khai ở commit tiếp theo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
