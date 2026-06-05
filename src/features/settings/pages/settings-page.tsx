import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlertCircle, IconServer, IconSettings } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEFAULT_EXECUTION_TARGET_KEY,
  decodeExecutionTargetValue,
  defaultExecutionTarget,
  encodeExecutionTargetValue,
  getDefaultExecutionApiUrl,
  useExecutionTarget,
  useExecutionTargetSetter,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'

const getRuntimeApplicationOptionValue = (runtimeId: string, applicationName: string) =>
  encodeExecutionTargetValue({ runtimeId, applicationName })

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const { target } = useExecutionTarget()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const selectedValue =
    target.type === 'runtime-application'
      ? getRuntimeApplicationOptionValue(target.runtime._id, target.application.name)
      : DEFAULT_EXECUTION_TARGET_KEY
  const selectedDescription =
    target.type === 'runtime-application'
      ? (target.application.description ?? target.runtime.description ?? t('runtime.noDescription'))
      : t('runtime.defaultDescription')
  const effectiveApiUrl =
    target.type === 'runtime-application' ? target.requestTarget.apiUrl : getDefaultExecutionApiUrl()
  const runtimeCount = runtimesQuery.data?.length ?? 0
  const applicationCount = useMemo(
    () => runtimesQuery.data?.reduce((total, runtime) => total + runtime.applications.length, 0) ?? 0,
    [runtimesQuery.data],
  )

  const handleTargetChange = (value: string | null) => {
    if (!value || value === DEFAULT_EXECUTION_TARGET_KEY) {
      setExecutionTarget(null)

      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconSettings />
          <span className="text-sm font-medium">{t('page.eyebrow')}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-normal">{t('page.title')}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('page.description')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('runtime.title')}</CardTitle>
          <CardDescription>{t('runtime.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {runtimesQuery.isError ? (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertTitle>{t('runtime.loadErrorTitle')}</AlertTitle>
              <AlertDescription>{t('runtime.loadErrorDescription')}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="execution-target">{t('runtime.targetLabel')}</FieldLabel>
              <Select value={selectedValue} onValueChange={handleTargetChange}>
                <SelectTrigger id="execution-target" className="w-full">
                  <SelectValue placeholder={t('runtime.targetPlaceholder')}>{target.label}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value={DEFAULT_EXECUTION_TARGET_KEY}>{defaultExecutionTarget.label}</SelectItem>
                  </SelectGroup>

                  {runtimesQuery.data?.map((runtime) => (
                    <SelectGroup key={runtime._id}>
                      <SelectSeparator />
                      <SelectLabel>{runtime.name}</SelectLabel>
                      {runtime.applications.map((application) => {
                        const hasApiUrl = Boolean(application.apiUrl?.trim())

                        return (
                          <SelectItem
                            key={`${runtime._id}-${application.name}`}
                            value={getRuntimeApplicationOptionValue(runtime._id, application.name)}
                            disabled={!hasApiUrl}
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{application.name}</span>
                              {!hasApiUrl ? (
                                <span className="truncate text-xs font-normal text-muted-foreground">
                                  {t('runtime.noApiUrl')}
                                </span>
                              ) : null}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{selectedDescription}</FieldDescription>
            </Field>
          </FieldGroup>

          <div className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t('runtime.currentTarget')}</span>
              <span className="truncate text-sm font-medium">{target.label}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t('runtime.runtime')}</span>
              <span className="truncate text-sm font-medium">
                {target.type === 'runtime-application' ? target.runtime.name : t('runtime.none')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t('runtime.catalog')}</span>
              {runtimesQuery.isLoading ? (
                <Skeleton className="h-5 w-28" />
              ) : (
                <span className="text-sm font-medium">
                  {t('runtime.catalogSummary', { applications: applicationCount, runtimes: runtimeCount })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2">
              <IconServer />
              <span className="text-sm font-medium">{t('runtime.effectiveApiUrl')}</span>
              <Badge variant="secondary">
                {target.type === 'runtime-application' ? t('runtime.selected') : t('runtime.default')}
              </Badge>
            </div>
            <code className="overflow-x-auto rounded-2xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {effectiveApiUrl}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
