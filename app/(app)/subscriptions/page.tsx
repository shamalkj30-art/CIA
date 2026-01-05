'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { Subscription, SubscriptionWithAlerts } from '@/lib/types'

type SortOption = 'charge_date' | 'price_high' | 'price_low' | 'name'
type FilterOption = 'all' | 'active' | 'expiring' | 'cancelled'
type ViewMode = 'list' | 'grid'

// Cadence display names
const cadenceLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

// Popular service logos/colors
const serviceColors: Record<string, { bg: string; text: string }> = {
  netflix: { bg: 'bg-red-500', text: 'text-white' },
  spotify: { bg: 'bg-green-500', text: 'text-white' },
  'amazon prime': { bg: 'bg-blue-500', text: 'text-white' },
  'disney+': { bg: 'bg-blue-600', text: 'text-white' },
  hbo: { bg: 'bg-purple-600', text: 'text-white' },
  youtube: { bg: 'bg-red-600', text: 'text-white' },
  apple: { bg: 'bg-gray-800', text: 'text-white' },
  microsoft: { bg: 'bg-blue-500', text: 'text-white' },
  adobe: { bg: 'bg-red-600', text: 'text-white' },
  dropbox: { bg: 'bg-blue-400', text: 'text-white' },
  notion: { bg: 'bg-gray-900', text: 'text-white' },
  slack: { bg: 'bg-purple-500', text: 'text-white' },
  figma: { bg: 'bg-violet-500', text: 'text-white' },
  github: { bg: 'bg-gray-900', text: 'text-white' },
  default: { bg: 'bg-[var(--primary)]', text: 'text-white' },
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithAlerts[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('charge_date')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state for adding subscription
  const [formData, setFormData] = useState({
    merchant: '',
    plan_name: '',
    price: '',
    currency: 'NOK',
    cadence: 'monthly' as Subscription['cadence'],
    next_charge_date: '',
    renewal_confidence: 'estimated' as Subscription['renewal_confidence'],
    cancel_url: '',
    support_email: '',
    category: '',
    notes: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#sort-dropdown-container')) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowAddModal(false)
      }
    }
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddModal])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (filterBy === 'active') params.set('status', 'active')
        if (filterBy === 'cancelled') params.set('status', 'cancelled')

        const response = await fetch(`/api/subscriptions?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSubscriptions(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [debouncedSearch, filterBy])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getChargeStatus = (subscription: SubscriptionWithAlerts) => {
    if (subscription.status === 'cancelled') {
      return { label: 'Cancelled', status: 'cancelled' as const }
    }
    if (subscription.status === 'paused') {
      return { label: 'Paused', status: 'paused' as const }
    }
    if (!subscription.next_charge_date) {
      return { label: 'No date', status: 'unknown' as const }
    }

    const days = subscription.days_until_charge
    if (days === null) return { label: 'Unknown', status: 'unknown' as const }

    if (days < 0) {
      return { label: 'Overdue', status: 'overdue' as const }
    }
    if (days === 0) {
      return { label: 'Today', status: 'today' as const }
    }
    if (days === 1) {
      return { label: 'Tomorrow', status: 'tomorrow' as const }
    }
    if (days <= 3) {
      return { label: `${days}d`, status: 'soon' as const }
    }
    if (days <= 7) {
      return { label: `${days}d`, status: 'week' as const }
    }
    return { label: `${days}d`, status: 'normal' as const }
  }

  const getServiceColor = (merchant: string) => {
    const lower = merchant.toLowerCase()
    for (const [key, colors] of Object.entries(serviceColors)) {
      if (lower.includes(key)) return colors
    }
    return serviceColors.default
  }

  const getMerchantInitials = (merchant: string) => {
    return merchant
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions
    .filter(s => {
      if (filterBy === 'all') return true
      if (filterBy === 'active') return s.status === 'active'
      if (filterBy === 'cancelled') return s.status === 'cancelled'
      if (filterBy === 'expiring') {
        const days = s.days_until_charge
        return days !== null && days >= 0 && days <= 7 && s.status === 'active'
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'charge_date':
          const aDays = a.days_until_charge ?? 999
          const bDays = b.days_until_charge ?? 999
          return aDays - bDays
        case 'price_high':
          return b.price - a.price
        case 'price_low':
          return a.price - b.price
        case 'name':
          return a.merchant.localeCompare(b.merchant)
        default:
          return 0
      }
    })

  // Calculate totals
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
    if (s.cadence === 'monthly') return sum + s.price
    if (s.cadence === 'yearly') return sum + s.price / 12
    if (s.cadence === 'quarterly') return sum + s.price / 3
    if (s.cadence === 'weekly') return sum + s.price * 4.33
    if (s.cadence === 'daily') return sum + s.price * 30
    return sum
  }, 0)

  const next7Days = activeSubscriptions.filter(s => {
    const days = s.days_until_charge
    return days !== null && days >= 0 && days <= 7
  })

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add subscription')
      }

      const newSubscription = await response.json()
      setSubscriptions(prev => [...prev, newSubscription])
      setShowAddModal(false)
      setFormData({
        merchant: '',
        plan_name: '',
        price: '',
        currency: 'NOK',
        cadence: 'monthly',
        next_charge_date: '',
        renewal_confidence: 'estimated',
        cancel_url: '',
        support_email: '',
        category: '',
        notes: '',
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add subscription')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Subscriptions</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {activeSubscriptions.length} active • ~{formatCurrency(monthlyTotal, 'NOK')}/mo
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subscription
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Active</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{activeSubscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Next 7 days</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{next7Days.length} charges</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Monthly cost</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">~{formatCurrency(monthlyTotal, 'NOK')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 mb-4">
        <div className="relative">
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
            placeholder="Search subscriptions..."
            className="w-full h-12 pl-12 pr-4 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--text-muted)] hover:bg-[var(--text-secondary)] text-white flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)]">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'expiring', label: 'Soon' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterBy(option.value as FilterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterBy === option.value
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex bg-[var(--card)] rounded-xl p-1 border border-[var(--border)]">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div id="sort-dropdown-container" className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] border rounded-xl text-sm font-medium text-[var(--text-primary)] transition-all ${
              sortDropdownOpen ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>
              {sortBy === 'charge_date' && 'Next charge'}
              {sortBy === 'price_high' && 'Price: High to low'}
              {sortBy === 'price_low' && 'Price: Low to high'}
              {sortBy === 'name' && 'Name A-Z'}
            </span>
            <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { value: 'charge_date', label: 'Next charge' },
                { value: 'price_high', label: 'Price: High to low' },
                { value: 'price_low', label: 'Price: Low to high' },
                { value: 'name', label: 'Name A-Z' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value as SortOption)
                    setSortDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    sortBy === option.value
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <svg className="w-4 h-4 ml-auto text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="card text-center py-16">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {debouncedSearch || filterBy !== 'all' ? 'No results found' : 'No subscriptions yet'}
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            {debouncedSearch
              ? `No subscriptions match "${debouncedSearch}"`
              : filterBy !== 'all'
              ? `No ${filterBy} subscriptions`
              : 'Track your recurring payments and never miss a charge.'}
          </p>
          {!debouncedSearch && filterBy === 'all' && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first subscription
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredSubscriptions.map((subscription) => {
            const chargeStatus = getChargeStatus(subscription)
            const colors = getServiceColor(subscription.merchant)

            return (
              <Link
                href={`/subscriptions/${subscription.id}`}
                key={subscription.id}
                className="card p-4 transition-all group hover:shadow-md hover:border-[var(--primary)] block"
              >
                <div className="flex items-center gap-4">
                  {/* Service Icon */}
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center font-semibold text-sm flex-shrink-0`}>
                    {getMerchantInitials(subscription.merchant)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {subscription.merchant}
                      </h3>
                      {subscription.plan_name && (
                        <span className="text-sm text-[var(--text-muted)] truncate">
                          {subscription.plan_name}
                        </span>
                      )}
                      {subscription.renewal_confidence === 'needs_confirmation' && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                          Confirm date
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCurrency(subscription.price, subscription.currency)}
                      </span>
                      <span>•</span>
                      <span>{cadenceLabels[subscription.cadence]}</span>
                      {subscription.next_charge_date && (
                        <>
                          <span>•</span>
                          <span>Next: {formatDate(subscription.next_charge_date)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`badge flex-shrink-0 ${
                    chargeStatus.status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                    chargeStatus.status === 'paused' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                    chargeStatus.status === 'today' ? 'badge-error' :
                    chargeStatus.status === 'tomorrow' ? 'badge-warning' :
                    chargeStatus.status === 'soon' ? 'badge-warning' :
                    chargeStatus.status === 'week' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'badge-success'
                  }`}>
                    {chargeStatus.label}
                  </span>

                  {/* Arrow */}
                  <div className="p-2 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Grid View */
        <div>
          <div className="flex items-center gap-3 px-2 mb-4">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscriptions.map((subscription) => {
              const chargeStatus = getChargeStatus(subscription)
              const colors = getServiceColor(subscription.merchant)

              return (
                <Link
                  href={`/subscriptions/${subscription.id}`}
                  key={subscription.id}
                  className="card p-4 transition-all hover:shadow-lg hover:border-[var(--primary)] group block"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center font-semibold`}>
                      {getMerchantInitials(subscription.merchant)}
                    </div>
                    <span className={`badge ${
                      chargeStatus.status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                      chargeStatus.status === 'paused' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                      chargeStatus.status === 'today' ? 'badge-error' :
                      chargeStatus.status === 'tomorrow' ? 'badge-warning' :
                      chargeStatus.status === 'soon' ? 'badge-warning' :
                      chargeStatus.status === 'week' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      'badge-success'
                    }`}>
                      {chargeStatus.label}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                    {subscription.merchant}
                  </h3>
                  {subscription.plan_name && (
                    <p className="text-sm text-[var(--text-muted)] mb-3">{subscription.plan_name}</p>
                  )}

                  {/* Price & Cadence */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {formatCurrency(subscription.price, subscription.currency)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{cadenceLabels[subscription.cadence]}</p>
                    </div>
                    {subscription.next_charge_date && subscription.status === 'active' && (
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-muted)]">Next charge</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {formatDate(subscription.next_charge_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Renewal confidence warning */}
                  {subscription.renewal_confidence === 'needs_confirmation' && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Confirm renewal date
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Subscription</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Netflix, Spotify"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  placeholder="e.g., Premium, Family"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">kr</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Billing Cycle *
                  </label>
                  <select
                    value={formData.cadence}
                    onChange={(e) => setFormData({ ...formData, cadence: e.target.value as Subscription['cadence'] })}
                    className="input"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Next Charge Date
                </label>
                <input
                  type="date"
                  value={formData.next_charge_date}
                  onChange={(e) => setFormData({ ...formData, next_charge_date: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Date Confidence
                </label>
                <select
                  value={formData.renewal_confidence}
                  onChange={(e) => setFormData({ ...formData, renewal_confidence: e.target.value as Subscription['renewal_confidence'] })}
                  className="input"
                >
                  <option value="confirmed">Confirmed - I know the exact date</option>
                  <option value="estimated">Estimated - Based on past billing</option>
                  <option value="needs_confirmation">Needs confirmation - Not sure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Cancel URL
                </label>
                <input
                  type="url"
                  value={formData.cancel_url}
                  onChange={(e) => setFormData({ ...formData, cancel_url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  className="input min-h-[80px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Subscription'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
