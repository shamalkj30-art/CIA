import { ReactNode, forwardRef, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Full width button */
  fullWidth?: boolean
  /** Show loading spinner */
  loading?: boolean
  /** Icon before text */
  leftIcon?: ReactNode
  /** Icon after text */
  rightIcon?: ReactNode
  className?: string
}

type ButtonAsButtonProps = ButtonBaseProps & {
  as?: 'button'
  href?: never
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

type ButtonAsLinkProps = ButtonBaseProps & {
  as: 'link'
  href: string
  disabled?: boolean
  children: ReactNode
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

/**
 * Premium button component with consistent styling
 * Supports multiple variants, sizes, and states
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      ...rest
    } = props

    const variantClasses = {
      primary: `
        bg-[var(--primary)] text-white
        hover:bg-[var(--primary-hover)]
        active:bg-[var(--primary-hover)]
        shadow-sm hover:shadow-md hover:shadow-[var(--primary)]/20
        hover:-translate-y-0.5 active:translate-y-0
      `,
      secondary: `
        bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]
        hover:bg-[var(--surface-subtle)] hover:border-[var(--primary)]/50
        active:bg-[var(--surface)]
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)]
        hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]
        active:bg-[var(--surface)]
      `,
      danger: `
        bg-[var(--danger)] text-white
        hover:bg-[#991B1B]
        active:bg-[#7F1D1D]
        shadow-sm hover:shadow-md hover:shadow-[var(--danger)]/20
      `,
      warning: `
        bg-[var(--warning)] text-white
        hover:bg-[var(--warning-hover)]
        active:bg-[var(--warning-hover)]
        shadow-sm hover:shadow-md hover:shadow-[var(--warning)]/20
      `,
    }[variant]

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
      md: 'h-10 px-4 text-sm gap-2 rounded-xl',
      lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
    }[size]

    const baseClasses = `
      inline-flex items-center justify-center
      font-medium font-[family-name:var(--font-heading)]
      tracking-tight
      transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      ${sizeClasses}
      ${variantClasses}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim()

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </>
    )

    if (props.as === 'link') {
      const { href, disabled, ...linkRest } = props
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={`${baseClasses} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={disabled}
        >
          {content}
        </Link>
      )
    }

    const { as: _, ...buttonRest } = rest as ButtonAsButtonProps
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        disabled={loading || buttonRest.disabled}
        {...buttonRest}
      >
        {content}
      </button>
    )
  }
)
