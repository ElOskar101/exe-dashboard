import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconBuildingSkyscraper,
  IconHome,
  IconListDetails,
  IconUsers,
  type Icon,
} from '@tabler/icons-react'

type AvailableIconName =
  | 'IconBuildingSkyscraper'
  | 'IconHome'
  | 'IconUsers'
  | 'IconListDetails'

const routeIcons: Record<AvailableIconName, Icon> = {
  IconBuildingSkyscraper,
  IconHome,
  IconUsers,
  IconListDetails,
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('routes')
  const routes = t('routes', { returnObjects: true }) as Array<{
    icon?: AvailableIconName
    route: string
    label: string
  }>

  return (
    <nav className="w-full border-b border-border bg-background shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-3">
        <button
          onClick={() => setOpen(!open)}
          className="rounded p-2 transition-colors hover:bg-accent md:hidden"
        >
          ☰
        </button>

        <div
          className={`
            ${open ? 'flex' : 'hidden'}
            md:flex flex-col md:flex-row gap-4 md:gap-6
            absolute md:static top-16 left-0 w-full md:w-auto
            bg-popover md:bg-transparent
            p-4 md:p-0 border-t md:border-none border-border
            transition-all
          `}
        >
          {routes.map((route) => {
            const RouteIcon = route.icon ? routeIcons[route.icon] : null

            return (
              <a
                key={route.route}
                className="flex cursor-pointer items-center gap-x-1 text-foreground transition-colors hover:text-primary"
                href={route.route}
              >
                {RouteIcon && <RouteIcon />}
                {route.label}
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
