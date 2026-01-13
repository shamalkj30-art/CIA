'use client'

import * as Toast from '@radix-ui/react-toast'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface ToastData {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  toast: (data: Omit<ToastData, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...data, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((data: Omit<ToastData, 'id'>) => addToast(data), [addToast])
  const success = useCallback((title: string, description?: string) => addToast({ title, description, type: 'success' }), [addToast])
  const error = useCallback((title: string, description?: string) => addToast({ title, description, type: 'error' }), [addToast])
  const warning = useCallback((title: string, description?: string) => addToast({ title, description, type: 'warning' }), [addToast])
  const info = useCallback((title: string, description?: string) => addToast({ title, description, type: 'info' }), [addToast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            className={`
              relative flex items-start gap-3 p-4 rounded-xl shadow-lg border
              bg-[var(--surface)] animate-slide-in-right
              ${t.type === 'success' ? 'border-[var(--success)]/20' : ''}
              ${t.type === 'error' ? 'border-[var(--danger)]/20' : ''}
              ${t.type === 'warning' ? 'border-[var(--warning)]/20' : ''}
              ${t.type === 'info' ? 'border-[var(--primary)]/20' : ''}
            `}
            onOpenChange={(open) => !open && removeToast(t.id)}
          >
            <div className={`
              w-5 h-5 flex-shrink-0 mt-0.5
              ${t.type === 'success' ? 'text-[var(--success)]' : ''}
              ${t.type === 'error' ? 'text-[var(--danger)]' : ''}
              ${t.type === 'warning' ? 'text-[var(--warning)]' : ''}
              ${t.type === 'info' ? 'text-[var(--primary)]' : ''}
            `}>
              {t.type === 'success' && (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {t.type === 'warning' && (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Toast.Title className="font-semibold text-sm text-[var(--text-primary)]">
                {t.title}
              </Toast.Title>
              {t.description && (
                <Toast.Description className="text-sm text-[var(--text-muted)] mt-0.5">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)] z-[100]" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
