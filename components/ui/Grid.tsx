import { ReactNode } from 'react'

interface GridProps {
  children: ReactNode
  /** Number of columns at different breakpoints */
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Grid helper for consistent layouts
 * Based on 12-column grid system
 */
export function Grid({
  children,
  cols = 3,
  gap = 'md',
  className = '',
}: GridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-12',
  }[cols]

  const gapClass = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  }[gap]

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`.trim()}>
      {children}
    </div>
  )
}

interface GridItemProps {
  children: ReactNode
  /** Column span */
  span?: 1 | 2 | 3 | 4 | 6 | 12
  className?: string
}

/**
 * Grid item with column span support
 */
export function GridItem({
  children,
  span = 1,
  className = '',
}: GridItemProps) {
  const spanClass = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 sm:col-span-2 lg:col-span-3',
    4: 'col-span-2 sm:col-span-2 lg:col-span-4',
    6: 'col-span-2 sm:col-span-3 lg:col-span-6',
    12: 'col-span-full',
  }[span]

  return (
    <div className={`${spanClass} ${className}`.trim()}>
      {children}
    </div>
  )
}
