'use client'

import { ReactNode, useState, useRef, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within a Popover provider')
  }
  return context
}

interface PopoverProps {
  children: ReactNode
  /** Controlled open state */
  open?: boolean
  /** Change handler */
  onOpenChange?: (open: boolean) => void
}

/**
 * Popover component for dropdowns and menus
 * Handles positioning, keyboard navigation, and click outside
 */
export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const open = controlledOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: ReactNode
  className?: string
  asChild?: boolean
}

export function PopoverTrigger({ children, className = '', asChild = false }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopoverContext()

  if (asChild) {
    return <>{children}</>
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="true"
      className={className}
    >
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: ReactNode
  /** Alignment relative to trigger */
  align?: 'start' | 'center' | 'end'
  /** Side relative to trigger */
  side?: 'top' | 'bottom'
  /** Width matches trigger width */
  sameWidth?: boolean
  className?: string
}

export function PopoverContent({
  children,
  align = 'start',
  side = 'bottom',
  sameWidth = false,
  className = '',
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopoverContext()
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const contentRect = contentRef.current?.getBoundingClientRect()

      let left = rect.left
      if (align === 'center') {
        left = rect.left + rect.width / 2 - (contentRect?.width || 0) / 2
      } else if (align === 'end') {
        left = rect.right - (contentRect?.width || 0)
      }

      const top = side === 'bottom' ? rect.bottom + 8 : rect.top - (contentRect?.height || 0) - 8

      setPosition({
        top,
        left: Math.max(8, Math.min(left, window.innerWidth - (contentRect?.width || 200) - 8)),
        width: rect.width,
      })
    }
  }, [open, align, side, triggerRef])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  const content = (
    <div
      ref={contentRef}
      role="menu"
      className={`
        fixed z-50
        bg-[var(--surface)]
        border border-[var(--border)]
        rounded-xl
        shadow-lg
        py-1
        animate-in fade-in slide-in-from-top-2 duration-200
        ${className}
      `.trim()}
      style={{
        top: position.top,
        left: position.left,
        minWidth: sameWidth ? position.width : 'auto',
      }}
    >
      {children}
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(content, document.body)
}

interface PopoverItemProps {
  children: ReactNode
  /** Click handler */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
  /** Destructive action styling */
  destructive?: boolean
  /** Icon before text */
  icon?: ReactNode
  className?: string
}

export function PopoverItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  className = '',
}: PopoverItemProps) {
  const { setOpen } = usePopoverContext()

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
      className={`
        w-full flex items-center gap-3
        px-4 py-2.5
        text-sm text-left
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:bg-[var(--surface-subtle)]
        ${destructive
          ? 'text-[var(--danger)] hover:bg-[var(--danger-soft)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
        }
        ${className}
      `.trim()}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

interface PopoverSeparatorProps {
  className?: string
}

export function PopoverSeparator({ className = '' }: PopoverSeparatorProps) {
  return <div className={`my-1 border-t border-[var(--border)] ${className}`.trim()} role="separator" />
}
