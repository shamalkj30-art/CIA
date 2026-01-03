'use client'

import { useState, useEffect } from 'react'

function useThemeSafe() {
  const [mounted, setMounted] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (stored) setThemeState(stored)
    
    const isDark = document.documentElement.classList.contains('dark')
    setResolvedTheme(isDark ? 'dark' : 'light')
  }, [])

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    
    const root = document.documentElement
    const actualTheme = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme
    
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
    setResolvedTheme(actualTheme)
  }

  return { theme, setTheme, resolvedTheme, mounted }
}

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme, mounted } = useThemeSafe()

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        setTheme(nextTheme)
      }}
      className="relative w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/50 flex items-center justify-center transition-all hover:scale-105 group"
      title={`Theme: ${theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-[var(--warning)] transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        {/* Moon Icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-[var(--primary)] transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
      
      {/* System indicator */}
      {theme === 'system' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--background)] flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">A</span>
        </span>
      )}
    </button>
  )
}
