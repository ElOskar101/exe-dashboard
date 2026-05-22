import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { user } = useContext(AuthContext)
  const { t } = useTranslation()
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

  return (
    <>
      <button
        className="flex items-center gap-x-2 cursor-pointer relative"
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
            <div className="leading-none text-xs flex flex-col">
              {userData?.nameAndUser}
              <span className="text-muted-foreground">{userData?.role}</span>
            </div>
          </>
        ) : (
          <>
            <Avatar>
              <AvatarFallback className="animate-pulse">
                {getInitials('loading...')}
              </AvatarFallback>
            </Avatar>
            <div className="leading-none">
              <div className="mb-1 h-4 w-20 animate-pulse rounded"></div>
              <div className="h-4 w-24 animate-pulse rounded text-sm"></div>
            </div>
          </>
        )}
      </button>
    </>
  )
}

export default UserCard
