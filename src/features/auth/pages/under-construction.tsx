import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../contexts/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnderConstruction() {
  const [t] = useTranslation('underConstruction')
  const authContext = useContext(AuthContext)
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p>{t('subTitle')}</p>
          <p>{t('last-comment')}</p>
          <Button type="button" onClick={authContext?.logout}>
            {t('button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
