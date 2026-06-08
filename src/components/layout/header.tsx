import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useSidebar } from '@/components/ui/sidebar-context'
import { Skeleton } from '@/components/ui/skeleton'
import { UserCard } from '@/features/auth'
import {
  DEFAULT_EXECUTION_TARGET_KEY,
  decodeExecutionTargetValue,
  defaultExecutionTarget,
  encodeExecutionTargetValue,
  type PlaywrightRuntimeApplication,
  useExecutionAppStatsQuery,
  useExecutionTarget,
  useExecutionTargetNavigation,
  useExecutionTargetSetter,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import { useTheme } from '@/hooks/use-theme'
import {
  IconDeviceDesktop,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconServer,
} from '@tabler/icons-react'

const getRuntimeApplicationOptionValue = (runtimeId: string, applicationName: string) =>
  encodeExecutionTargetValue({ runtimeId, applicationName })

const isApplicationSelectable = (application: PlaywrightRuntimeApplication) =>
  application.active !== false && Boolean(application.apiUrl?.trim())

const Header: () => JSX.Element = () => {
  const { t } = useTranslation()
  const { theme, handleTheme } = useTheme()
  const { isMobile, state, toggleSidebar } = useSidebar()
  const { isResolving, target } = useExecutionTarget()
  const { getPathWithExecutionTarget, getSettingsPath } = useExecutionTargetNavigation()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const appStatsQuery = useExecutionAppStatsQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const targetTitle =
    target.type === 'runtime-application' ? `${target.runtime.name} / ${target.application.name}` : target.label
  const selectedValue =
    target.type === 'runtime-application'
      ? getRuntimeApplicationOptionValue(target.runtime._id, target.application.name)
      : DEFAULT_EXECUTION_TARGET_KEY
  const serverStatus = appStatsQuery.data?.server.status.toLowerCase()
  const isServerUp = serverStatus === 'up'
  const isLoadingStats = isResolving || appStatsQuery.isLoading
  const sidebarButtonLabel = isMobile
    ? 'Open executions sidebar'
    : state === 'expanded'
      ? 'Minimize executions sidebar'
      : 'Expand executions sidebar'

  const handleTargetChange = (value: string | null) => {
    if (!value || value === DEFAULT_EXECUTION_TARGET_KEY) {
      setExecutionTarget(null)

      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <>
      <header className="z-1 w-full border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={sidebarButtonLabel}
              title={sidebarButtonLabel}
              onClick={toggleSidebar}
            >
              {state === 'expanded' && !isMobile ? <IconLayoutSidebarLeftCollapse /> : <IconLayoutSidebarLeftExpand />}
            </Button>
            <Link to={getPathWithExecutionTarget('/')} className="transition-colors">
              <img className="h-8 w-auto object-cover" src="/agent-icon.svg" alt={t('project-name')} />
            </Link>
            <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
              {isLoadingStats ? (
                <>
                  <Skeleton className="h-6 w-20 rounded-3xl" />
                  <Skeleton className="h-6 w-16 rounded-3xl" />
                  <Skeleton className="h-6 w-14 rounded-3xl" />
                </>
              ) : (
                <>
                  <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                    <IconServer data-icon="inline-start" />
                    <span>Server</span>
                    <span
                      aria-label={isServerUp ? 'Server up' : 'Server unavailable'}
                      className={isServerUp ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-muted'}
                      title={appStatsQuery.data?.server.status ?? 'Unknown'}
                    />
                  </Badge>
                  <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                    <span>{appStatsQuery.data?.jobs.active ?? '-'}</span>
                    <span>Active</span>
                  </Badge>
                  <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                    <span>{appStatsQuery.data?.jobs.running ?? '-'}</span>
                    <span title="Running jobs">Run</span>
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="ms-auto flex min-w-0 items-center gap-x-2">
            <Select value={selectedValue} onValueChange={handleTargetChange}>
              <SelectTrigger
                size="sm"
                className="max-w-44 border-border bg-transparent sm:max-w-64"
                title={targetTitle}
                aria-label="Choose app target"
              >
                <IconDeviceDesktop className="size-4" />
                <SelectValue placeholder="Choose app">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{target.label}</span>
                    {target.type === 'runtime-application' ? (
                      <span className="truncate text-xs font-normal text-muted-foreground">{target.runtime.name}</span>
                    ) : null}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value={DEFAULT_EXECUTION_TARGET_KEY}>{defaultExecutionTarget.label}</SelectItem>
                </SelectGroup>

                {runtimesQuery.data?.map((runtime) => (
                  <SelectGroup key={runtime._id}>
                    <SelectSeparator />
                    <SelectLabel>{runtime.name}</SelectLabel>
                    {runtime.applications.map((application) => (
                      <SelectItem
                        key={`${runtime._id}-${application.name}`}
                        value={getRuntimeApplicationOptionValue(runtime._id, application.name)}
                        disabled={!isApplicationSelectable(application)}
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate">{application.name}</span>
                          {application.active === false ? (
                            <span className="truncate text-xs font-normal text-muted-foreground">Inactive</span>
                          ) : null}
                          {!application.apiUrl?.trim() ? (
                            <span className="truncate text-xs font-normal text-muted-foreground">
                              No API URL configured
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <UserCard theme={theme} settingsPath={getSettingsPath()} onToggleTheme={handleTheme} />
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
