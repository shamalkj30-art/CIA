import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  /** Vertical spacing preset */
  spacing?: 'tight' | 'normal' | 'loose'
  /** Background variant */
  bg?: 'default' | 'surface' | 'subtle'
  /** Add border top */
  borderTop?: boolean
  className?: string
  id?: string
}

/**
 * Section wrapper with consistent vertical spacing
 * Use for landing page sections and content blocks
 */
export function Section({
  children,
  spacing = 'normal',
  bg = 'default',
  borderTop = false,
  className = '',
  id,
}: SectionProps) {
  const spacingClass = {
    tight: 'py-12 md:py-16',
    normal: 'py-16 md:py-20 lg:py-24',
    loose: 'py-20 md:py-28 lg:py-32',
  }[spacing]

  const bgClass = {
    default: 'bg-[var(--background)]',
    surface: 'bg-[var(--surface)]',
    subtle: 'bg-[var(--surface-subtle)]',
  }[bg]

  return (
    <section
      id={id}
      className={`
        ${spacingClass}
        ${bgClass}
        ${borderTop ? 'border-t border-[var(--border)]' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </section>
  )
}
