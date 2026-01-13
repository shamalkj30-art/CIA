'use client'

import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: ReactNode
  loading?: boolean
  trend?: {
    data: number[]
    color?: string
  }
}

function MiniSparkline({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const height = 24
  const width = 60
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function KPICardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-[var(--border)] rounded" />
          <div className="h-8 w-32 bg-[var(--border)] rounded" />
          <div className="h-3 w-20 bg-[var(--border)] rounded" />
        </div>
        <div className="w-10 h-10 bg-[var(--border)] rounded-lg" />
      </div>
    </div>
  )
}

export function KPICard({ title, value, change, icon, loading, trend }: KPICardProps) {
  if (loading) return <KPICardSkeleton />

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-muted)] truncate">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`
                inline-flex items-center gap-0.5 text-xs font-semibold
                ${change.type === 'increase' ? 'text-[var(--success)]' : ''}
                ${change.type === 'decrease' ? 'text-[var(--danger)]' : ''}
                ${change.type === 'neutral' ? 'text-[var(--text-muted)]' : ''}
              `}>
                {change.type === 'increase' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {change.type === 'decrease' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              <span className="text-xs text-[var(--text-muted)]">vs last period</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
              {icon}
            </div>
          )}
          {trend && <MiniSparkline data={trend.data} color={trend.color} />}
        </div>
      </div>
    </div>
  )
}

export function KPICardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}
