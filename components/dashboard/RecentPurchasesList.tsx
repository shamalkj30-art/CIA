'use client'

import Link from 'next/link'
import { useMemo } from 'react'

interface Purchase {
  id: string
  item_name: string
  merchant: string
  price?: number
  purchase_date?: string
  category?: string
}

interface RecentPurchasesListProps {
  purchases: Purchase[]
  maxItems?: number
}

const categoryEmojis: Record<string, string> = {
  electronics: '💻',
  apparel: '👕',
  beauty: '💄',
  home: '🏠',
  groceries: '🛒',
  travel: '✈️',
  entertainment: '🎮',
  health: '💊',
  subscriptions: '🔄',
  other: '📦',
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentPurchasesList({
  purchases,
  maxItems = 5
}: RecentPurchasesListProps) {
  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, maxItems)
  }, [purchases, maxItems])

  if (recentPurchases.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Recent Purchases
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No purchases yet
          </p>
          <Link
            href="/upload"
            className="text-xs text-[var(--primary)] hover:underline mt-1"
          >
            Add your first receipt
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Recent Purchases
        </h3>
        <Link
          href="/purchases"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      {/* List */}
      <div className="space-y-2">
        {recentPurchases.map((purchase) => {
          const emoji = categoryEmojis[purchase.category || 'other'] || '📦'

          return (
            <Link
              key={purchase.id}
              href={`/purchases/${purchase.id}`}
              className="group flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors"
            >
              {/* Category emoji */}
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-lg flex-shrink-0">
                {emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {purchase.item_name}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {purchase.merchant}
                </p>
              </div>

              {/* Price and date */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {purchase.price ? `kr ${purchase.price.toLocaleString()}` : '-'}
                </p>
                {purchase.purchase_date && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatRelativeDate(purchase.purchase_date)}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
