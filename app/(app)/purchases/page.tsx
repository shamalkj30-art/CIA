'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true)
      try {
        const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
        const response = await fetch(`/api/purchases${params}`)
        if (response.ok) {
          const data = await response.json()
          setPurchases(data)
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [debouncedSearch])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getWarrantyStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const expires = new Date(expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) {
      return { label: 'Expired', color: 'text-[var(--error)]', bg: 'bg-[var(--error)]/10' }
    }
    if (daysLeft <= 30) {
      return { label: `${daysLeft}d left`, color: 'text-orange-500', bg: 'bg-orange-500/10' }
    }
    if (daysLeft <= 90) {
      return { label: `${Math.ceil(daysLeft / 30)}mo left`, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
    }
    return { label: `${Math.ceil(daysLeft / 30)}mo left`, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Purchases</h1>
          <p className="text-[var(--muted)] mt-1">
            {purchases.length} {purchases.length === 1 ? 'item' : 'items'} tracked
          </p>
        </div>
        <Link href="/upload" className="btn btn-primary">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Purchase
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search purchases..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="card text-center py-16">
          <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-[var(--muted)] mt-4">Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {debouncedSearch ? 'No results found' : 'No purchases yet'}
          </h3>
          <p className="text-[var(--muted)] mb-6 max-w-sm mx-auto">
            {debouncedSearch
              ? `No purchases match "${debouncedSearch}"`
              : 'Start by uploading a receipt and creating your first purchase record.'}
          </p>
          {!debouncedSearch && (
            <Link href="/upload" className="btn btn-primary">
              Upload your first receipt
            </Link>
          )}
        </div>
      ) : (
        /* Purchases Grid */
        <div className="grid gap-4">
          {purchases.map((purchase) => {
            const warrantyStatus = getWarrantyStatus(purchase.warranty_expires_at)
            return (
              <Link
                key={purchase.id}
                href={`/purchases/${purchase.id}`}
                className="card hover:border-[var(--primary)]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium truncate">{purchase.item_name}</h3>
                      {purchase.documents.length > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-[var(--primary)]/10 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-[var(--primary)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      {purchase.merchant && (
                        <>
                          <span>{purchase.merchant}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatDate(purchase.purchase_date)}</span>
                    </div>
                  </div>
                  {warrantyStatus && (
                    <span
                      className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${warrantyStatus.color} ${warrantyStatus.bg}`}
                    >
                      {warrantyStatus.label}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
