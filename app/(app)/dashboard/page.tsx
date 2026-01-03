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
            totalValue: '$' + (data.length * 250).toLocaleString(),
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Overview of your warranty protection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="feature-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{stats.totalItems}</div>
          <p className="text-sm text-[var(--text-muted)]">Total items</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="feature-icon-success">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--success)]">{stats.activeWarranties}</div>
          <p className="text-sm text-[var(--text-muted)]">Protected</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="feature-icon-warning">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--warning)]">{stats.expiringSoon}</div>
          <p className="text-sm text-[var(--text-muted)]">Expiring soon</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="feature-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{stats.totalValue}</div>
          <p className="text-sm text-[var(--text-muted)]">Est. value</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expiring Soon */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Expiring Soon</h2>
                <p className="text-sm text-[var(--text-muted)]">Warranties needing attention</p>
              </div>
              <Link href="/purchases" className="text-sm font-medium text-[var(--primary)] hover:underline">
                View all →
              </Link>
            </div>

            {expiringPurchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--success-soft)] flex items-center justify-center">
                  <svg className="w-7 h-7 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-medium text-[var(--text-primary)] mb-1">All clear!</h3>
                <p className="text-sm text-[var(--text-muted)]">No warranties expiring in the next 30 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringPurchases.map((purchase) => {
                  const info = getWarrantyInfo(purchase.warranty_expires_at)
                  return (
                    <Link
                      key={purchase.id}
                      href={`/purchases/${purchase.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--warning-soft)] border border-[var(--border)] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--warning-soft)] flex items-center justify-center">
                          <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--warning-hover)]">{purchase.item_name}</p>
                          <p className="text-sm text-[var(--text-muted)]">{purchase.merchant || 'Unknown merchant'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="badge badge-warning">{info.daysLeft} days left</span>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(purchase.warranty_expires_at!)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/upload" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--primary-soft)] hover:bg-[var(--primary-soft)] border border-[var(--primary)]/20 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--primary)]">Add Purchase</p>
                  <p className="text-xs text-[var(--text-muted)]">Upload a new receipt</p>
                </div>
              </Link>
              
              <Link href="/purchases" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">View All</p>
                  <p className="text-xs text-[var(--text-muted)]">Manage items</p>
                </div>
              </Link>

              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Settings</p>
                  <p className="text-xs text-[var(--text-muted)]">Email forwarding</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Additions</h2>
            {recentPurchases.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm text-center py-4">No purchases yet</p>
            ) : (
              <div className="space-y-2">
                {recentPurchases.slice(0, 3).map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={`/purchases/${purchase.id}`}
                    className="block p-3 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">{purchase.item_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(purchase.created_at)}</p>
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
