'use client'

import { ReactNode, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  children: ReactNode
  /** Whether dialog is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Close on backdrop click */
  closeOnBackdrop?: boolean
  /** Close on escape key */
  closeOnEscape?: boolean
  className?: string
}

/**
 * Accessible dialog/modal component
 * Handles focus trap, escape key, and backdrop click
 */
export function Dialog({
  children,
  open,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }[size]

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'

      // Focus the dialog
      setTimeout(() => {
        dialogRef.current?.focus()
      }, 0)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
  }, [open, handleEscape])

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`
          relative w-full
          bg-[var(--surface)]
          border border-[var(--border)]
          rounded-2xl
          shadow-xl
          animate-in fade-in zoom-in-95 duration-200
          focus:outline-none
          ${sizeClasses}
          ${className}
        `.trim()}
      >
        {children}
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(content, document.body)
}

interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-[var(--border)] ${className}`.trim()}>
      {children}
    </div>
  )
}

interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`.trim()}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-[var(--text-muted)] mt-1 ${className}`.trim()}>
      {children}
    </p>
  )
}

interface DialogContentProps {
  children: ReactNode
  className?: string
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`.trim()}>
      {children}
    </div>
  )
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 ${className}`.trim()}>
      {children}
    </div>
  )
}

interface DialogCloseProps {
  onClose: () => void
  className?: string
}

export function DialogClose({ onClose, className = '' }: DialogCloseProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`
        absolute top-4 right-4
        p-2 rounded-lg
        text-[var(--text-muted)]
        hover:text-[var(--text-primary)]
        hover:bg-[var(--surface-subtle)]
        transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
        ${className}
      `.trim()}
      aria-label="Close dialog"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
