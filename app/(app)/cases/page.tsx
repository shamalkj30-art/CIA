'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { Case, CaseType, CaseStatus } from '@/lib/types'

type SortOption = 'newest' | 'oldest' | 'follow_up'
type FilterOption = 'all' | 'active' | 'resolved'
type ViewMode = 'list' | 'grid'

// Case type display names and colors
const caseTypeConfig: Record<CaseType, { label: string; color: string; icon: string }> = {
  return: { label: 'Return', color: 'bg-blue-500', icon: '↩' },
  warranty: { label: 'Warranty', color: 'bg-purple-500', icon: '🛡' },
  complaint: { label: 'Complaint', color: 'bg-amber-500', icon: '!' },
  cancellation: { label: 'Cancel', color: 'bg-red-500', icon: '✕' },
}

// Status display names and colors
const statusConfig: Record<CaseStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  sent: { label: 'Sent', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  waiting: { label: 'Waiting', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  escalated: { label: 'Escalated', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  resolved: { label: 'Resolved', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  closed: { label: 'Closed', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
}

type CaseWithDays = Case & { days_until_follow_up: number | null }

export default function CasesPage() {
  const [cases, setCases] = useState<CaseWithDays[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [caseTypeFilter, setCaseTypeFilter] = useState<CaseType | 'all'>('all')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state for adding case
  const [formData, setFormData] = useState({
    case_type: 'return' as CaseType,
    subject: '',
    description: '',
    merchant: '',
    merchant_email: '',
    auto_follow_up: true,
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

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (filterBy === 'active') params.set('status', 'waiting')
        if (filterBy === 'resolved') params.set('status', 'resolved')
        if (caseTypeFilter !== 'all') params.set('type', caseTypeFilter)

        const response = await fetch(`/api/cases?${params}`)
        if (response.ok) {
          const data = await response.json()
          setCases(data)
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [debouncedSearch, filterBy, caseTypeFilter])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFollowUpStatus = (caseData: CaseWithDays) => {
    if (caseData.status === 'resolved' || caseData.status === 'closed') {
      return null
    }
    if (!caseData.follow_up_at) {
      return null
    }

    const days = caseData.days_until_follow_up
    if (days === null) return null

    if (days < 0) {
      return { label: 'Overdue', urgent: true }
    }
    if (days === 0) {
      return { label: 'Today', urgent: true }
    }
    if (days === 1) {
      return { label: 'Tomorrow', urgent: false }
    }
    if (days <= 3) {
      return { label: `${days}d`, urgent: false }
    }
    return null
  }

  // Filter and sort cases
  const filteredCases = cases
    .filter(c => {
      if (filterBy === 'all') return true
      if (filterBy === 'active') return !['resolved', 'closed'].includes(c.status)
      if (filterBy === 'resolved') return ['resolved', 'closed'].includes(c.status)
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'follow_up':
          const aDays = a.days_until_follow_up ?? 999
          const bDays = b.days_until_follow_up ?? 999
          return aDays - bDays
        default:
          return 0
      }
    })

  // Calculate totals
  const activeCases = cases.filter(c => !['resolved', 'closed'].includes(c.status))
  const needsFollowUp = cases.filter(c => {
    const days = c.days_until_follow_up
    return days !== null && days <= 0 && !['resolved', 'closed'].includes(c.status)
  })

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create case')
      }

      const newCase = await response.json()
      setCases(prev => [{ ...newCase, days_until_follow_up: null }, ...prev])
      setShowAddModal(false)
      setFormData({
        case_type: 'return',
        subject: '',
        description: '',
        merchant: '',
        merchant_email: '',
        auto_follow_up: true,
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create case')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Cases</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {activeCases.length} active • {needsFollowUp.length} need follow-up
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Case
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Active Cases</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{activeCases.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${needsFollowUp.length > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${needsFollowUp.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Need Follow-up</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{needsFollowUp.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Resolved</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {cases.filter(c => c.status === 'resolved').length}
              </p>
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
            placeholder="Search cases..."
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
        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)]">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'resolved', label: 'Resolved' },
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

        {/* Case Type Filter */}
        <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)]">
          {[
            { value: 'all', label: 'All Types' },
            { value: 'return', label: 'Return' },
            { value: 'warranty', label: 'Warranty' },
            { value: 'complaint', label: 'Complaint' },
            { value: 'cancellation', label: 'Cancel' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setCaseTypeFilter(option.value as CaseType | 'all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                caseTypeFilter === option.value
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
              {sortBy === 'newest' && 'Newest first'}
              {sortBy === 'oldest' && 'Oldest first'}
              {sortBy === 'follow_up' && 'Follow-up date'}
            </span>
            <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'follow_up', label: 'Follow-up date' },
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
          <p className="text-[var(--text-muted)]">Loading cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {debouncedSearch || filterBy !== 'all' || caseTypeFilter !== 'all' ? 'No results found' : 'No cases yet'}
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            {debouncedSearch
              ? `No cases match "${debouncedSearch}"`
              : filterBy !== 'all' || caseTypeFilter !== 'all'
              ? 'No cases match your filters'
              : 'Create a case to track returns, warranty claims, or complaints.'}
          </p>
          {!debouncedSearch && filterBy === 'all' && caseTypeFilter === 'all' && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first case
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredCases.length} {filteredCases.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {filteredCases.map((caseData) => {
            const typeConfig = caseTypeConfig[caseData.case_type]
            const statusCfg = statusConfig[caseData.status]
            const followUpStatus = getFollowUpStatus(caseData)

            return (
              <Link
                href={`/cases/${caseData.id}`}
                key={caseData.id}
                className="card p-4 transition-all group hover:shadow-md hover:border-[var(--primary)] block"
              >
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div className={`w-11 h-11 rounded-xl ${typeConfig.color} text-white flex items-center justify-center font-semibold text-lg flex-shrink-0`}>
                    {typeConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {caseData.subject}
                      </h3>
                      {followUpStatus && (
                        <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          followUpStatus.urgent
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                          Follow-up {followUpStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <span>{caseData.merchant}</span>
                      <span>•</span>
                      <span>{typeConfig.label}</span>
                      <span>•</span>
                      <span>{formatDate(caseData.created_at)}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`badge flex-shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
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
              {filteredCases.length} {filteredCases.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseData) => {
              const typeConfig = caseTypeConfig[caseData.case_type]
              const statusCfg = statusConfig[caseData.status]
              const followUpStatus = getFollowUpStatus(caseData)

              return (
                <Link
                  href={`/cases/${caseData.id}`}
                  key={caseData.id}
                  className="card p-4 transition-all hover:shadow-lg hover:border-[var(--primary)] group block"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${typeConfig.color} text-white flex items-center justify-center font-semibold text-lg`}>
                      {typeConfig.icon}
                    </div>
                    <span className={`badge ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {caseData.subject}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">{caseData.merchant}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeConfig.color} text-white`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(caseData.created_at)}
                    </span>
                  </div>

                  {/* Follow-up warning */}
                  {followUpStatus && (
                    <div className={`mt-3 p-2 rounded-lg ${
                      followUpStatus.urgent
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      <p className={`text-xs flex items-center gap-1 ${
                        followUpStatus.urgent
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Follow-up {followUpStatus.label}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Case</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCase} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Case Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['return', 'warranty', 'complaint', 'cancellation'] as CaseType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, case_type: type })}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        formData.case_type === type
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg ${caseTypeConfig[type].color} text-white flex items-center justify-center text-sm`}>
                        {caseTypeConfig[type].icon}
                      </span>
                      <span className={`text-sm font-medium ${
                        formData.case_type === type ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {caseTypeConfig[type].label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Return defective headphones"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Merchant *
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Elkjøp, Komplett"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Merchant Email
                </label>
                <input
                  type="email"
                  value={formData.merchant_email}
                  onChange={(e) => setFormData({ ...formData, merchant_email: e.target.value })}
                  placeholder="support@merchant.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue..."
                  className="input min-h-[100px] resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_follow_up"
                  checked={formData.auto_follow_up}
                  onChange={(e) => setFormData({ ...formData, auto_follow_up: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="auto_follow_up" className="text-sm text-[var(--text-secondary)]">
                  Enable automatic follow-up reminders (3 days after sending)
                </label>
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
                      Creating...
                    </>
                  ) : (
                    'Create Case'
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
