'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { VaultItem, VaultLibrary, VaultStats, InsuranceRoom } from '@/lib/types'
import { LIBRARY_CONFIGS, ROOM_CONFIGS } from '@/lib/types'

type SortOption = 'newest' | 'oldest' | 'name' | 'value_high' | 'value_low'
type ViewMode = 'list' | 'grid'

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeLibrary, setActiveLibrary] = useState<VaultLibrary | 'all'>('all')
  const [activeRoom, setActiveRoom] = useState<InsuranceRoom | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showExpiring, setShowExpiring] = useState(false)

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (activeLibrary !== 'all') params.set('library', activeLibrary)
        if (activeRoom !== 'all') params.set('room', activeRoom)
        if (showExpiring) params.set('expiring', 'true')

        const response = await fetch(`/api/vault?${params}`)
        if (response.ok) {
          const data = await response.json()
          setItems(data)
        }
      } catch (error) {
        console.error('Failed to fetch vault items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [debouncedSearch, activeLibrary, activeRoom, showExpiring])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/vault/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch vault stats:', error)
      }
    }
    fetchStats()
  }, [items])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return null
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getLibraryConfig = (library: VaultLibrary) => {
    return LIBRARY_CONFIGS.find(l => l.id === library) || LIBRARY_CONFIGS[0]
  }

  const getRoomConfig = (room: InsuranceRoom | null) => {
    if (!room) return null
    return ROOM_CONFIGS.find(r => r.id === room)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'name':
        return a.title.localeCompare(b.title)
      case 'value_high':
        return (b.estimated_value || 0) - (a.estimated_value || 0)
      case 'value_low':
        return (a.estimated_value || 0) - (b.estimated_value || 0)
      default:
        return 0
    }
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Vault</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {stats?.total_items || 0} documents stored
          </p>
        </div>
        <div className="flex gap-2">
          {activeLibrary === 'insurance' && (
            <Link href="/vault/insurance" className="btn btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Insurance Overview
            </Link>
          )}
          <Link href="/vault/upload" className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
              <span className="text-lg">📂</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Total Documents</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{stats?.total_items || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Insurance Value</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(stats?.total_insurance_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-lg">⏰</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Expiring Soon</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{stats?.expiring_soon || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Warranties</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{stats?.by_library?.warranties || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Library Tabs */}
      <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)] mb-4 overflow-x-auto">
        <button
          onClick={() => { setActiveLibrary('all'); setActiveRoom('all') }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeLibrary === 'all'
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          All
        </button>
        {LIBRARY_CONFIGS.map((lib) => (
          <button
            key={lib.id}
            onClick={() => { setActiveLibrary(lib.id); setActiveRoom('all') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeLibrary === lib.id
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <span>{lib.icon}</span>
            <span>{lib.label}</span>
            {stats?.by_library && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeLibrary === lib.id
                  ? 'bg-white/20'
                  : 'bg-[var(--surface-subtle)]'
              }`}>
                {stats.by_library[lib.id] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Room Filter (for Insurance) */}
      {activeLibrary === 'insurance' && (
        <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)] mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveRoom('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeRoom === 'all'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
            }`}
          >
            All Rooms
          </button>
          {ROOM_CONFIGS.map((room) => {
            const roomStats = stats?.by_room?.[room.id]
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeRoom === room.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <span>{room.icon}</span>
                <span>{room.label}</span>
                {roomStats && roomStats.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeRoom === room.id
                      ? 'bg-white/20'
                      : 'bg-[var(--surface-subtle)]'
                  }`}>
                    {roomStats.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

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
            placeholder="Search documents..."
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
        {/* Expiring Filter */}
        <button
          onClick={() => setShowExpiring(!showExpiring)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            showExpiring
              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
              : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:border-amber-300'
          }`}
        >
          <span className="mr-2">⏰</span>
          Expiring Soon
        </button>

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
              {sortBy === 'name' && 'Name A-Z'}
              {sortBy === 'value_high' && 'Value: High to low'}
              {sortBy === 'value_low' && 'Value: Low to high'}
            </span>
            <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'name', label: 'Name A-Z' },
                { value: 'value_high', label: 'Value: High to low' },
                { value: 'value_low', label: 'Value: Low to high' },
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
          <p className="text-[var(--text-muted)]">Loading documents...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
            <span className="text-3xl">📂</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {debouncedSearch ? 'No results found' : 'No documents yet'}
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            {debouncedSearch
              ? `No documents match "${debouncedSearch}"`
              : activeLibrary !== 'all'
              ? `No documents in ${getLibraryConfig(activeLibrary).label}`
              : 'Start organizing your important documents.'}
          </p>
          {!debouncedSearch && (
            <Link href="/vault/upload" className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add your first document
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2">
            <span className="text-sm text-[var(--text-muted)]">
              {sortedItems.length} {sortedItems.length === 1 ? 'document' : 'documents'}
            </span>
          </div>

          {sortedItems.map((item) => {
            const libConfig = getLibraryConfig(item.library)
            const roomConfig = getRoomConfig(item.room)
            const isExpiring = item.expires_at && new Date(item.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            return (
              <Link
                href={`/vault/${item.id}`}
                key={item.id}
                className="card p-4 transition-all group hover:shadow-md hover:border-[var(--primary)] block"
              >
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="w-11 h-11 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-xl flex-shrink-0">
                    {getFileIcon(item.file_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {item.title}
                      </h3>
                      {isExpiring && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                          Expiring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <span>{libConfig.icon} {libConfig.label}</span>
                      {roomConfig && (
                        <>
                          <span>•</span>
                          <span>{roomConfig.icon} {roomConfig.label}</span>
                        </>
                      )}
                      {item.estimated_value && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(item.estimated_value)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full">
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

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
              {sortedItems.length} {sortedItems.length === 1 ? 'document' : 'documents'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => {
              const libConfig = getLibraryConfig(item.library)
              const roomConfig = getRoomConfig(item.room)
              const isExpiring = item.expires_at && new Date(item.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

              return (
                <Link
                  href={`/vault/${item.id}`}
                  key={item.id}
                  className="card p-4 transition-all hover:shadow-lg hover:border-[var(--primary)] group block"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-2xl">
                      {getFileIcon(item.file_type)}
                    </div>
                    <div className="flex items-center gap-1">
                      {isExpiring && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                          Expiring
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full">
                        {libConfig.icon}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 truncate group-hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3 truncate">
                    {item.file_name}
                  </p>

                  {/* Room & Value */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      {roomConfig ? (
                        <span>{roomConfig.icon} {roomConfig.label}</span>
                      ) : (
                        <span>{formatDate(item.created_at)}</span>
                      )}
                    </div>
                    {item.estimated_value && (
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {formatCurrency(item.estimated_value)}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
