import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { UserCard } from '@/features/auth'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { IconBrightnessDown, IconMoon } from '@tabler/icons-react'

const Header: () => JSX.Element = () => {
  const { t } = useTranslation()
  const { theme, handleTheme } = useTheme()

  return (
    <>
      <header className="z-1 w-full border-b border-border">
        <nav className="container mx-auto py-2.5 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="transition-colors">
            <img
              className="w-auto h-8 object-cover"
              src="/agent-icon.svg"
              alt={t('project-name')}
            />
          </a>

          <div className="ms-auto flex items-center gap-x-2">
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
