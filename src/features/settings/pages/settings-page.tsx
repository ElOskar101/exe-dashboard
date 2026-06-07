import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { IconAlertCircle, IconServer, IconSettings } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

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
  const effectiveApiUrl =
    target.type === 'runtime-application' ? target.requestTarget.apiUrl : getDefaultExecutionApiUrl()

  const handleTargetChange = (value: string | null) => {
    if (!value || value === DEFAULT_EXECUTION_TARGET_KEY) {
      setExecutionTarget(null)

      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconSettings />
            <span className="text-sm font-medium">{t('page.eyebrow')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="runtime-application"
            orientation="vertical"
            className="flex-col gap-6 sm:items-stretch sm:flex-row"
          >
            <TabsList
              variant="line"
              className="w-full shrink-0 items-stretch justify-start rounded-none border-border sm:min-h-full sm:w-56 sm:self-stretch sm:border-r sm:pr-4"
            >
              <TabsTrigger
                value="runtime-application"
                className="after:hidden data-active:font-semibold data-active:text-foreground"
              >
                <IconServer data-icon="inline-start" />
                {t('runtime.sidebarTrigger')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="runtime-application" className="flex min-w-0 flex-col gap-6">
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
                </Field>
              </FieldGroup>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('runtime.effectiveApiUrl')}</span>
                  <IconServer />
                </div>
                <span>{effectiveApiUrl}</span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
