import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  const { t } = useTranslation('not-found')
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="max-w-md text-center">
        <CardHeader>
          <p className="text-5xl font-bold">404</p>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <p className="text-muted-foreground">{t('description')}</p>
          <Button render={<a href="/" />} nativeButton={false}>
            {t('button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
