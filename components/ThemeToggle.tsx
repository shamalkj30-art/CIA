'use client'

import { useState, useEffect } from 'react'

// Self-contained theme toggle that works independently
// Uses localStorage directly to avoid hydration issues
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('light')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Read from localStorage
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const currentTheme = stored || 'light'
    setThemeState(currentTheme)
    
    // Calculate if dark
    if (currentTheme === 'system') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      setIsDark(currentTheme === 'dark')
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    const actualTheme = newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme
    
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
    setIsDark(actualTheme === 'dark')
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(nextTheme)
  }

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/50 flex items-center justify-center transition-all hover:scale-105"
      title={`Theme: ${theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}`}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-[var(--warning)] transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
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
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
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
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--primary)] border-2 border-[var(--background)] flex items-center justify-center">
          <span className="text-[7px] text-white font-bold">A</span>
        </span>
      )}
    </button>
  )
}
