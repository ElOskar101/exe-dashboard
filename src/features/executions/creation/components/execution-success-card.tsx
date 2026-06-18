import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatExecutionDateTime, type Execution } from '@/features/executions/shared'
import { IconCheck, IconRefresh, IconRocket } from '@tabler/icons-react'

interface ExecutionSuccessCardProps {
  execution: Execution
  onReset: () => void
  t: TFunction<'executions'>
}

export function ExecutionSuccessCard({ execution, onReset, t }: ExecutionSuccessCardProps) {
  return (
    <Card className="mx-auto my-6 w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCheck />
          {t('success.title')}
        </CardTitle>
        <CardDescription>{t('success.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Alert>
          <IconRocket />
          <AlertTitle>{t('success.alertTitle')}</AlertTitle>
          <AlertDescription>{t('success.alertDescription')}</AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('success.executionId')}</p>
            <p className="mt-1 break-all text-base font-medium">{execution._id}</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('success.status')}</p>
            <p className="mt-1 text-base font-medium capitalize">{execution.status}</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{t('success.createdAt')}</p>
            <p className="mt-1 text-base font-medium">{formatExecutionDateTime(execution.createdAt)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border">
        <Button onClick={onReset} className="w-full sm:w-auto">
          <IconRefresh data-icon="inline-start" />
          {t('buttons.startOver')}
        </Button>
      </CardFooter>
    </Card>
  )
}
