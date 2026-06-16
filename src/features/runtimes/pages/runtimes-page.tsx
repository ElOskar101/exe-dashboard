import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import { AuthContext } from '@/features/auth'
import {
  IconAlertCircle,
  IconBox,
  IconDeviceDesktop,
  IconRefresh,
  IconShieldCheck,
  IconShieldLock,
  IconUserCircle,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { CreateRuntimeDialog } from '../components/create-runtime-dialog'
import { CreateRuntimeApplicationDialog } from '../components/create-runtime-application-dialog'
import { DeleteAppConfirmation } from '../components/delete-app-confirmation'
import { DeleteRuntimeConfirmation } from '../components/delete-runtime-confirmation'
import {
  getConfiguredApplicationLimit,
  getPlaywrightRuntimeCreatorLabel,
  isPlaywrightRuntimeOwner,
} from '../components/runtime-dialog-helpers'
import { UpdateAppDialog } from '../components/update-app-dialog'
import { UpdateRuntimeDialog } from '../components/update-runtime-dialog'

const DESCRIPTION_PREVIEW_LENGTH = 20

function AccessBadge({ type }: { type: PlaywrightRuntime['accessInfo']['type'] }) {
  const { t } = useTranslation('runtimes')
  const AccessIcon = type === 'public' ? IconShieldCheck : IconShieldLock

  return (
    <Badge variant="outline" className="gap-1.5">
      <AccessIcon data-icon="inline-start" />
      {t(`access.${type}`)}
    </Badge>
  )
}

function CreatorBadge({ creator }: { creator: PlaywrightRuntime['accessInfo']['createdBy'] }) {
  const { t } = useTranslation('runtimes')
  const creatorLabel = getPlaywrightRuntimeCreatorLabel(creator)

  return (
    <Badge variant="outline" className="max-w-full gap-1.5">
      <IconUserCircle data-icon="inline-start" />
      <span className="min-w-0 truncate">{creatorLabel ?? t('creator.unknown')}</span>
    </Badge>
  )
}

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
              <CardTitle>{runtime.name}</CardTitle>
              <AccessBadge type={runtime.accessInfo.type} />
              <CreatorBadge creator={runtime.accessInfo.createdBy} />
            </div>
            <CardDescription>{runtime.description?.trim() || t('noDescription')}</CardDescription>
          </div>
          {canMutate ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <UpdateRuntimeDialog runtime={runtime} />
              <DeleteRuntimeConfirmation runtime={runtime} />
              <CreateRuntimeApplicationDialog runtime={runtime} />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.application')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.environment')}</TableHead>
              <TableHead>{t('columns.access')}</TableHead>
              <TableHead>{t('columns.creator')}</TableHead>
              <TableHead>{t('columns.config')}</TableHead>
              <TableHead>{t('columns.apiUrl')}</TableHead>
              <TableHead>{t('columns.description')}</TableHead>
              {canMutate ? <TableHead className="w-24">{t('columns.actions')}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <TableRow key={`${runtime._id}-${application.name}`}>
                  <TableCell className="whitespace-normal break-words text-white/80">
                    <span className="flex min-w-0 items-center gap-2">
                      <IconBox className="size-4 shrink-0 text-muted-foreground" />
                      <span>{application.name}</span>
                    </span>
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
                  <TableCell className="text-white/80">
                    {application.nonProduction ? t('environment.development') : t('environment.production')}
                  </TableCell>
                  <TableCell>
                    <AccessBadge type={application.accessInfo.type} />
                  </TableCell>
                  <TableCell className="whitespace-normal break-words text-white/80">
                    {getPlaywrightRuntimeCreatorLabel(application.accessInfo.createdBy) ?? t('creator.unknown')}
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-4 text-xs text-white/80">
                      <li>
                        {t('config.maxWorkers', {
                          count: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
                        })}
                      </li>
                      <li>
                        {t('config.maxRetries', {
                          count: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
                        })}
                      </li>
                    </ul>
                  </TableCell>
                  <TableCell className="whitespace-normal break-all text-white/80">
                    <TruncatedText value={application.apiUrl} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-white/80">
                    <TruncatedText value={application.description} />
                  </TableCell>
                  {canMutate ? (
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-nowrap items-center gap-2">
                        <UpdateAppDialog application={application} runtime={runtime} />
                        <DeleteAppConfirmation application={application} runtime={runtime} />
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-white/80" colSpan={canMutate ? 9 : 8}>
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

function TruncatedText({ value }: { value: string | undefined }) {
  const { t } = useTranslation('runtimes')
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return '-'
  }

  if (trimmedValue.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return trimmedValue
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="truncate">{trimmedValue.slice(0, DESCRIPTION_PREVIEW_LENGTH)}</span>
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
