'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Read theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const initialTheme = stored || 'light'
    setThemeState(initialTheme)
    
    // Set resolved theme
    if (initialTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(systemDark ? 'dark' : 'light')
    } else {
      setResolvedTheme(initialTheme === 'dark' ? 'dark' : 'light')
    }
    
    setMounted(true)
  }, [])

  // Apply theme when it changes (but not on initial mount - inline script handles that)
  useEffect(() => {
    if (!mounted || theme === null) return

    const root = window.document.documentElement
    const getSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const actualTheme = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(actualTheme)

    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
    
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light'
      setResolvedTheme(newTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  // Don't render until we've read the theme from localStorage
  if (!mounted || theme === null) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
