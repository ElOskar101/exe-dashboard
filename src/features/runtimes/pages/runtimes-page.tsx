import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import { AuthContext } from '@/features/auth'
import {
  IconAlertCircle,
  IconBox,
  IconDeviceDesktop,
  IconDotsVertical,
  IconEye,
  IconRefresh,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { AccessBadge, CreatorBadge } from '../components/runtime-badges'
import { AppDetailsDialog } from '../components/app-details-dialog'
import { CreateRuntimeDialog } from '../components/create-runtime-dialog'
import { RuntimeDetailsDialog } from '../components/runtime-details-dialog'
import { CreateRuntimeApplicationDialog } from '../components/create-runtime-application-dialog'
import { DeleteAppConfirmation } from '../components/delete-app-confirmation'
import { DeleteRuntimeConfirmation } from '../components/delete-runtime-confirmation'
import { getPlaywrightRuntimeCreatorLabel, isPlaywrightRuntimeOwner } from '../components/runtime-dialog-helpers'
import { UpdateAppDialog } from '../components/update-app-dialog'
import { UpdateRuntimeDialog } from '../components/update-runtime-dialog'

const DESCRIPTION_PREVIEW_LENGTH = 20
const API_URL_PREVIEW_LENGTH = DESCRIPTION_PREVIEW_LENGTH * 2

function RuntimesPageSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-xl rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-4xl" />
    </div>
  )
}

export function RuntimesPage() {
  const { t } = useTranslation('runtimes')
  const { user } = useContext(AuthContext)
  const runtimesQuery = usePlaywrightRuntimesQuery()

  if (runtimesQuery.isLoading) {
    return <RuntimesPageSkeleton />
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">{t('page.title')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{t('page.description')}</p>
        </div>
        <CreateRuntimeDialog />
      </div>

      {runtimesQuery.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('loadErrorDescription')}</AlertDescription>
          <Button
            className="mt-3 w-fit"
            size="sm"
            variant="outline"
            onClick={() => {
              void runtimesQuery.refetch()
            }}
          >
            <IconRefresh data-icon="inline-start" />
            {t('retry')}
          </Button>
        </Alert>
      ) : null}

      {!runtimesQuery.isError ? (
        <>
          {runtimesQuery.data?.length ? (
            <div className="flex flex-col gap-4">
              {runtimesQuery.data.map((runtime) => (
                <RuntimeCatalogCard
                  key={runtime._id}
                  canMutate={isPlaywrightRuntimeOwner(runtime, user?._id)}
                  runtime={runtime}
                />
              ))}
            </div>
          ) : (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t('empty.title')}</CardTitle>
                <CardDescription>{t('empty.description')}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

function RuntimeCatalogCard({ canMutate, runtime }: { canMutate: boolean; runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const applications = getPlaywrightRuntimeApplications(runtime)

  return (
    <Card size="default">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <IconDeviceDesktop className="shrink-0" />
              <CardTitle>
                <RuntimeDetailsDialog runtime={runtime}>
                  <DialogTrigger
                    render={<Button type="button" variant="link" className="h-auto p-0 text-foreground" />}
                  >
                    {runtime.name}
                  </DialogTrigger>
                </RuntimeDetailsDialog>
              </CardTitle>
              <AccessBadge type={runtime.accessInfo.type} />
              <CreatorBadge creator={runtime.accessInfo.createdBy} />
            </div>
            <CardDescription>{runtime.description?.trim() || t('noDescription')}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canMutate ? <CreateRuntimeApplicationDialog runtime={runtime} /> : null}
            <RuntimeActionsMenu canMutate={canMutate} runtime={runtime} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.application')}</TableHead>
              <TableHead>{t('columns.apiUrl')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.environment')}</TableHead>
              <TableHead>{t('columns.access')}</TableHead>
              <TableHead>{t('columns.creator')}</TableHead>
              {canMutate ? <TableHead className="w-12 text-right">{t('columns.actions')}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody className="text-foreground/80 dark:text-white/80">
            {applications.length > 0 ? (
              applications.map((application) => (
                <TableRow key={`${runtime._id}-${application.name}`}>
                  <TableCell className="whitespace-normal break-words">
                    <span className="flex min-w-0 items-center gap-2">
                      <IconBox className="size-4 shrink-0 text-muted-foreground" />
                      <AppDetailsDialog runtime={runtime} application={application}>
                        <DialogTrigger
                          render={
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-inherit hover:text-foreground dark:hover:text-white"
                            />
                          }
                        >
                          {application.name}
                        </DialogTrigger>
                      </AppDetailsDialog>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal break-all">
                    <TruncatedText value={application.apiUrl} previewLength={API_URL_PREVIEW_LENGTH} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={application.active === false ? 'text-destructive' : 'text-success'}
                      >
                        {application.active === false ? t('status.inactive') : t('status.active')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.nonProduction ? t('environment.development') : t('environment.production')}
                  </TableCell>
                  <TableCell>
                    <AccessBadge type={application.accessInfo.type} />
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {getPlaywrightRuntimeCreatorLabel(application.accessInfo.createdBy) ?? t('creator.unknown')}
                  </TableCell>
                  {canMutate ? (
                    <TableCell className="whitespace-nowrap text-right">
                      <AppActionsMenu application={application} runtime={runtime} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={canMutate ? 7 : 6}>
                  {t('runtimeSummary.emptyApplications')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RuntimeActionsMenu({ canMutate, runtime }: { canMutate: boolean; runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t('runtimeActions.trigger', { runtime: runtime.name })}
          />
        }
      >
        <IconDotsVertical />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 gap-1 rounded-3xl p-1.5">
        <RuntimeDetailsDialog runtime={runtime}>
          <DialogTrigger
            render={<Button type="button" variant="ghost" className="w-full justify-start rounded-2xl px-2.5" />}
          >
            <IconEye data-icon="inline-start" />
            {t('runtimeDetails.trigger')}
          </DialogTrigger>
        </RuntimeDetailsDialog>
        {canMutate ? (
          <>
            <UpdateRuntimeDialog runtime={runtime} triggerVariant="menu-item" />
            <DeleteRuntimeConfirmation runtime={runtime} triggerVariant="menu-item" />
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

function AppActionsMenu({
  application,
  runtime,
}: {
  application: PlaywrightRuntimeApplication
  runtime: PlaywrightRuntime
}) {
  const { t } = useTranslation('runtimes')

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t('appActions.trigger', { app: application.name })}
            className="ml-auto"
          />
        }
      >
        <IconDotsVertical />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 gap-1 rounded-3xl p-1.5">
        <AppDetailsDialog runtime={runtime} application={application}>
          <DialogTrigger
            render={<Button type="button" variant="ghost" className="w-full justify-start rounded-2xl px-2.5" />}
          >
            <IconEye data-icon="inline-start" />
            {t('appDetails.trigger')}
          </DialogTrigger>
        </AppDetailsDialog>
        <UpdateAppDialog application={application} runtime={runtime} triggerVariant="menu-item" />
        <DeleteAppConfirmation application={application} runtime={runtime} triggerVariant="menu-item" />
      </PopoverContent>
    </Popover>
  )
}

function TruncatedText({
  previewLength = DESCRIPTION_PREVIEW_LENGTH,
  value,
}: {
  previewLength?: number
  value: string | undefined
}) {
  const { t } = useTranslation('runtimes')
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return '-'
  }

  if (trimmedValue.length <= previewLength) {
    return trimmedValue
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="truncate">{trimmedValue.slice(0, previewLength)}</span>
      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="link" className="h-auto px-0 py-0 text-muted-foreground">
              {t('descriptionMore')}
            </Button>
          }
        />
        <PopoverContent align="end" className="max-w-96 whitespace-normal break-words">
          {trimmedValue}
        </PopoverContent>
      </Popover>
    </span>
  )
}
