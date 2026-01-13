'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setCollapsed(prev => !prev)
      }
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

// Navigation items grouped by category
const navGroups = [
  {
    label: null,
    items: [
      {
        href: '/dashboard',
        label: 'Overview',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        )
      },
    ]
  },
  {
    label: 'Tracking',
    items: [
      {
        href: '/purchases',
        label: 'Purchases',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
      },
      {
        href: '/subscriptions',
        label: 'Subscriptions',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        badge: 'PRO'
      },
      {
        href: '/vault',
        label: 'Vault',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )
      },
    ]
  },
  {
    label: 'Actions',
    items: [
      {
        href: '/inbox',
        label: 'Inbox',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        ),
        notificationKey: 'inbox'
      },
      {
        href: '/cases',
        label: 'Cases',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
  },
]

const bottomNavItems = [
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    notificationKey: 'notifications'
  },
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

// Fetch user stats for profile dropdown
async function fetchUserStats() {
  const res = await fetch('/api/purchases')
  if (!res.ok) return { purchases: 0, value: 0 }
  const purchases = await res.json()
  const value = purchases.reduce((sum: number, p: { price?: number }) => sum + (p.price || 0), 0)
  return { purchases: purchases.length, value }
}

function NavItem({
  href,
  label,
  icon,
  collapsed,
  badge,
  notificationCount
}: {
  href: string
  label: string
  icon: React.ReactNode
  collapsed: boolean
  badge?: string
  notificationCount?: number
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
          ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0 relative">
        {icon}
        {notificationCount && notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </span>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--primary)] to-purple-500 text-white rounded-md">
              {badge}
            </span>
          )}
          {notificationCount && notificationCount > 0 && (
            <span className="w-5 h-5 bg-[var(--danger)] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </>
      )}

      {collapsed && (
        <div className="
          absolute left-full ml-3 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)]
          text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl
          text-[var(--text-primary)]
        ">
          {label}
          {badge && <span className="ml-2 text-[var(--primary)]">{badge}</span>}
        </div>
      )}
    </Link>
  )
}

function UserProfileDropdown({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string } | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: fetchUserStats,
    staleTime: 60000,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U'
  const userName = user?.email?.split('@')[0] || 'User'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`
            w-full flex items-center gap-3 p-2 rounded-xl transition-all
            hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">{userInitial}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-2 z-[100] animate-scale-in"
          sideOffset={8}
          align={collapsed ? 'start' : 'end'}
          side={collapsed ? 'right' : 'top'}
        >
          {/* User Info Header */}
          <div className="px-3 py-3 border-b border-[var(--border)] mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)] truncate">{userName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.purchases || 0}</p>
                <p className="text-xs text-[var(--text-muted)]">Items</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">${(stats?.value || 0).toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)]">Total Value</p>
              </div>
            </div>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <a
              href="mailto:support@cyncro.app"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help Center
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[var(--border)] my-2" />

          <DropdownMenu.Item asChild>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function AppSidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const router = useRouter()

  // Fetch notification counts
  const { data: notificationCounts } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: async () => {
      const [purchasesRes] = await Promise.all([
        fetch('/api/purchases'),
      ])
      const purchases = purchasesRes.ok ? await purchasesRes.json() : []
      const needsReview = purchases.filter((p: { needs_review?: boolean }) => p.needs_review).length
      return { inbox: needsReview, notifications: 0 }
    },
    staleTime: 30000,
  })

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
          bg-[var(--surface)]/80 backdrop-blur-xl border-r border-[var(--border)]/50 z-40
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[280px]'}
        `}
      >
        {/* Logo & Toggle */}
        <div className={`flex items-center gap-3 p-4 ${collapsed ? 'justify-center' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--primary)] rounded-xl blur-md opacity-50" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-[var(--text-primary)] font-heading">Cyncro</span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
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
            className="mx-auto mt-1 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title="Expand sidebar (⌘B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.label && !collapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              {collapsed && group.label && <div className="h-px bg-[var(--border)]/50 my-2" />}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    collapsed={collapsed}
                    notificationCount={item.notificationKey ? notificationCounts?.[item.notificationKey as keyof typeof notificationCounts] : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-[var(--border)]/50 space-y-1">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={collapsed}
              notificationCount={item.notificationKey ? notificationCounts?.[item.notificationKey as keyof typeof notificationCounts] : undefined}
            />
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

          {/* User Profile */}
          <div className="pt-2 border-t border-[var(--border)]/50">
            <UserProfileDropdown collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center">
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
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-[var(--surface)] shadow-2xl animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]/50">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-[var(--text-primary)] font-heading">Cyncro</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Groups */}
            <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {navGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {group.label && (
                    <p className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        {...item}
                        collapsed={false}
                        notificationCount={item.notificationKey ? notificationCounts?.[item.notificationKey as keyof typeof notificationCounts] : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom section */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--border)]/50 bg-[var(--surface)] space-y-1">
              {bottomNavItems.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  collapsed={false}
                  notificationCount={item.notificationKey ? notificationCounts?.[item.notificationKey as keyof typeof notificationCounts] : undefined}
                />
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/90 backdrop-blur-xl border-t border-[var(--border)]/50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {[navGroups[0].items[0], ...navGroups[1].items.slice(0, 2), bottomNavItems[1]].map((item) => {
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
