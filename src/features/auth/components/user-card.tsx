import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/app.config'
import { useContext, useState, type FocusEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  IconBrightnessDown,
  IconChevronDown,
  IconLogout2,
  IconMoon,
  IconServer,
  IconSettings,
} from '@tabler/icons-react'
import { AuthContext } from '../contexts/context'

const roleTranslationKeys = {
  QA: 'roles.QA',
  admin: 'roles.admin',
  carrier: 'roles.carrier',
  client: 'roles.client',
  guest: 'roles.guest',
  none: 'roles.none',
  standard: 'roles.standard',
} as const

interface UserCardProps {
  onToggleTheme?: () => void
  runtimesPath?: string
  settingsPath?: string
  theme?: 'light' | 'dark'
}

function getInitials(name: string) {
  return (
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function UserCard({ onToggleTheme, runtimesPath, settingsPath, theme }: UserCardProps) {
  const { user, logout } = useContext(AuthContext)
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const displayName = user?.fullName?.split(' ').shift() || user?.username || ''
  const username = user?.username || ''
  const userData = user
    ? {
        nameAndUser: [displayName, username].filter(Boolean).join('@'),
        role: user.roles?.[0]?.name
          ? t(roleTranslationKeys[user.roles[0].name as keyof typeof roleTranslationKeys] ?? 'roles.none')
          : '',
      }
    : {
        nameAndUser: '',
        role: '',
      }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" onBlurCapture={handleBlur}>
      <button
        type="button"
        className="flex items-center gap-x-2 rounded-full p-1 text-left transition-colors hover:bg-muted sm:rounded-3xl sm:px-2 sm:py-1.5"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {user ? (
          <>
            <Avatar>
              {user.urlImage && (
                <AvatarImage src={APP_CONFIG.cccApiUrl + '/pictures/' + user.urlImage} alt={user.username || ''} />
              )}
              <AvatarFallback>{getInitials(user.username || '')}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col leading-none text-xs sm:flex">
              {userData?.nameAndUser}
              <span className="text-muted-foreground">{userData?.role}</span>
            </div>
            <IconChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </>
        ) : (
          <>
            <Avatar>
              <AvatarFallback className="animate-pulse">{getInitials('loading...')}</AvatarFallback>
            </Avatar>
            <div className="hidden leading-none sm:block">
              <div className="mb-1 h-4 w-20 animate-pulse rounded"></div>
              <div className="h-4 w-24 animate-pulse rounded text-sm"></div>
            </div>
          </>
        )}
      </button>

      {user && isOpen ? (
        <div className="absolute right-0 z-20 mt-2 min-w-56 overflow-hidden rounded-3xl border border-border/70 bg-popover p-2 shadow-lg">
          {settingsPath ? (
            <Button
              nativeButton={false}
              render={<Link to={settingsPath} />}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsOpen(false)}
            >
              <IconSettings data-icon="inline-start" />
              {t('settings')}
            </Button>
          ) : null}
          {runtimesPath ? (
            <Button
              nativeButton={false}
              render={<Link to={runtimesPath} />}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsOpen(false)}
            >
              <IconServer data-icon="inline-start" />
              {t('runtimes')}
            </Button>
          ) : null}
          {onToggleTheme && theme ? (
            <Button type="button" variant="ghost" className="w-full justify-start" onClick={onToggleTheme}>
              {theme === 'light' ? (
                <IconBrightnessDown data-icon="inline-start" />
              ) : (
                <IconMoon data-icon="inline-start" />
              )}
              {theme === 'light' ? t('lightMode') : t('darkMode')}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" className="w-full justify-start" onClick={logout}>
            <IconLogout2 data-icon="inline-start" />
            {t('logout')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default UserCard
