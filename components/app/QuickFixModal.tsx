'use client'

import { useState, useEffect, useRef } from 'react'
import type { PurchaseWithDocuments } from '@/lib/types'

interface QuickFixModalProps {
  purchase: PurchaseWithDocuments
  field: 'merchant' | 'price' | 'item_name' | 'purchase_date'
  onSave: (value: string | number) => void
  onClose: () => void
}

const FIELD_CONFIG = {
  merchant: {
    label: 'Merchant',
    placeholder: 'Enter merchant name',
    type: 'text' as const,
    suggestions: ['Amazon', 'Apple', 'Best Buy', 'Target', 'Walmart', 'Costco', 'IKEA', 'Home Depot'],
  },
  price: {
    label: 'Price',
    placeholder: '0.00',
    type: 'number' as const,
    suggestions: [],
  },
  item_name: {
    label: 'Item Name',
    placeholder: 'Enter item name',
    type: 'text' as const,
    suggestions: [],
  },
  purchase_date: {
    label: 'Purchase Date',
    placeholder: 'YYYY-MM-DD',
    type: 'date' as const,
    suggestions: [],
  },
}

export function QuickFixModal({ purchase, field, onSave, onClose }: QuickFixModalProps) {
  const config = FIELD_CONFIG[field]
  const inputRef = useRef<HTMLInputElement>(null)

  const getCurrentValue = () => {
    switch (field) {
      case 'merchant':
        return purchase.merchant || ''
      case 'price':
        return purchase.price?.toString() || ''
      case 'item_name':
        return purchase.item_name
      case 'purchase_date':
        return purchase.purchase_date
      default:
        return ''
    }
  }

  const [value, setValue] = useState(getCurrentValue())
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    if (field === 'price') {
      onSave(parseFloat(value))
    } else {
      onSave(value)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const filteredSuggestions = config.suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Quick Fix: {config.label}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Correct the AI-extracted value
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Value */}
          <div className="mb-4 p-3 bg-[var(--surface-subtle)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)] mb-1">Current value (AI detected)</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {getCurrentValue() || <span className="italic">Not detected</span>}
            </p>
          </div>

          {/* Input */}
          <div className="relative mb-4">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              New {config.label}
            </label>
            {field === 'price' ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full h-12 pl-8 pr-4 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <input
                ref={inputRef}
                type={config.type}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (config.suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                onFocus={() => {
                  if (config.suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                placeholder={config.placeholder}
                className="w-full h-12 px-4 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick suggestions for merchant */}
          {field === 'merchant' && config.suggestions.length > 0 && !showSuggestions && (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">Common merchants</p>
              <div className="flex flex-wrap gap-2">
                {config.suggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setValue(suggestion)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      value === suggestion
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </form>

        {/* Keyboard hint */}
        <div className="px-6 py-3 bg-[var(--surface-subtle)] border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Press <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded text-[10px]">Enter</kbd> to save
            or <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded text-[10px]">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  )
}
