import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './useTheme'

const STORAGE_KEY = 'scoutai.theme'

function initialTheme(): Theme {
  // index.html ha già applicato il tema a html[data-theme] prima del primo paint
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // la preferenza resta valida per la sessione
    }
  }, [theme])

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
