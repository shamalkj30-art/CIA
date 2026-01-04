'use client'

import { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  action: () => void
  category: 'navigation' | 'action' | 'search'
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your warranty overview',
      category: 'navigation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      action: () => {
        router.push('/dashboard')
        setOpen(false)
      }
    },
    {
      id: 'nav-purchases',
      label: 'Go to Purchases',
      description: 'View all your tracked items',
      category: 'navigation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => {
        router.push('/purchases')
        setOpen(false)
      }
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Manage your account',
      category: 'navigation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        router.push('/settings')
        setOpen(false)
      }
    },
    {
      id: 'action-add',
      label: 'Add New Receipt',
      description: 'Upload and track a new purchase',
      shortcut: 'N',
      category: 'action',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => {
        router.push('/upload')
        setOpen(false)
      }
    },
    {
      id: 'action-export',
      label: 'Export Data',
      description: 'Download your purchases as CSV',
      category: 'action',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      action: () => {
        router.push('/purchases')
        setOpen(false)
        // Trigger export after navigation
        setTimeout(() => {
          const exportBtn = document.querySelector('[data-export-btn]') as HTMLButtonElement
          exportBtn?.click()
        }, 100)
      }
    },
  ]

  // Filter commands based on query
  const filteredCommands = query === ''
    ? commands
    : commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      )

  // Group commands by category
  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    action: filteredCommands.filter(c => c.category === 'action'),
    search: filteredCommands.filter(c => c.category === 'search'),
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      // N to add new (when not in input)
      if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        router.push('/upload')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  // Handle keyboard navigation within palette
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = filteredCommands.length
    if (totalItems === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 + totalItems) % totalItems)
        break
      case 'Enter':
        e.preventDefault()
        filteredCommands[activeIndex]?.action()
        break
    }
  }, [filteredCommands, activeIndex])

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  return (
    <Transition.Root show={open} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-50"
        onClose={() => setOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HeadlessDialog.Panel className="mx-auto max-w-xl transform overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl ring-1 ring-[var(--border)] transition-all">
              {/* Search Input */}
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  className="h-14 w-full border-0 bg-transparent pl-12 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-0 focus:outline-none"
                  placeholder="Search commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-subtle)] rounded border border-[var(--border)]">
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Results */}
              {filteredCommands.length > 0 ? (
                <div className="max-h-80 overflow-y-auto border-t border-[var(--border)] pb-2">
                  {/* Navigation */}
                  {groupedCommands.navigation.length > 0 && (
                    <div className="px-2 pt-2">
                      <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Navigation
                      </div>
                      {groupedCommands.navigation.map((cmd, idx) => {
                        const globalIdx = commands.findIndex(c => c.id === cmd.id)
                        const isActive = filteredCommands.findIndex(c => c.id === cmd.id) === activeIndex
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setActiveIndex(filteredCommands.findIndex(c => c.id === cmd.id))}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                              ${isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'}
                            `}
                          >
                            <span className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}>
                              {cmd.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[var(--text-primary)]">{cmd.label}</div>
                              {cmd.description && (
                                <div className="text-xs text-[var(--text-muted)] truncate">{cmd.description}</div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-subtle)] rounded border border-[var(--border)]">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  {groupedCommands.action.length > 0 && (
                    <div className="px-2 pt-2">
                      <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Actions
                      </div>
                      {groupedCommands.action.map((cmd) => {
                        const isActive = filteredCommands.findIndex(c => c.id === cmd.id) === activeIndex
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setActiveIndex(filteredCommands.findIndex(c => c.id === cmd.id))}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
                              ${isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'}
                            `}
                          >
                            <span className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}>
                              {cmd.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-[var(--text-primary)]">{cmd.label}</div>
                              {cmd.description && (
                                <div className="text-xs text-[var(--text-muted)] truncate">{cmd.description}</div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-subtle)] rounded border border-[var(--border)]">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-[var(--border)] px-6 py-10 text-center">
                  <svg className="mx-auto h-10 w-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">No commands found for "{query}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">↑</kbd>
                    <kbd className="px-1 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">⌘</kbd>
                  <kbd className="px-1 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">K</kbd>
                  toggle
                </span>
              </div>
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition.Root>
  )
}

// Export a button that can trigger the palette
export function CommandPaletteButton() {
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true
        })
        window.dispatchEvent(event)
      }}
      className="
        hidden sm:flex items-center gap-2 px-3 py-1.5
        bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg
        text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/30
        transition-colors
      "
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>Search</span>
      <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--card)] rounded border border-[var(--border)]">⌘K</kbd>
    </button>
  )
}
