import React, { useContext, useState } from 'react'
import { AuthContext } from '../context/context'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IconLogout2 } from '@tabler/icons-react'

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

  const handleOpen = (to: boolean) => () => setIsOpen(() => to)

  return (
    <>
      <a
        className="flex aling-center gap-x-2 cursor-pointer relative"
        onClick={handleOpen(true)}
        onBlur={handleOpen(false)}
        tabIndex={0}
      >
        {user ? (
          <>
            <Avatar>
              {user.urlImage && (
                <AvatarImage
                  src={
                    import.meta.env.VITE_PICTURES_URL +
                    '/pictures/' +
                    user.urlImage
                  }
                  alt={user.username || ''}
                />
              )}
              <AvatarFallback>
                {getInitials(user.username || '')}
              </AvatarFallback>
            </Avatar>
            <div className="text-md leading-none">
              {userData?.nameAndUser}
              <div className="text-sm">{userData?.role}</div>
            </div>
          </>
        ) : (
          <>
            <Avatar>
              <AvatarFallback className="animate-pulse">
                {getInitials('loading...')}
              </AvatarFallback>
            </Avatar>
            <div className="text-md leading-none">
              <div className="mb-1 h-4 w-20 animate-pulse rounded"></div>
              <div className="h-4 w-24 animate-pulse rounded text-sm"></div>
            </div>
          </>
        )}
        <div
          data-open={isOpen ? 'true' : undefined}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 shadow-lg overflow-hidden
            origin-top-right max-h-0 transition-all duration-150
             data-open:max-h-screen w-full"
        >
          <div>
            <Button
              className="w-full justify-start"
              size="sm"
              variant="outline"
              onClick={logout}
            >
              <IconLogout2 data-icon="inline-start" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </a>
    </>
  )
}

export default UserCard
