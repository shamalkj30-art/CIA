'use client'

import { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  /** Whether chip is selected/active */
  selected?: boolean
  /** Click handler */
  onClick?: () => void
  /** Icon before text */
  icon?: ReactNode
  /** Show close button */
  onClose?: () => void
  /** Disabled state */
  disabled?: boolean
  className?: string
}

/**
 * Chip component for filters, tags, and selections
 * Use for saved views, category filters, etc.
 */
export function Chip({
  children,
  selected = false,
  onClick,
  icon,
  onClose,
  disabled = false,
  className = '',
}: ChipProps) {
  const baseClasses = `
    inline-flex items-center gap-2
    px-3 py-1.5
    text-sm font-medium
    rounded-lg
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2
  `

  const stateClasses = selected
    ? 'bg-[var(--primary)] text-white shadow-sm'
    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--text-primary)]'

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`.trim()}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className={`
            flex-shrink-0 -mr-1 p-0.5 rounded
            ${selected ? 'hover:bg-white/20' : 'hover:bg-[var(--surface-subtle)]'}
            transition-colors
          `.trim()}
          aria-label="Remove"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </button>
  )
}

interface ChipGroupProps {
  children: ReactNode
  className?: string
}

/**
 * Container for grouping chips
 */
export function ChipGroup({ children, className = '' }: ChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {children}
    </div>
  )
}
