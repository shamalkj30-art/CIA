'use client'

import { AppSidebar, SidebarProvider, useSidebar, CommandPalette, QuickAddFAB, AnimatedBackground } from '@/components/app'

function AppContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={`
      min-h-screen pb-20 lg:pb-0
      transition-all duration-300 relative
      ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}
    `}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative z-10">
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
      <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />

        <AppSidebar />
        <AppContent>{children}</AppContent>
        <QuickAddFAB />
        <CommandPalette />
      </div>
    </SidebarProvider>
  )
}
