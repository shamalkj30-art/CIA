'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

// Sidebar context for collapsed state
interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setCollapsed(prev => !prev)
      }
      // Escape to close mobile menu
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close mobile menu on route change
  const pathname = usePathname()
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    href: '/purchases',
    label: 'Purchases',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    href: '/upload',
    label: 'Add Receipt',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
]

const bottomNavItems = [
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
]

function NavItem({
  href,
  label,
  icon,
  collapsed
}: {
  href: string
  label: string
  icon: React.ReactNode
  collapsed: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
        ${collapsed ? 'justify-center' : ''}
        ${isActive
          ? 'bg-[var(--primary)] text-white shadow-md'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="
          absolute left-full ml-2 px-2 py-1 bg-[var(--text-primary)] text-[var(--background)]
          text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all whitespace-nowrap z-50 pointer-events-none
        ">
          {label}
        </div>
      )}
    </Link>
  )
}

export function AppSidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex fixed left-0 top-0 bottom-0 flex-col
          bg-[var(--card)] border-r border-[var(--border)] z-40
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[68px]' : 'w-64'}
        `}
      >
        {/* Logo & Toggle */}
        <div className={`flex items-center gap-3 p-4 border-b border-[var(--border)] ${collapsed ? 'justify-center' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-[var(--text-primary)] truncate">Cyncro</span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
              title="Collapse sidebar (⌘B)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
            title="Expand sidebar (⌘B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-[var(--border)] space-y-1">
          {/* Settings */}
          {bottomNavItems.map((item) => (
            <NavItem key={item.href} {...item} collapsed={collapsed} />
          ))}

          {/* Theme Toggle */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)]`}>
            {!collapsed && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>Theme</span>
              </div>
            )}
            <ThemeToggle />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Log out' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-[var(--text-primary)]">Cyncro</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--card)] shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-lg font-bold text-[var(--text-primary)]">Cyncro</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.href} {...item} collapsed={false} />
              ))}
            </nav>

            {/* Bottom section */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--border)] space-y-1 bg-[var(--card)]">
              {bottomNavItems.map((item) => (
                <NavItem key={item.href} {...item} collapsed={false} />
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--border)] safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {[...navItems.slice(0, 3), ...bottomNavItems].map((item) => {
            const pathname = usePathname()
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl min-w-[56px] transition-colors ${
                  isActive
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
