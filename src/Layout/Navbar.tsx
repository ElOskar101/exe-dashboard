import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TablerIcons, { availableIconsTypes } from '../components/tabler-icons'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('routes')
  const [routes, setRoutes] = useState<
    Array<{
      icon: availableIconsTypes
      route: string
      label: string
    }>
  >([])

  useEffect(() => {
    setRoutes(
      () =>
        t('routes', { returnObjects: true }) as Array<{
          icon: availableIconsTypes
          route: string
          label: string
        }>,
    )
  }, [])

  const redirectTo = (to: string) => {}

  return (
    <nav className="w-full text-[var(--neutral-900)] shadow-sm dark:bg-[var(--primary-50)] dark:text-[var(--neutral-900)]">
      <div className="container mx-auto flex items-center justify-between py-3">
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded hover:bg-[var(--primary-400)] transition-colors"
        >
          ☰
        </button>

        <div
          className={`
            ${open ? 'flex' : 'hidden'}
            md:flex flex-col md:flex-row gap-4 md:gap-6
            absolute md:static top-16 left-0 w-full md:w-auto
            bg-[var(--primary-500)] md:bg-transparent
            p-4 md:p-0 border-t md:border-none border-[var(--primary-700)]
            transition-all
          `}
        >
          {routes.map((route) => (
            <a
              className="text-[var(--neutral-900)] hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-500)] transition-colors cursor-pointer flex items-center gap-x-1"
              href={route.route}
            >
              {route.icon && <TablerIcons icon={route.icon} />}
              {route.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
