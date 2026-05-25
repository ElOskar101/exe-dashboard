import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'

interface ExecutionSubmitErrorAlertProps {
  message: string
  t: TFunction<'executions'>
}

export function ExecutionSubmitErrorAlert({ message, t }: ExecutionSubmitErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <IconAlertCircle />
      <AlertTitle>{t('submit.errorTitle')}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
