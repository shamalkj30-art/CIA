'use client'

import Link from 'next/link'
import { useMemo } from 'react'

interface Subscription {
  id: string
  merchant: string
  plan_name?: string | null
  price?: number
  cadence?: string
  next_billing_date?: string | null
  status?: string
}

interface SubscriptionAlertsProps {
  subscriptions: Subscription[]
  daysAhead?: number
}

// Service colors for popular brands
const serviceColors: Record<string, { bg: string; text: string }> = {
  netflix: { bg: 'bg-red-500/10', text: 'text-red-500' },
  spotify: { bg: 'bg-green-500/10', text: 'text-green-500' },
  youtube: { bg: 'bg-red-600/10', text: 'text-red-600' },
  disney: { bg: 'bg-blue-600/10', text: 'text-blue-600' },
  hbo: { bg: 'bg-purple-600/10', text: 'text-purple-600' },
  apple: { bg: 'bg-gray-500/10', text: 'text-gray-600' },
  amazon: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  adobe: { bg: 'bg-red-700/10', text: 'text-red-700' },
  microsoft: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  google: { bg: 'bg-blue-400/10', text: 'text-blue-500' },
  default: { bg: 'bg-[var(--primary-soft)]', text: 'text-[var(--primary)]' },
}

function getServiceColor(merchant: string) {
  const name = merchant.toLowerCase()
  for (const [key, colors] of Object.entries(serviceColors)) {
    if (key !== 'default' && name.includes(key)) {
      return colors
    }
  }
  return serviceColors.default
}

export function SubscriptionAlerts({
  subscriptions,
  daysAhead = 7
}: SubscriptionAlertsProps) {
  const upcomingCharges = useMemo(() => {
    const now = new Date()
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    return subscriptions
      .filter(sub => {
        if (sub.status === 'cancelled' || !sub.next_billing_date) return false
        const billingDate = new Date(sub.next_billing_date)
        return billingDate >= now && billingDate <= endDate
      })
      .map(sub => {
        const billingDate = new Date(sub.next_billing_date!)
        const daysLeft = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { ...sub, daysLeft }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [subscriptions, daysAhead])

  if (upcomingCharges.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Upcoming Charges
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success-soft)] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No charges this week
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Your subscriptions are under control
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Upcoming Charges
        </h3>
        <Link
          href="/subscriptions"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {upcomingCharges.map((sub) => {
          const colors = getServiceColor(sub.merchant)
          const initials = sub.merchant.slice(0, 2).toUpperCase()

          return (
            <Link
              key={sub.id}
              href={`/subscriptions/${sub.id}`}
              className="group flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors"
            >
              {/* Service icon */}
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-bold ${colors.text}`}>
                  {initials}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {sub.merchant}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {sub.plan_name || sub.cadence || 'Monthly'}
                </p>
              </div>

              {/* Price and timing */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  kr {sub.price?.toLocaleString() || '—'}
                </p>
                <p
                  className={`
                    text-xs font-medium
                    ${sub.daysLeft === 0
                      ? 'text-[var(--danger)]'
                      : sub.daysLeft <= 2
                        ? 'text-[var(--warning)]'
                        : 'text-[var(--text-muted)]'
                    }
                  `}
                >
                  {sub.daysLeft === 0
                    ? 'Today'
                    : sub.daysLeft === 1
                      ? 'Tomorrow'
                      : `In ${sub.daysLeft} days`
                  }
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-sm text-[var(--text-muted)]">
          Total this week
        </span>
        <span className="text-base font-semibold text-[var(--text-primary)]">
          kr {upcomingCharges.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString()}
        </span>
      </div>
    </div>
  )
}
