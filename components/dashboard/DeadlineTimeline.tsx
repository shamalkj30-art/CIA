'use client'

import Link from 'next/link'
import { useMemo } from 'react'

interface Purchase {
  id: string
  item_name: string
  merchant: string
  return_deadline?: string | null
  warranty_expires_at?: string | null
}

interface Subscription {
  id: string
  merchant: string
  plan_name?: string | null
  next_billing_date?: string | null
  price?: number
}

interface DeadlineTimelineProps {
  purchases: Purchase[]
  subscriptions: Subscription[]
  maxItems?: number
}

interface TimelineItem {
  id: string
  type: 'return' | 'warranty' | 'subscription'
  title: string
  subtitle: string
  date: Date
  daysLeft: number
  href: string
}

export function DeadlineTimeline({
  purchases,
  subscriptions,
  maxItems = 5
}: DeadlineTimelineProps) {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Add return deadlines
    purchases.forEach(p => {
      if (p.return_deadline) {
        const date = new Date(p.return_deadline)
        if (date >= now && date <= thirtyDaysFromNow) {
          items.push({
            id: `return-${p.id}`,
            type: 'return',
            title: p.item_name,
            subtitle: p.merchant,
            date,
            daysLeft: Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            href: `/purchases/${p.id}`
          })
        }
      }
    })

    // Add warranty expirations
    purchases.forEach(p => {
      if (p.warranty_expires_at) {
        const date = new Date(p.warranty_expires_at)
        if (date >= now && date <= thirtyDaysFromNow) {
          items.push({
            id: `warranty-${p.id}`,
            type: 'warranty',
            title: p.item_name,
            subtitle: p.merchant,
            date,
            daysLeft: Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            href: `/purchases/${p.id}`
          })
        }
      }
    })

    // Add subscription renewals
    subscriptions.forEach(s => {
      if (s.next_billing_date) {
        const date = new Date(s.next_billing_date)
        if (date >= now && date <= thirtyDaysFromNow) {
          items.push({
            id: `sub-${s.id}`,
            type: 'subscription',
            title: s.merchant,
            subtitle: s.plan_name || `kr ${s.price}/mo`,
            date,
            daysLeft: Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            href: `/subscriptions/${s.id}`
          })
        }
      }
    })

    // Sort by date (soonest first)
    items.sort((a, b) => a.date.getTime() - b.date.getTime())

    return items.slice(0, maxItems)
  }, [purchases, subscriptions, maxItems])

  const getTypeStyles = (type: TimelineItem['type']) => {
    switch (type) {
      case 'return':
        return {
          dot: 'bg-[var(--danger)]',
          badge: 'bg-[var(--danger-soft)] text-[var(--danger)]',
          label: 'Return'
        }
      case 'warranty':
        return {
          dot: 'bg-[var(--warning)]',
          badge: 'bg-[var(--warning-soft)] text-[var(--warning)]',
          label: 'Warranty'
        }
      case 'subscription':
        return {
          dot: 'bg-[var(--primary)]',
          badge: 'bg-[var(--primary-soft)] text-[var(--primary)]',
          label: 'Renewal'
        }
    }
  }

  if (timelineItems.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Upcoming Deadlines
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success-soft)] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No upcoming deadlines
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            You&apos;re all caught up!
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
          Upcoming Deadlines
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Next 30 days
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {timelineItems.map((item, index) => {
          const styles = getTypeStyles(item.type)
          const isLast = index === timelineItems.length - 1

          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors"
            >
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} mt-1.5`} />
                {!isLast && (
                  <div className="w-px h-full min-h-[32px] bg-[var(--border)] mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {item.title}
                  </p>
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${styles.badge}`}>
                    {styles.label}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {item.subtitle}
                </p>
              </div>

              {/* Days left badge */}
              <div className="flex-shrink-0">
                <span
                  className={`
                    px-2 py-1 text-xs font-medium rounded-lg
                    ${item.daysLeft <= 3
                      ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                      : item.daysLeft <= 7
                        ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {item.daysLeft === 0 ? 'Today' : item.daysLeft === 1 ? '1 day' : `${item.daysLeft} days`}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
