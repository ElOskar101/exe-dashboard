import { useCallback, useSyncExternalStore } from 'react'

type ThemeType = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'
const THEME_CHANGE_EVENT = 'themechange'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const isTheme = (theme: string | null): theme is ThemeType =>
  theme === 'light' || theme === 'dark'

const getSystemTheme = (): ThemeType =>
  window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'

const getStoredTheme = (): ThemeType | null => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    return isTheme(storedTheme) ? storedTheme : null
  } catch {
    return null
  }
}

const getThemeSnapshot = (): ThemeType => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return getStoredTheme() ?? getSystemTheme()
}

const getServerSnapshot = (): ThemeType => 'light'

const syncDocumentTheme = (theme: ThemeType) => {
  const root = document.documentElement

  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

const applyTheme = (theme: ThemeType) => {
  syncDocumentTheme(theme)

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The document theme still updates when storage is unavailable.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

const subscribeToTheme = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(DARK_QUERY)
  const handleThemeChange = () => {
    syncDocumentTheme(getThemeSnapshot())
    onStoreChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  window.addEventListener('storage', handleThemeChange)
  mediaQuery.addEventListener('change', handleThemeChange)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.removeEventListener('storage', handleThemeChange)
    mediaQuery.removeEventListener('change', handleThemeChange)
  }
}

export const useTheme = () => {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerSnapshot,
  )

  const setTheme = useCallback((nextTheme: ThemeType) => {
    applyTheme(nextTheme)
  }, [])

  const handleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  return {
    theme,
    handleTheme,
    setTheme,
  }
}
