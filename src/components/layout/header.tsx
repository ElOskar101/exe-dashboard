import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { UserCard } from '@/features/auth'
import { useExecutionTarget, useExecutionTargetNavigation } from '@/features/executions'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { IconBrightnessDown, IconMoon, IconSettings } from '@tabler/icons-react'

const Header: () => JSX.Element = () => {
  const { t } = useTranslation()
  const { theme, handleTheme } = useTheme()
  const { target } = useExecutionTarget()
  const { getPathWithExecutionTarget, getSettingsPath } = useExecutionTargetNavigation()
  const targetTitle =
    target.type === 'runtime-application' ? `${target.runtime.name} / ${target.application.name}` : target.label

  return (
    <>
      <header className="z-1 w-full border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger
              className="md:hidden"
              aria-label="Open executions sidebar"
              title="Open executions sidebar"
            />
            <Link to={getPathWithExecutionTarget('/')} className="transition-colors">
              <img className="h-8 w-auto object-cover" src="/agent-icon.svg" alt={t('project-name')} />
            </Link>
          </div>

          <div className="ms-auto flex items-center gap-x-2">
            <Button
              nativeButton={false}
              render={<Link to={getSettingsPath()} />}
              size="sm"
              variant="outline"
              title={targetTitle}
            >
              <IconSettings data-icon="inline-start" />
              <span className="max-w-40 truncate sm:max-w-56">{target.label}</span>
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={handleTheme}>
              {theme === 'light' ? <IconBrightnessDown /> : <IconMoon />}
            </Button>
            <UserCard />
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
