import { ReactNode, forwardRef } from 'react'

interface CardProps {
  children: ReactNode
  /** Visual variant */
  variant?: 'default' | 'outline' | 'ghost' | 'elevated'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Make card interactive (hover effects) */
  interactive?: boolean
  /** As a link or button wrapper */
  as?: 'div' | 'article' | 'section'
  className?: string
  onClick?: () => void
}

/**
 * Base card component with consistent styling
 * Supports multiple variants and hover states
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    variant = 'default',
    padding = 'md',
    interactive = false,
    as: Component = 'div',
    className = '',
    onClick,
  },
  ref
) {
  const variantClass = {
    default: 'bg-[var(--surface)] border border-[var(--border)]',
    outline: 'bg-transparent border border-[var(--border)]',
    ghost: 'bg-transparent border-none',
    elevated: 'bg-[var(--surface)] border border-[var(--border)] shadow-md',
  }[variant]

  const paddingClass = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding]

  const interactiveClass = interactive
    ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/30 hover:-translate-y-0.5 active:translate-y-0'
    : ''

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={`
        rounded-2xl
        ${variantClass}
        ${paddingClass}
        ${interactiveClass}
        ${className}
      `.trim()}
    >
      {children}
    </Component>
  )
})

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`.trim()}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`.trim()}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-[var(--text-muted)] mt-1 ${className}`.trim()}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--border)] ${className}`.trim()}>
      {children}
    </div>
  )
}
