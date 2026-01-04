'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { QuickAddMenu } from '@/components/app'
import type { PurchaseWithDocuments } from '@/lib/types'

interface DashboardStats {
  totalItems: number
  activeWarranties: number
  expiringSoon: number
  expired: number
  totalValue: string
}

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    activeWarranties: 0,
    expiringSoon: 0,
    expired: 0,
    totalValue: '$0',
  })

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/purchases')
        if (response.ok) {
          const data: PurchaseWithDocuments[] = await response.json()
          setPurchases(data)

          // Calculate stats
          const now = new Date()
          let activeCount = 0
          let expiringSoonCount = 0
          let expiredCount = 0
          let totalPriceValue = 0

          data.forEach((p) => {
            if (p.price) totalPriceValue += p.price

            if (p.warranty_expires_at) {
              const expiresAt = new Date(p.warranty_expires_at)
              const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

              if (daysLeft < 0) {
                expiredCount++
              } else if (daysLeft <= 30) {
                expiringSoonCount++
                activeCount++
              } else {
                activeCount++
              }
            }
          })

          setStats({
            totalItems: data.length,
            activeWarranties: activeCount,
            expiringSoon: expiringSoonCount,
            expired: expiredCount,
            totalValue: '$' + totalPriceValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          })
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  const getWarrantyInfo = (expiresAt: string | null) => {
    if (!expiresAt) return { daysLeft: -1, status: 'none' as const }
    const expires = new Date(expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { daysLeft, status: 'expired' as const }
    if (daysLeft <= 30) return { daysLeft, status: 'warning' as const }
    return { daysLeft, status: 'active' as const }
  }

  // Items needing attention (expiring soon or with return deadlines)
  const attentionItems = purchases
    .filter(p => {
      const info = getWarrantyInfo(p.warranty_expires_at)
      const hasReturnDeadline = (p as any).return_deadline && new Date((p as any).return_deadline) > new Date()
      return info.status === 'warning' || hasReturnDeadline
    })
    .sort((a, b) => {
      const aInfo = getWarrantyInfo(a.warranty_expires_at)
      const bInfo = getWarrantyInfo(b.warranty_expires_at)
      return (aInfo.daysLeft === -1 ? 999 : aInfo.daysLeft) - (bInfo.daysLeft === -1 ? 999 : bInfo.daysLeft)
    })
    .slice(0, 5)

  // Recent purchases
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Your warranty command center</p>
        </div>
        <QuickAddMenu />
      </div>

      {/* Stats Grid - Bento style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="group hover:border-[var(--primary)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalItems}</div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Total items</p>
        </Card>

        <Card padding="md" className="group hover:border-[var(--success)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center text-[var(--success)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--success)]">{stats.activeWarranties}</div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Protected</p>
        </Card>

        <Card padding="md" className="group hover:border-[var(--warning)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--warning-soft)] flex items-center justify-center text-[var(--warning)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {stats.expiringSoon > 0 && (
              <Badge variant="warning" size="sm">{stats.expiringSoon}</Badge>
            )}
          </div>
          <div className="text-3xl font-bold text-[var(--warning)]">{stats.expiringSoon}</div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Expiring soon</p>
        </Card>

        <Card padding="md" className="group hover:border-[var(--primary)]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalValue}</div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Est. value</p>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attention Queue */}
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Attention Queue</h2>
              <p className="text-sm text-[var(--text-muted)]">Items needing action</p>
            </div>
            <Link href="/purchases?filter=expiring" className="text-sm font-medium text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>

          {attentionItems.length === 0 ? (
            <div className="text-center py-12 px-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">All clear!</h3>
              <p className="text-sm text-[var(--text-muted)]">No warranties expiring in the next 30 days</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {attentionItems.map((purchase) => {
                const info = getWarrantyInfo(purchase.warranty_expires_at)
                const hasReturnDeadline = (purchase as any).return_deadline && new Date((purchase as any).return_deadline) > new Date()

                return (
                  <Link
                    key={purchase.id}
                    href={`/purchases/${purchase.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--surface-subtle)] transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      hasReturnDeadline
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                    }`}>
                      {hasReturnDeadline ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {purchase.item_name}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {hasReturnDeadline ? 'Return deadline' : 'Warranty expiring'} • {purchase.merchant || 'Unknown'}
                      </p>
                    </div>

                    <Badge
                      variant={hasReturnDeadline ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {info.daysLeft >= 0 ? `${info.daysLeft}d` : 'Expired'}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent Captures */}
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Captures</h2>
              <p className="text-sm text-[var(--text-muted)]">Latest purchases added</p>
            </div>
            <Link href="/upload" className="text-sm font-medium text-[var(--primary)] hover:underline">
              Add new
            </Link>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="text-center py-12 px-5">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--primary-soft)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">No purchases yet</h3>
              <p className="text-sm text-[var(--text-muted)]">Upload your first receipt to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentPurchases.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/purchases/${purchase.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-[var(--surface-subtle)] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {purchase.item_name}
                      </p>
                      {(purchase as any).auto_detected && (
                        <Badge variant="info" size="sm">Auto</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatRelativeDate(purchase.created_at)}
                    </p>
                  </div>

                  {purchase.price && (
                    <span className="font-medium text-[var(--text-primary)]">
                      ${purchase.price.toLocaleString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Upload Receipt</p>
              <p className="text-sm text-[var(--text-muted)]">Scan or upload</p>
            </div>
          </Link>

          <Link
            href="/purchases"
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Search Purchases</p>
              <p className="text-sm text-[var(--text-muted)]">Find any item</p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Connect Gmail</p>
              <p className="text-sm text-[var(--text-muted)]">Auto-sync receipts</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-sm text-[var(--text-muted)]">
        <p>
          Press <kbd className="px-1.5 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">⌘K</kbd> for quick search,{' '}
          <kbd className="px-1.5 py-0.5 bg-[var(--surface-subtle)] rounded border border-[var(--border)]">N</kbd> to add new receipt
        </p>
      </div>
    </div>
  )
}
