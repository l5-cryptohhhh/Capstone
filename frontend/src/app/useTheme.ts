import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeValue {
  theme: Theme
  toggle: () => void
}

export const ThemeContext = createContext<ThemeValue | null>(null)

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve essere usato dentro ThemeProvider')
  return ctx
}
