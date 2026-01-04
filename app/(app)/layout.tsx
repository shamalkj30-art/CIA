'use client'

import { AppSidebar, SidebarProvider, useSidebar, CommandPalette, QuickAddFAB } from '@/components/app'

function AppContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={`
      min-h-screen pb-20 lg:pb-0
      transition-all duration-300
      ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}
    `}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {children}
      </div>
    </main>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <AppSidebar />
        <AppContent>{children}</AppContent>
        <QuickAddFAB />
        <CommandPalette />
      </div>
    </SidebarProvider>
  )
}
