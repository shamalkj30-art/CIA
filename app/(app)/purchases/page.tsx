'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'

type SortOption = 'newest' | 'oldest' | 'name' | 'expiring'
type FilterOption = 'all' | 'active' | 'expiring' | 'expired'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
      return { label: 'Expired', daysLeft, status: 'expired' as const }
    }
    if (daysLeft <= 30) {
      return { label: `${daysLeft}d left`, daysLeft, status: 'warning' as const }
    }
    if (daysLeft <= 90) {
      return { label: `${Math.ceil(daysLeft / 30)}mo left`, daysLeft, status: 'active' as const }
    }
    return { label: `${Math.ceil(daysLeft / 30)}mo left`, daysLeft, status: 'active' as const }
  }

  // Filter and sort purchases
  const filteredPurchases = purchases
    .filter(p => {
      if (filterBy === 'all') return true
      const status = getWarrantyStatus(p.warranty_expires_at)
      if (filterBy === 'active') return status?.status === 'active'
      if (filterBy === 'expiring') return status?.status === 'warning'
      if (filterBy === 'expired') return status?.status === 'expired'
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          return a.item_name.localeCompare(b.item_name)
        case 'expiring':
          const aStatus = getWarrantyStatus(a.warranty_expires_at)
          const bStatus = getWarrantyStatus(b.warranty_expires_at)
          return (aStatus?.daysLeft ?? 999) - (bStatus?.daysLeft ?? 999)
        default:
          return 0
      }
    })

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredPurchases.map(p => p.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} items?`)) return
    
    for (const id of selectedIds) {
      await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
    }
    
    setPurchases(prev => prev.filter(p => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
  }

  const exportToCSV = () => {
    const headers = ['Item Name', 'Merchant', 'Purchase Date', 'Warranty (months)', 'Warranty Expires', 'Status']
    const rows = filteredPurchases.map(p => {
      const status = getWarrantyStatus(p.warranty_expires_at)
      return [
        p.item_name,
        p.merchant || '',
        p.purchase_date,
        p.warranty_months.toString(),
        p.warranty_expires_at || '',
        status?.status || 'No warranty'
      ]
    })
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cyncro-purchases-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Purchases</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {purchases.length} {purchases.length === 1 ? 'item' : 'items'} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportToCSV} className="btn btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <Link href="/upload" className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, merchant..."
              className="input pl-12"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)] hidden sm:block">Filter:</span>
            <div className="flex gap-1 bg-[var(--surface-subtle)] rounded-lg p-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'expiring', label: 'Expiring' },
                { value: 'expired', label: 'Expired' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterBy(option.value as FilterOption)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filterBy === option.value
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)] hidden sm:block">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input py-2 px-3 w-auto min-w-[140px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="expiring">Expiring soonest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="card p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="btn btn-ghost text-sm">
              Cancel
            </button>
            <button onClick={handleBulkDelete} className="btn btn-danger text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card text-center py-16">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading purchases...</p>
        </div>
      ) : filteredPurchases.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {debouncedSearch || filterBy !== 'all' ? 'No results found' : 'No purchases yet'}
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            {debouncedSearch
              ? `No purchases match "${debouncedSearch}"`
              : filterBy !== 'all'
              ? `No purchases with ${filterBy} warranty status`
              : 'Start by uploading a receipt and creating your first purchase record.'}
          </p>
          {!debouncedSearch && filterBy === 'all' && (
            <Link href="/upload" className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload your first receipt
            </Link>
          )}
        </div>
      ) : (
        /* Purchases List */
        <div className="space-y-3">
          {/* Select All Header */}
          <div className="flex items-center gap-3 px-2">
            <button
              onClick={selectAll}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.size === filteredPurchases.length && filteredPurchases.length > 0
                  ? 'bg-[var(--primary)] border-[var(--primary)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {selectedIds.size === filteredPurchases.length && filteredPurchases.length > 0 && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              {filteredPurchases.length} {filteredPurchases.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredPurchases.map((purchase) => {
            const warrantyStatus = getWarrantyStatus(purchase.warranty_expires_at)
            const isSelected = selectedIds.has(purchase.id)
            
            return (
              <div
                key={purchase.id}
                className={`card p-4 transition-all group ${
                  isSelected ? 'ring-2 ring-[var(--primary)] bg-[var(--primary-soft)]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(purchase.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[var(--primary)] border-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <Link href={`/purchases/${purchase.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {purchase.item_name}
                      </h3>
                      {purchase.documents.length > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-[var(--primary-soft)] flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      {purchase.merchant && (
                        <>
                          <span>{purchase.merchant}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatDate(purchase.purchase_date)}</span>
                    </div>
                  </Link>

                  {/* Status Badge */}
                  {warrantyStatus && (
                    <span className={`badge flex-shrink-0 ${
                      warrantyStatus.status === 'expired'
                        ? 'badge-error'
                        : warrantyStatus.status === 'warning'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}>
                      {warrantyStatus.label}
                    </span>
                  )}

                  {/* Arrow */}
                  <Link href={`/purchases/${purchase.id}`} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
