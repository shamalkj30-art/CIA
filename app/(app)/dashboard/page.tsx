'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { QuickAddMenu } from '@/components/app'
import type { PurchaseWithDocuments, Subscription } from '@/lib/types'

interface DashboardStats {
  totalItems: number
  activeWarranties: number
  expiringSoon: number
  expired: number
  totalValue: string
  needsReview: number
}

interface WeeklyDigest {
  newPurchases: number
  warrantiesExpired: number
  upcomingDeadlines: number
  subscriptionCharges: number
  totalSpentThisWeek: number
}

interface UpcomingCharge {
  id: string
  merchant: string
  price: number
  chargeDate: string
  daysUntil: number
}

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    activeWarranties: 0,
    expiringSoon: 0,
    expired: 0,
    totalValue: '$0',
    needsReview: 0,
  })
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest>({
    newPurchases: 0,
    warrantiesExpired: 0,
    upcomingDeadlines: 0,
    subscriptionCharges: 0,
    totalSpentThisWeek: 0,
  })
  const [upcomingCharges, setUpcomingCharges] = useState<UpcomingCharge[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch purchases and subscriptions in parallel
        const [purchasesRes, subscriptionsRes] = await Promise.all([
          fetch('/api/purchases'),
          fetch('/api/subscriptions'),
        ])

        const purchasesData: PurchaseWithDocuments[] = purchasesRes.ok ? await purchasesRes.json() : []
        const subscriptionsData: Subscription[] = subscriptionsRes.ok ? await subscriptionsRes.json() : []

        setPurchases(purchasesData)
        setSubscriptions(subscriptionsData)

        // Calculate stats
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        let activeCount = 0
        let expiringSoonCount = 0
        let expiredCount = 0
        let totalPriceValue = 0
        let needsReviewCount = 0

        // Weekly digest counters
        let newPurchasesThisWeek = 0
        let warrantiesExpiredThisWeek = 0
        let upcomingDeadlinesCount = 0
        let totalSpentThisWeek = 0

        purchasesData.forEach((p) => {
          if (p.price) totalPriceValue += p.price
          if (p.needs_review) needsReviewCount++

          // Check if added this week
          if (new Date(p.created_at) >= oneWeekAgo) {
            newPurchasesThisWeek++
            if (p.price) totalSpentThisWeek += p.price
          }

          if (p.warranty_expires_at) {
            const expiresAt = new Date(p.warranty_expires_at)
            const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysLeft < 0) {
              expiredCount++
              // Check if expired this week
              if (expiresAt >= oneWeekAgo) {
                warrantiesExpiredThisWeek++
              }
            } else if (daysLeft <= 30) {
              expiringSoonCount++
              activeCount++
              upcomingDeadlinesCount++
            } else {
              activeCount++
            }
          }

          // Return deadlines count
          if ((p as any).return_deadline) {
            const returnDate = new Date((p as any).return_deadline)
            if (returnDate > now && returnDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
              upcomingDeadlinesCount++
            }
          }
        })

        // Calculate subscription charges this week
        let subscriptionChargesThisWeek = 0
        const upcomingChargesList: UpcomingCharge[] = []

        subscriptionsData
          .filter(s => s.status === 'active' && s.next_charge_date)
          .forEach(s => {
            const chargeDate = new Date(s.next_charge_date!)
            const daysUntil = Math.ceil((chargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntil >= 0 && daysUntil <= 14) {
              upcomingChargesList.push({
                id: s.id,
                merchant: s.merchant,
                price: s.price,
                chargeDate: s.next_charge_date!,
                daysUntil,
              })
            }

            if (daysUntil >= 0 && daysUntil <= 7) {
              subscriptionChargesThisWeek++
            }
          })

        // Sort by days until charge
        upcomingChargesList.sort((a, b) => a.daysUntil - b.daysUntil)
        setUpcomingCharges(upcomingChargesList.slice(0, 6))

        setStats({
          totalItems: purchasesData.length,
          activeWarranties: activeCount,
          expiringSoon: expiringSoonCount,
          expired: expiredCount,
          totalValue: '$' + totalPriceValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          needsReview: needsReviewCount,
        })

        setWeeklyDigest({
          newPurchases: newPurchasesThisWeek,
          warrantiesExpired: warrantiesExpiredThisWeek,
          upcomingDeadlines: upcomingDeadlinesCount,
          subscriptionCharges: subscriptionChargesThisWeek,
          totalSpentThisWeek,
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  // Items needing attention - now categorized
  const attentionItems = purchases
    .filter(p => {
      const info = getWarrantyInfo(p.warranty_expires_at)
      const hasReturnDeadline = (p as any).return_deadline && new Date((p as any).return_deadline) > new Date()
      return info.status === 'warning' || hasReturnDeadline || p.needs_review
    })
    .map(p => {
      const info = getWarrantyInfo(p.warranty_expires_at)
      const hasReturnDeadline = (p as any).return_deadline && new Date((p as any).return_deadline) > new Date()
      let category: 'return' | 'warranty' | 'review' = 'warranty'
      let urgency = info.daysLeft

      if (hasReturnDeadline) {
        category = 'return'
        urgency = Math.ceil((new Date((p as any).return_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      } else if (p.needs_review) {
        category = 'review'
        urgency = 999 // Low priority
      }

      return { ...p, category, urgency }
    })
    .sort((a, b) => a.urgency - b.urgency)
    .slice(0, 5)

  // Recent purchases
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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

  const getChargeLabel = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    return `In ${daysUntil} days`
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

      {/* Weekly Digest Banner */}
      <Card padding="lg" className="bg-gradient-to-r from-[var(--primary)]/5 via-[var(--primary)]/10 to-[var(--primary)]/5 border-[var(--primary)]/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Weekly Digest</h2>
            <p className="text-sm text-[var(--text-muted)]">Your activity this week</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-[var(--card)] rounded-xl">
            <div className="text-2xl font-bold text-[var(--primary)]">{weeklyDigest.newPurchases}</div>
            <p className="text-xs text-[var(--text-muted)]">New purchases</p>
          </div>
          <div className="p-3 bg-[var(--card)] rounded-xl">
            <div className="text-2xl font-bold text-[var(--warning)]">{weeklyDigest.upcomingDeadlines}</div>
            <p className="text-xs text-[var(--text-muted)]">Upcoming deadlines</p>
          </div>
          <div className="p-3 bg-[var(--card)] rounded-xl">
            <div className="text-2xl font-bold text-blue-500">{weeklyDigest.subscriptionCharges}</div>
            <p className="text-xs text-[var(--text-muted)]">Charges this week</p>
          </div>
          <div className="p-3 bg-[var(--card)] rounded-xl">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              ${weeklyDigest.totalSpentThisWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Tracked this week</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid - Bento style */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Link href="/inbox?tab=inbox">
          <Card padding="md" className="group hover:border-blue-500/30 transition-colors cursor-pointer h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              {stats.needsReview > 0 && (
                <Badge variant="info" size="sm">{stats.needsReview}</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-500">{stats.needsReview}</div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Needs review</p>
          </Card>
        </Link>

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

      {/* Subscription Timeline */}
      {upcomingCharges.length > 0 && (
        <Card padding="none">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming Charges</h2>
                <p className="text-sm text-[var(--text-muted)]">Subscription timeline (next 14 days)</p>
              </div>
            </div>
            <Link href="/subscriptions" className="text-sm font-medium text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>

          <div className="p-5">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border)]" />

              <div className="space-y-4">
                {upcomingCharges.map((charge, index) => (
                  <Link
                    key={charge.id}
                    href={`/subscriptions/${charge.id}`}
                    className="relative flex items-center gap-4 pl-10 group"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-[var(--card)] ${
                      charge.daysUntil === 0
                        ? 'bg-red-500'
                        : charge.daysUntil <= 3
                        ? 'bg-[var(--warning)]'
                        : 'bg-purple-500'
                    }`} />

                    <div className="flex-1 flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-xl group-hover:bg-[var(--primary-soft)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--card)] flex items-center justify-center text-sm font-bold text-purple-500">
                          {charge.merchant.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {charge.merchant}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatDate(charge.chargeDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--text-primary)]">
                          ${charge.price.toFixed(2)}
                        </p>
                        <p className={`text-xs font-medium ${
                          charge.daysUntil === 0
                            ? 'text-red-500'
                            : charge.daysUntil <= 3
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--text-muted)]'
                        }`}>
                          {getChargeLabel(charge.daysUntil)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

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
              <p className="text-sm text-[var(--text-muted)]">No items need your attention right now</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {attentionItems.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={purchase.category === 'review' ? `/inbox` : `/purchases/${purchase.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-[var(--surface-subtle)] transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    purchase.category === 'return'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : purchase.category === 'review'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                  }`}>
                    {purchase.category === 'return' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    ) : purchase.category === 'review' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                      {purchase.category === 'return' ? 'Return deadline' :
                       purchase.category === 'review' ? 'Needs verification' :
                       'Warranty expiring'} • {purchase.merchant || 'Unknown'}
                    </p>
                  </div>

                  <Badge
                    variant={purchase.category === 'return' ? 'danger' :
                             purchase.category === 'review' ? 'info' : 'warning'}
                    size="sm"
                  >
                    {purchase.category === 'review' ? 'Review' :
                     purchase.urgency >= 0 ? `${purchase.urgency}d` : 'Expired'}
                  </Badge>
                </Link>
              ))}
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
        <div className="grid sm:grid-cols-4 gap-4">
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
            href="/inbox"
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Review Inbox</p>
              <p className="text-sm text-[var(--text-muted)]">Verify purchases</p>
            </div>
          </Link>

          <Link
            href="/subscriptions"
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Subscriptions</p>
              <p className="text-sm text-[var(--text-muted)]">Manage recurring</p>
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
