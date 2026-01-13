'use client'

import { ReactNode, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, UseFormReturn, FieldValues, Path, DefaultValues, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onOpenChange, title, description, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${sizeClasses[size]} bg-[var(--surface)] rounded-2xl shadow-xl z-50 p-6 data-[state=open]:animate-scale-in`}>
          <Dialog.Title className="text-xl font-semibold text-[var(--text-primary)]">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-[var(--text-muted)] mt-1">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  hint?: string
}

export function FormField({ label, error, required, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--danger)] flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={`
        w-full px-3 py-2.5 text-sm border rounded-lg bg-[var(--background)] text-[var(--text-primary)]
        placeholder:text-[var(--text-muted)]
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]/20 focus:border-[var(--danger)]' : 'border-[var(--border)]'}
        ${className || ''}
      `}
      {...props}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={`
        w-full px-3 py-2.5 text-sm border rounded-lg bg-[var(--background)] text-[var(--text-primary)]
        placeholder:text-[var(--text-muted)]
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors resize-none
        ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]/20 focus:border-[var(--danger)]' : 'border-[var(--border)]'}
        ${className || ''}
      `}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
}

export function Select({ error, options, className, ...props }: SelectProps) {
  return (
    <select
      className={`
        w-full px-3 py-2.5 text-sm border rounded-lg bg-[var(--background)] text-[var(--text-primary)]
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]/20 focus:border-[var(--danger)]' : 'border-[var(--border)]'}
        ${className || ''}
      `}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => void | Promise<void>
  children: ReactNode
  className?: string
}

export function Form<T extends FieldValues>({ form, onSubmit, children, className }: FormProps<T>) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
      {children}
    </form>
  )
}

interface CreateEditModalProps<T extends FieldValues> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  schema: z.ZodType<T>
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void | Promise<void>
  fields: {
    name: Path<T>
    label: string
    type?: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date'
    placeholder?: string
    required?: boolean
    hint?: string
    options?: { value: string; label: string }[]
  }[]
  submitLabel?: string
  isLoading?: boolean
  isEdit?: boolean
}

export function CreateEditModal<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  fields,
  submitLabel,
  isLoading,
  isEdit,
}: CreateEditModalProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<T>({
    resolver: zodResolver(schema as any) as Resolver<T>,
    defaultValues,
  })

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (open && defaultValues) {
      form.reset(defaultValues)
    }
  }, [open, defaultValues, form])

  const handleSubmit = async (data: T) => {
    await onSubmit(data)
    if (!isLoading) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(open) => {
        if (!open) form.reset()
        onOpenChange(open)
      }}
      title={title}
      description={description}
    >
      <Form form={form} onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          const error = form.formState.errors[field.name]?.message as string | undefined

          return (
            <FormField
              key={field.name}
              label={field.label}
              error={error}
              required={field.required}
              hint={field.hint}
            >
              {field.type === 'textarea' ? (
                <Textarea
                  {...form.register(field.name)}
                  placeholder={field.placeholder}
                  error={!!error}
                  rows={4}
                />
              ) : field.type === 'select' && field.options ? (
                <Select
                  {...form.register(field.name)}
                  options={field.options}
                  error={!!error}
                />
              ) : (
                <Input
                  {...form.register(field.name, {
                    valueAsNumber: field.type === 'number',
                  })}
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  error={!!error}
                />
              )}
            </FormField>
          )
        })}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {submitLabel || (isEdit ? 'Save changes' : 'Create')}
          </button>
        </div>
      </Form>
    </Modal>
  )
}

// Confirmation dialog for destructive actions
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  isLoading,
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <p className="text-sm text-[var(--text-muted)]">{description}</p>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={`
            px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2
            ${variant === 'danger' ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/90' : 'bg-[var(--warning)] hover:bg-[var(--warning)]/90'}
          `}
        >
          {isLoading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
