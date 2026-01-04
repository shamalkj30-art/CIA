'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

interface InputBaseProps {
  /** Label text */
  label?: string
  /** Helper text below input */
  helperText?: string
  /** Error message */
  error?: string
  /** Icon on the left */
  leftIcon?: ReactNode
  /** Icon on the right */
  rightIcon?: ReactNode
  /** Full width */
  fullWidth?: boolean
}

interface InputProps extends InputBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Input component with consistent styling
 * Supports labels, icons, and error states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    fullWidth = true,
    size = 'md',
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-12 text-base',
  }[size]

  const paddingClasses = `
    ${leftIcon ? 'pl-10' : 'pl-4'}
    ${rightIcon ? 'pr-10' : 'pr-4'}
  `

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full
            bg-[var(--surface)]
            border rounded-xl
            text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
            hover:border-[var(--primary)]/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${sizeClasses}
            ${paddingClasses}
            ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : 'border-[var(--border)]'}
            ${className}
          `.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
    </div>
  )
})

interface TextareaProps extends InputBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {}

/**
 * Textarea component with consistent styling
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    error,
    fullWidth = true,
    className = '',
    id,
    rows = 4,
    ...props
  },
  ref
) {
  const inputId = id || `textarea-${Math.random().toString(36).slice(2)}`

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`
          w-full
          bg-[var(--surface)]
          border rounded-xl
          p-4
          text-[var(--text-primary)] text-base
          placeholder:text-[var(--text-muted)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
          hover:border-[var(--primary)]/50
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : 'border-[var(--border)]'}
          ${className}
        `.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
    </div>
  )
})
