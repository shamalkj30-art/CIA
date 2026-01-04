import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  /** Optional icon before text */
  icon?: ReactNode
  /** Dot indicator instead of icon */
  dot?: boolean
  className?: string
}

/**
 * Badge component for status indicators
 * Use for warranty status, confidence levels, etc.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]',
    primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
    danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]',
  }[variant]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size]

  const dotColor = {
    default: 'bg-[var(--text-muted)]',
    primary: 'bg-[var(--primary)]',
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
    info: 'bg-blue-500',
    outline: 'bg-[var(--text-muted)]',
  }[variant]

  return (
    <span
      className={`
        inline-flex items-center
        font-medium font-[family-name:var(--font-heading)]
        rounded-full
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `.trim()}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {icon && !dot && icon}
      {children}
    </span>
  )
}
