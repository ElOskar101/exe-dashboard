import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import UserCard from './user-card'
import Button from '../components/button'
import TablerIcons from '../components/tabler-icons'
import { useTheme } from '../hooks/use-theme'

const Header: () => JSX.Element = () => {
  const { t } = useTranslation()
  const { theme, handleTheme } = useTheme()

  return (
    <>
      <header className="w-full dark:bg-[var(--primary-50)] text-[var(--neutral-900)] shadow-sm z-1">
        <nav className="container mx-auto py-2 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="hover:text-blue-600">
            <img
              className="w-auto h-8 object-cover"
              src="/agent-icon.svg"
              alt={t('project-name')}
            />
          </a>

          <div className="ms-auto flex items-center gap-x-2">
            <Button size="sm" variant="link" onClick={handleTheme}>
              {theme === 'light' ? (
                <TablerIcons
                  icon="IconBrightnessDown"
                  className="w-5 h-5 scale-110 text-[var(--neutral-900)]"
                />
              ) : (
                <TablerIcons
                  icon="IconMoon"
                  className="w-5 h-5 text-[var(--neutral-900)]"
                />
              )}
            </Button>
            <UserCard />
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
