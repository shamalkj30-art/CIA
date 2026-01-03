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
          let totalPriceValue = 0

          data.forEach((p) => {
            // Sum up prices
            if (p.price) {
              totalPriceValue += p.price
            }
            
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">Overview of your warranty protection</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalItems}</div>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total items</p>
        </div>

        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center text-[var(--success)] mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--success)]">{stats.activeWarranties}</div>
          <p className="text-sm text-[var(--text-muted)] mt-1">Protected</p>
        </div>

        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--warning-soft)] flex items-center justify-center text-[var(--warning)] mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--warning)]">{stats.expiringSoon}</div>
          <p className="text-sm text-[var(--text-muted)] mt-1">Expiring soon</p>
        </div>

        <div className="card p-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalValue}</div>
          <p className="text-sm text-[var(--text-muted)] mt-1">Est. value</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
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
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
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
                    className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] hover:border-[var(--warning)]/50 hover:bg-[var(--warning-soft)] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[var(--warning-soft)] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">{purchase.item_name}</p>
                        <p className="text-sm text-[var(--text-muted)] truncate">{purchase.merchant || 'Unknown merchant'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--warning-soft)] text-[var(--warning)]">
                        {info.daysLeft} days
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Additions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Additions</h2>
              <p className="text-sm text-[var(--text-muted)]">Latest purchases added</p>
            </div>
            <Link href="/upload" className="text-sm font-medium text-[var(--primary)] hover:underline">
              Add new →
            </Link>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--primary-soft)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)] mb-1">No purchases yet</h3>
              <p className="text-sm text-[var(--text-muted)]">Upload your first receipt to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/purchases/${purchase.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--card-subtle)] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{purchase.item_name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{formatDate(purchase.created_at)}</p>
                    </div>
                  </div>
                  {purchase.price && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="font-medium text-[var(--text-primary)]">
                        ${purchase.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
