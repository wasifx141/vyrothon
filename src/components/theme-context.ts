import { createContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeCtx | null>(null)
