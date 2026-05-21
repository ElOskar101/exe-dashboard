import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/auth-context/context'
import { useTranslation } from 'react-i18next'
import { Avatar } from '../components/avatar'
import Button from '../components/button'
import TablerIcons from '../components/tabler-icons'

function UserCard() {
  const { user, logout } = useContext(AuthContext)
  const { t } = useTranslation()
  const [userData, setUserData] = useState<{
    nameAndUser: string
    role: string
  }>({
    nameAndUser: '',
    role: '',
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user)
      setUserData({
        nameAndUser: `${user.fullName.split(' ').shift()}@${user.username}`,
        role: t(`roles.${user.roles[0].name}`),
      })
  }, [user])

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
            <Avatar
              src={
                user.urlImage
                  ? import.meta.env.VITE_PICTURES_URL +
                    '/pictures/' +
                    user.urlImage
                  : ''
              }
              name={user.username || ''}
            />
            <div className="text-md leading-none">
              {userData?.nameAndUser}
              <div className="text-sm">{userData?.role}</div>
            </div>
          </>
        ) : (
          <>
            <Avatar src="" name={'loading...'} className="wave" />
            <div className="text-md leading-none">
              <div className="w-20 h-4 wave mb-1"></div>
              <div className="w-24 h-4 text-sm wave"></div>
            </div>
          </>
        )}
        <div
          data-open={isOpen ? 'true' : undefined}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 shadow-lg overflow-hidden
            origin-top-right max-h-0 transition-all duration-150
             data-open:max-h-screen w-full"
        >
          <div className="bg-[var(--primary-50)]">
            <Button
              className="flex items-center gap-x-1 w-full justify-start border-transparent"
              size="sm"
              variant="outline"
              onClick={logout}
            >
              <TablerIcons icon="IconLogout2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </a>
    </>
  )
}

export default UserCard
