import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useContext, useState, type FocusEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { IconChevronDown, IconLogout2 } from '@tabler/icons-react'
import { AuthContext } from '../contexts/context'

function getInitials(name: string) {
  return (
    name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function UserCard() {
  const { user, logout } = useContext(AuthContext)
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const displayName = user?.fullName?.split(' ').shift() || user?.username || ''
  const username = user?.username || ''
  const userData = user
    ? {
        nameAndUser: [displayName, username].filter(Boolean).join('@'),
        role: user.roles?.[0]?.name ? t(`roles.${user.roles[0].name}`) : '',
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
        className="flex items-center gap-x-2 rounded-3xl px-2 py-1.5 text-left transition-colors hover:bg-muted"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {user ? (
          <>
            <Avatar>
              {user.urlImage && (
                <AvatarImage
                  src={import.meta.env.VITE_PICTURES_URL + '/pictures/' + user.urlImage}
                  alt={user.username || ''}
                />
              )}
              <AvatarFallback>{getInitials(user.username || '')}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-none text-xs">
              {userData?.nameAndUser}
              <span className="text-muted-foreground">{userData?.role}</span>
            </div>
            <IconChevronDown className="size-4 text-muted-foreground" />
          </>
        ) : (
          <>
            <Avatar>
              <AvatarFallback className="animate-pulse">{getInitials('loading...')}</AvatarFallback>
            </Avatar>
            <div className="leading-none">
              <div className="mb-1 h-4 w-20 animate-pulse rounded"></div>
              <div className="h-4 w-24 animate-pulse rounded text-sm"></div>
            </div>
          </>
        )}
      </button>

      {user && isOpen ? (
        <div className="absolute right-0 z-20 mt-2 min-w-56 overflow-hidden rounded-3xl border border-border/70 bg-popover p-2 shadow-lg">
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
