import { ReactNode } from 'react'

interface PageProps {
  children: ReactNode
  /** Maximum width variant */
  size?: 'narrow' | 'default' | 'wide'
  /** Remove default padding */
  noPadding?: boolean
  className?: string
}

/**
 * Page wrapper with max-width and consistent padding
 * Provides vertical rhythm and horizontal containment
 */
export function Page({
  children,
  size = 'default',
  noPadding = false,
  className = '',
}: PageProps) {
  const maxWidthClass = {
    narrow: 'max-w-3xl',
    default: 'max-w-5xl',
    wide: 'max-w-7xl',
  }[size]

  return (
    <div
      className={`
        mx-auto w-full
        ${maxWidthClass}
        ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8'}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}
