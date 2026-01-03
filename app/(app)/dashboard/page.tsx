'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

          data.forEach((p) => {
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
            totalValue: '$' + (data.length * 250).toLocaleString(), // Placeholder calculation
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

  const expiringPurchases = purchases
    .filter(p => {
      const info = getWarrantyInfo(p.warranty_expires_at)
      return info.status === 'warning'
    })
    .sort((a, b) => {
      const aInfo = getWarrantyInfo(a.warranty_expires_at)
      const bInfo = getWarrantyInfo(b.warranty_expires_at)
      return aInfo.daysLeft - bInfo.daysLeft
    })
    .slice(0, 5)

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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
          <p className="text-[var(--muted)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Dashboard</h1>
        <p className="text-[var(--muted-light)]">Overview of your warranty protection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass stat-card p-6 animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm text-[var(--muted)]">Total Items</span>
          </div>
          <div className="text-3xl font-bold text-[var(--foreground)]">{stats.totalItems}</div>
          <p className="text-xs text-[var(--muted)] mt-1">purchases tracked</p>
        </div>

        <div className="glass stat-card p-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm text-[var(--muted)]">Protected</span>
          </div>
          <div className="text-3xl font-bold text-[var(--success)]">{stats.activeWarranties}</div>
          <p className="text-xs text-[var(--muted)] mt-1">active warranties</p>
        </div>

        <div className="glass stat-card p-6 animate-fade-in stagger-3" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-sm text-[var(--muted)]">Expiring Soon</span>
          </div>
          <div className="text-3xl font-bold text-[var(--warning)]">{stats.expiringSoon}</div>
          <p className="text-xs text-[var(--muted)] mt-1">within 30 days</p>
        </div>

        <div className="glass stat-card p-6 animate-fade-in stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-[var(--muted)]">Total Value</span>
          </div>
          <div className="text-3xl font-bold text-[var(--foreground)]">{stats.totalValue}</div>
          <p className="text-xs text-[var(--muted)] mt-1">estimated protection</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expiring Soon */}
        <div className="lg:col-span-2 glass p-6 animate-fade-in stagger-3" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Expiring Soon</h2>
              <p className="text-sm text-[var(--muted)]">Warranties needing attention</p>
            </div>
            <Link href="/purchases" className="btn btn-ghost text-sm">
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {expiringPurchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">All clear!</h3>
              <p className="text-[var(--muted)]">No warranties expiring in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringPurchases.map((purchase) => {
                const info = getWarrantyInfo(purchase.warranty_expires_at)
                return (
                  <Link
                    key={purchase.id}
                    href={`/purchases/${purchase.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--warning)]/20 to-orange-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{purchase.item_name}</p>
                        <p className="text-sm text-[var(--muted)]">{purchase.merchant || 'Unknown merchant'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-warning">
                        {info.daysLeft} days left
                      </span>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {formatDate(purchase.warranty_expires_at!)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass p-6 animate-fade-in stagger-4" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/upload" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">Add Purchase</p>
                  <p className="text-xs text-[var(--muted)]">Upload a new receipt</p>
                </div>
              </Link>
              
              <Link href="/purchases" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">View All Purchases</p>
                  <p className="text-xs text-[var(--muted)]">Manage your items</p>
                </div>
              </Link>

              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">Settings</p>
                  <p className="text-xs text-[var(--muted)]">Email forwarding & more</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass p-6 animate-fade-in stagger-5" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent Additions</h2>
            {recentPurchases.length === 0 ? (
              <p className="text-[var(--muted)] text-sm text-center py-4">No purchases yet</p>
            ) : (
              <div className="space-y-3">
                {recentPurchases.slice(0, 3).map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={`/purchases/${purchase.id}`}
                    className="block p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all"
                  >
                    <p className="font-medium text-[var(--foreground)] text-sm truncate">{purchase.item_name}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(purchase.created_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

