'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface QuickAddOption {
  label: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

const options: QuickAddOption[] = [
  {
    label: 'Upload Receipt',
    description: 'Scan or upload a receipt image',
    href: '/upload',
    color: 'var(--primary)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    )
  },
  {
    label: 'Manual Entry',
    description: 'Add purchase details manually',
    href: '/upload?manual=true',
    color: 'var(--success)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    label: 'Import from Email',
    description: 'Forward receipts to your inbox',
    href: '/settings#email',
    color: 'var(--warning)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
]

export function QuickAddMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
          bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25
          hover:bg-[var(--primary-hover)] transition-all
          ${isOpen ? 'ring-2 ring-[var(--primary)]/30' : ''}
        `}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--card)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {options.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${option.color}15`, color: option.color }}
                >
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)]">{option.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{option.description}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Keyboard hint */}
          <div className="px-4 py-2 bg-[var(--surface-subtle)] border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Quick add:</span>
              <kbd className="px-1.5 py-0.5 font-medium bg-[var(--card)] rounded border border-[var(--border)]">N</kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Floating action button variant for mobile
export function QuickAddFAB() {
  return (
    <Link
      href="/upload"
      className="
        lg:hidden fixed right-4 bottom-20 z-30
        w-14 h-14 rounded-full
        bg-[var(--primary)] text-white
        shadow-lg shadow-[var(--primary)]/30
        flex items-center justify-center
        hover:bg-[var(--primary-hover)] active:scale-95
        transition-all
      "
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  )
}
