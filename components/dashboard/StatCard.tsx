'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  trend?: {
    value: number
    positive: boolean
  }
  highlighted?: boolean
  href?: string
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  highlighted = false,
  href,
  className = ''
}: StatCardProps) {
  const content = (
    <div
      className={`
        relative p-5 rounded-2xl transition-all duration-300
        ${highlighted
          ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
          : 'bg-[var(--surface)] border border-[var(--border)] hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5'
        }
        ${className}
      `}
    >
      {/* Icon */}
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center mb-3
          ${highlighted
            ? 'bg-white/20'
            : 'bg-[var(--primary-soft)]'
          }
        `}
      >
        <span className={highlighted ? 'text-white' : 'text-[var(--primary)]'}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <p
        className={`
          text-2xl font-bold tracking-tight
          ${highlighted ? 'text-white' : 'text-[var(--text-primary)]'}
        `}
      >
        {value}
      </p>

      {/* Label */}
      <p
        className={`
          text-sm mt-1
          ${highlighted ? 'text-white/80' : 'text-[var(--text-secondary)]'}
        `}
      >
        {label}
      </p>

      {/* Trend indicator */}
      {trend && (
        <div
          className={`
            absolute top-4 right-4 flex items-center gap-1 text-xs font-medium
            ${trend.positive
              ? highlighted ? 'text-white' : 'text-[var(--success)]'
              : highlighted ? 'text-white/80' : 'text-[var(--danger)]'
            }
          `}
        >
          <svg
            className={`w-3 h-3 ${!trend.positive && 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
