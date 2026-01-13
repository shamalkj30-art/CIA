'use client'

import { ReactNode } from 'react'

// Loading skeleton components
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--border)] rounded" />
          <div className="h-4 w-64 bg-[var(--border)] rounded" />
        </div>
        <div className="h-10 w-28 bg-[var(--border)] rounded-lg" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-[var(--border)] rounded" />
              <div className="h-8 w-28 bg-[var(--border)] rounded" />
              <div className="h-3 w-16 bg-[var(--border)] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <div className="h-64 bg-[var(--border)] rounded-lg" />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-[var(--border)] rounded" />
        <div className="h-8 w-32 bg-[var(--border)] rounded" />
        <div className="h-3 w-20 bg-[var(--border)] rounded" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="h-12 bg-[var(--surface-subtle)] border-b border-[var(--border)]" />
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 border-b border-[var(--border)] last:border-b-0 flex items-center gap-4 px-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="h-4 bg-[var(--border)] rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-[var(--border)] rounded" />
          <div className="h-8 w-24 bg-[var(--border)] rounded" />
        </div>
        <div className="h-64 bg-[var(--border)] rounded-lg" />
      </div>
    </div>
  )
}

// Empty state components
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon ? (
        <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-sm mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Error state components
interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-sm mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-subtle)] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try again
        </button>
      )}
    </div>
  )
}

// Page header component
interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  action?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[var(--text-primary)] transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[var(--text-primary)]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

// Section component for organizing content
interface SectionProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="mb-8">
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
            {description && <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// Inline loading indicator
export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {text}
    </div>
  )
}

// Full page loading
export function FullPageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  )
}
