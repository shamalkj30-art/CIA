'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'
import { ProofScoreBadge } from '@/components/app'
import { calculateProofScore } from '@/lib/proof-score'

type SortOption = 'newest' | 'oldest' | 'name' | 'expiring'
type FilterOption = 'all' | 'active' | 'expiring' | 'expired' | 'needs_review'
type ViewMode = 'list' | 'grid'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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

  // Detect product category from item name
  const getProductCategory = (itemName: string): string => {
    const name = itemName.toLowerCase()

    // Phones
    if (name.includes('iphone') || name.includes('samsung galaxy') || name.includes('pixel') ||
        name.includes('phone') || name.includes('smartphone') || name.includes('mobile')) {
      return 'phone'
    }

    // Laptops & Computers
    if (name.includes('macbook') || name.includes('laptop') || name.includes('notebook') ||
        name.includes('imac') || name.includes('computer') || name.includes('pc') ||
        name.includes('thinkpad') || name.includes('chromebook') || name.includes('surface')) {
      return 'laptop'
    }

    // TVs & Monitors
    if (name.includes('tv') || name.includes('television') || name.includes('monitor') ||
        name.includes('display') || name.includes('screen') || name.includes('oled') ||
        name.includes('qled')) {
      return 'tv'
    }

    // Cars & Vehicles
    if (name.includes('car') || name.includes('vehicle') || name.includes('auto') ||
        name.includes('porsche') || name.includes('tesla') || name.includes('bmw') ||
        name.includes('mercedes') || name.includes('audi') || name.includes('toyota') ||
        name.includes('honda') || name.includes('ford') || name.includes('volvo') ||
        name.includes('volkswagen') || name.includes('tire') || name.includes('battery')) {
      return 'car'
    }

    // Headphones & Audio
    if (name.includes('headphone') || name.includes('airpods') || name.includes('earbuds') ||
        name.includes('speaker') || name.includes('audio') || name.includes('soundbar') ||
        name.includes('earphone') || name.includes('beats') || name.includes('bose') ||
        name.includes('sony wh') || name.includes('sony wf')) {
      return 'headphones'
    }

    // Watches
    if (name.includes('watch') || name.includes('apple watch') || name.includes('smartwatch') ||
        name.includes('fitbit') || name.includes('garmin')) {
      return 'watch'
    }

    // Cameras
    if (name.includes('camera') || name.includes('gopro') || name.includes('canon') ||
        name.includes('nikon') || name.includes('sony alpha') || name.includes('dslr') ||
        name.includes('mirrorless') || name.includes('lens')) {
      return 'camera'
    }

    // Gaming
    if (name.includes('playstation') || name.includes('xbox') || name.includes('nintendo') ||
        name.includes('switch') || name.includes('ps5') || name.includes('ps4') ||
        name.includes('gaming') || name.includes('controller') || name.includes('console')) {
      return 'gaming'
    }

    // Home Appliances
    if (name.includes('refrigerator') || name.includes('fridge') || name.includes('washer') ||
        name.includes('dryer') || name.includes('dishwasher') || name.includes('microwave') ||
        name.includes('oven') || name.includes('stove') || name.includes('vacuum') ||
        name.includes('air conditioner') || name.includes('heater') || name.includes('appliance')) {
      return 'appliance'
    }

    // Furniture
    if (name.includes('sofa') || name.includes('chair') || name.includes('table') ||
        name.includes('desk') || name.includes('bed') || name.includes('dresser') ||
        name.includes('couch') || name.includes('mattress') || name.includes('furniture') ||
        name.includes('ikea') || name.includes('malm')) {
      return 'furniture'
    }

    // Clothing
    if (name.includes('jacket') || name.includes('shirt') || name.includes('pants') ||
        name.includes('dress') || name.includes('shoes') || name.includes('sneakers') ||
        name.includes('coat') || name.includes('clothing') || name.includes('wear')) {
      return 'clothing'
    }

    // Beauty & Personal Care
    if (name.includes('beauty') || name.includes('skincare') || name.includes('makeup') ||
        name.includes('scalp') || name.includes('hair') || name.includes('cream') ||
        name.includes('serum') || name.includes('lotion') || name.includes('cosmetic')) {
      return 'beauty'
    }

    // Tablets
    if (name.includes('ipad') || name.includes('tablet') || name.includes('galaxy tab')) {
      return 'tablet'
    }

    // Default
    return 'default'
  }

  // Animated product icon component
  const ProductIcon = ({ category, size = 'large' }: { category: string; size?: 'small' | 'large' }) => {
    const iconSize = size === 'large' ? 'w-12 h-12' : 'w-5 h-5'
    const containerSize = size === 'large' ? 'w-full h-full' : 'w-11 h-11'

    const icons: Record<string, React.ReactNode> = {
      phone: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5" className="animate-pulse" />
          <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </line>
          <rect x="8" y="5" width="8" height="10" rx="1" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
          </rect>
        </svg>
      ),
      laptop: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="12" rx="2" strokeWidth="1.5" />
          <path d="M2 20h20" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="6" y="7" width="12" height="6" rx="1" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
          </rect>
          <circle cx="12" cy="10" r="2" strokeWidth="1" opacity="0.5">
            <animate attributeName="r" values="1.5;2;1.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      ),
      tv: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="4" width="20" height="14" rx="2" strokeWidth="1.5" />
          <path d="M8 21h8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 18v3" strokeWidth="1.5" />
          <rect x="5" y="7" width="14" height="8" rx="1" strokeWidth="1" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
          </rect>
        </svg>
      ),
      car: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 17h14v-5l-2-4H7l-2 4v5z" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="7.5" cy="17" r="1.5" strokeWidth="1.5">
            <animate attributeName="r" values="1.5;1.8;1.5" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="16.5" cy="17" r="1.5" strokeWidth="1.5">
            <animate attributeName="r" values="1.5;1.8;1.5" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <path d="M5 12h14" strokeWidth="1" opacity="0.5" />
          <path d="M7 9l1-2h8l1 2" strokeWidth="1" opacity="0.5" />
        </svg>
      ),
      headphones: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 18v-6a9 9 0 0118 0v6" strokeWidth="1.5" />
          <rect x="1" y="14" width="4" height="6" rx="1" strokeWidth="1.5">
            <animate attributeName="height" values="6;7;6" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="19" y="14" width="4" height="6" rx="1" strokeWidth="1.5">
            <animate attributeName="height" values="6;7;6" dur="1s" repeatCount="indefinite" begin="0.5s" />
          </rect>
        </svg>
      ),
      watch: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="7" strokeWidth="1.5" />
          <path d="M12 8v4l2 2" strokeWidth="1.5" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="10s" repeatCount="indefinite" />
          </path>
          <path d="M9 2h6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 22h6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 2v3" strokeWidth="1.5" />
          <path d="M14 2v3" strokeWidth="1.5" />
          <path d="M10 19v3" strokeWidth="1.5" />
          <path d="M14 19v3" strokeWidth="1.5" />
        </svg>
      ),
      camera: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="6" width="20" height="14" rx="2" strokeWidth="1.5" />
          <circle cx="12" cy="13" r="4" strokeWidth="1.5">
            <animate attributeName="r" values="3.5;4;3.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="13" r="2" strokeWidth="1" opacity="0.5" />
          <path d="M6 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeWidth="1.5" />
          <circle cx="17" cy="9" r="1" fill="currentColor">
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      ),
      gaming: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="6" width="20" height="12" rx="4" strokeWidth="1.5" />
          <circle cx="8" cy="12" r="2" strokeWidth="1.5" />
          <circle cx="16" cy="10" r="1" strokeWidth="1.5">
            <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="18" cy="12" r="1" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="16" cy="14" r="1" strokeWidth="1.5">
            <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" begin="0.25s" />
          </circle>
          <circle cx="14" cy="12" r="1" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" begin="0.25s" />
          </circle>
        </svg>
      ),
      appliance: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.5" />
          <line x1="4" y1="14" x2="20" y2="14" strokeWidth="1.5" />
          <rect x="7" y="5" width="10" height="6" rx="1" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
          </rect>
          <circle cx="8" cy="17" r="1" fill="currentColor" />
          <circle cx="12" cy="17" r="1" fill="currentColor">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      ),
      furniture: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 18v-8a2 2 0 012-2h12a2 2 0 012 2v8" strokeWidth="1.5" />
          <path d="M2 18h20" strokeWidth="1.5" />
          <path d="M6 18v2" strokeWidth="1.5" />
          <path d="M18 18v2" strokeWidth="1.5" />
          <path d="M4 12h16" strokeWidth="1" opacity="0.5" />
          <rect x="6" y="8" width="12" height="4" rx="1" strokeWidth="1" opacity="0.3">
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
          </rect>
        </svg>
      ),
      clothing: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2l-4 4h-4l2 6v10h12v-10l2-6h-4l-4-4z" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6c0 2 1.8 4 4 4s4-2 4-4" strokeWidth="1.5" />
          <path d="M12 10v8" strokeWidth="1" opacity="0.3" strokeDasharray="2 2">
            <animate attributeName="stroke-dashoffset" values="0;4" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      ),
      beauty: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2v6" strokeWidth="1.5" />
          <rect x="8" y="8" width="8" height="14" rx="2" strokeWidth="1.5" />
          <ellipse cx="12" cy="4" rx="2" ry="1" strokeWidth="1.5" />
          <path d="M10 12h4" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M10 15h4" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </path>
        </svg>
      ),
      tablet: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.5" />
          <circle cx="12" cy="18" r="1" strokeWidth="1.5">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <rect x="6" y="4" width="12" height="11" rx="1" strokeWidth="1" opacity="0.4">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
          </rect>
        </svg>
      ),
      default: (
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    }

    return (
      <div className={`${containerSize} rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--primary)]`}>
        {icons[category] || icons.default}
      </div>
    )
  }

  // Filter and sort purchases
  const filteredPurchases = purchases
    .filter(p => {
      if (filterBy === 'all') return true
      if (filterBy === 'needs_review') return p.needs_review === true
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
            placeholder="Search by name, merchant..."
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
        <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 border border-[var(--border)] overflow-x-auto">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'expiring', label: 'Expiring' },
            { value: 'expired', label: 'Expired' },
            { value: 'needs_review', label: 'Needs Review' },
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
              {sortBy === 'newest' && 'Newest first'}
              {sortBy === 'oldest' && 'Oldest first'}
              {sortBy === 'name' && 'Name A-Z'}
              {sortBy === 'expiring' && 'Expiring soonest'}
            </span>
            <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Sort Dropdown Menu */}
          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { value: 'newest', label: 'Newest first', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )},
                { value: 'oldest', label: 'Oldest first', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" style={{transform: 'scaleY(-1)'}} />
                  </svg>
                )},
                { value: 'name', label: 'Name A-Z', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                )},
                { value: 'expiring', label: 'Expiring soonest', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
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
                  <span className="text-[var(--text-muted)]">{option.icon}</span>
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
      ) : viewMode === 'list' ? (
        /* Purchases List View */
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
                  <div className="flex-shrink-0">
                    <ProductIcon category={getProductCategory(purchase.item_name)} size="small" />
                  </div>

                  {/* Content */}
                  <Link href={`/purchases/${purchase.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {purchase.item_name}
                      </h3>
                      {(purchase as any).auto_detected && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          Auto
                        </span>
                      )}
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
                      {(purchase as any).return_deadline && new Date((purchase as any).return_deadline) > new Date() && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            Return by {formatDate((purchase as any).return_deadline)}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ProofScoreBadge purchase={purchase} size="sm" />
                    {warrantyStatus && (
                      <span className={`badge ${
                        warrantyStatus.status === 'expired'
                          ? 'badge-error'
                          : warrantyStatus.status === 'warning'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}>
                        {warrantyStatus.label}
                      </span>
                    )}
                  </div>

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
      ) : (
        /* Purchases Grid View */
        <div>
          {/* Results count */}
          <div className="flex items-center gap-3 px-2 mb-4">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredPurchases.length} {filteredPurchases.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPurchases.map((purchase) => {
              const warrantyStatus = getWarrantyStatus(purchase.warranty_expires_at)

              return (
                <Link
                  key={purchase.id}
                  href={`/purchases/${purchase.id}`}
                  className="card p-4 transition-all hover:shadow-lg hover:border-[var(--primary)] group"
                >
                  {/* Product Icon */}
                  <div className="aspect-[4/3] mb-4">
                    <ProductIcon category={getProductCategory(purchase.item_name)} size="large" />
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {purchase.item_name}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {purchase.merchant || 'Unknown merchant'}
                      </p>
                    </div>
                    <ProofScoreBadge purchase={purchase} size="sm" showTooltip={false} />
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mb-2">
                    {warrantyStatus && (
                      <span className={`badge ${
                        warrantyStatus.status === 'expired'
                          ? 'badge-error'
                          : warrantyStatus.status === 'warning'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}>
                        {warrantyStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    {purchase.price && (
                      <>
                        <span className="font-medium text-[var(--text-primary)]">
                          ${purchase.price.toFixed(2)}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatDate(purchase.purchase_date)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
