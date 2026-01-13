'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { z } from 'zod'
import {
  DataTable,
  StatusBadge,
  SelectionCheckbox,
  ChartContainer,
  LineChart,
  BarChart,
  ChartPeriodSelector,
  CreateEditModal,
  ConfirmDialog,
  EmptyState,
  ErrorState,
} from '@/components/dashboard'
import { useToast } from '@/components/providers/ToastProvider'
import { ColumnDef } from '@tanstack/react-table'

// Types
interface Purchase {
  id: string
  item_name: string
  merchant: string
  price: number
  purchase_date: string
  warranty_expires_at: string | null
  return_deadline: string | null
  status: string
  needs_review: boolean
  created_at: string
  category?: string
}

interface Subscription {
  id: string
  merchant: string
  price: number
  status: string
  billing_cycle: string
  next_charge_date: string | null
}

// Schema for creating new purchase
const purchaseSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  merchant: z.string().min(1, 'Merchant is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  warranty_expires_at: z.string().optional(),
})

type PurchaseFormData = z.infer<typeof purchaseSchema>

// API Functions
async function fetchPurchases(): Promise<Purchase[]> {
  const res = await fetch('/api/purchases')
  if (!res.ok) throw new Error('Failed to fetch purchases')
  return res.json()
}

async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch('/api/subscriptions')
  if (!res.ok) return []
  return res.json()
}

async function createPurchase(data: PurchaseFormData): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create purchase')
  return res.json()
}

async function deletePurchases(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(id =>
      fetch(`/api/purchases/${id}`, { method: 'DELETE' })
    )
  )
}

// Generate chart data
function generateChartData(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      purchases: Math.floor(Math.random() * 5) + 1,
      value: Math.floor(Math.random() * 500) + 100,
    })
  }
  return data
}

function generateCategoryData() {
  return [
    { category: 'Electronics', count: 12, value: 2400 },
    { category: 'Appliances', count: 8, value: 1800 },
    { category: 'Furniture', count: 5, value: 1200 },
    { category: 'Clothing', count: 15, value: 600 },
    { category: 'Other', count: 10, value: 800 },
  ]
}

// Dashboard tabs
const tabs = [
  { id: 'activity', label: 'Activity' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'warranties', label: 'Warranties' },
  { id: 'returns', label: 'Returns' },
]

// History filter tabs
const historyFilters = [
  { id: 'all', label: 'All History' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'return', label: 'Return' },
  { id: 'subscription', label: 'Subscription' },
]

// Skeleton components
function CardSkeleton() {
  return (
    <div className="bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[var(--surface-subtle)]" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-[var(--surface-subtle)] rounded w-3/4" />
        <div className="h-3 bg-[var(--surface-subtle)] rounded w-1/2" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-[var(--surface-subtle)] rounded-xl" />
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-[var(--surface-subtle)] rounded-lg w-48" />
        <div className="h-4 bg-[var(--surface-subtle)] rounded w-64" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-[var(--surface-subtle)] rounded-lg" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>

      {/* Table skeleton */}
      <div className="bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl p-6">
        <TableSkeleton />
      </div>
    </div>
  )
}

// Activity Card component (like Live Auctions)
function ActivityCard({ purchase, type }: { purchase: Purchase; type: 'warranty' | 'return' | 'new' }) {
  const now = new Date()
  let deadline: Date | null = null
  let daysLeft = 0
  let statusColor = 'bg-[var(--primary)]'
  let statusText = 'Active'

  if (type === 'warranty' && purchase.warranty_expires_at) {
    deadline = new Date(purchase.warranty_expires_at)
    daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7) {
      statusColor = 'bg-[var(--danger)]'
      statusText = 'Ending Soon'
    } else if (daysLeft <= 30) {
      statusColor = 'bg-[var(--warning)]'
      statusText = 'Expiring'
    }
  } else if (type === 'return' && purchase.return_deadline) {
    deadline = new Date(purchase.return_deadline)
    daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 3) {
      statusColor = 'bg-[var(--danger)]'
      statusText = 'Ending Soon'
    } else if (daysLeft <= 7) {
      statusColor = 'bg-[var(--warning)]'
      statusText = 'Limited Time'
    }
  } else if (type === 'new') {
    statusColor = 'bg-[var(--success)]'
    statusText = 'New'
  }

  // Get category icon
  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'electronics':
        return '💻'
      case 'appliances':
        return '🔌'
      case 'furniture':
        return '🪑'
      case 'clothing':
        return '👕'
      default:
        return '📦'
    }
  }

  return (
    <Link
      href={`/purchases/${purchase.id}`}
      className="group bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl overflow-hidden hover:border-[var(--primary)]/50 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300"
    >
      {/* Image/Icon area */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--surface-subtle)] to-[var(--surface)] flex items-center justify-center">
        <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">
          {getCategoryIcon(purchase.category)}
        </span>

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 ${statusColor} text-white text-xs font-semibold rounded-lg flex items-center gap-1.5`}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          {statusText}
        </div>

        {/* Countdown */}
        {deadline && daysLeft > 0 && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-mono rounded-lg">
            {daysLeft}d left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
          {purchase.item_name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-[var(--text-muted)]">{purchase.merchant}</span>
          <span className="font-semibold text-[var(--text-primary)]">
            ${purchase.price?.toLocaleString() || '0'}
          </span>
        </div>
      </div>
    </Link>
  )
}

// Subscription Card component
function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const chargeDate = subscription.next_charge_date ? new Date(subscription.next_charge_date) : null
  const daysUntil = chargeDate
    ? Math.ceil((chargeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  let urgencyColor = 'text-[var(--text-muted)]'
  if (daysUntil !== null) {
    if (daysUntil <= 1) urgencyColor = 'text-[var(--danger)]'
    else if (daysUntil <= 3) urgencyColor = 'text-[var(--warning)]'
  }

  // Service colors
  const serviceColors: Record<string, string> = {
    'netflix': 'from-red-500 to-red-600',
    'spotify': 'from-green-500 to-green-600',
    'youtube': 'from-red-500 to-red-700',
    'disney': 'from-blue-500 to-blue-700',
    'apple': 'from-gray-500 to-gray-700',
    'amazon': 'from-orange-500 to-orange-600',
  }

  const serviceName = subscription.merchant.toLowerCase()
  const gradient = Object.entries(serviceColors).find(([key]) => serviceName.includes(key))?.[1] || 'from-[var(--primary)] to-purple-500'

  return (
    <Link
      href={`/subscriptions/${subscription.id}`}
      className="group bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl overflow-hidden hover:border-[var(--primary)]/50 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--surface-subtle)] to-[var(--surface)] flex items-center justify-center">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-white font-bold text-2xl">{subscription.merchant.charAt(0).toUpperCase()}</span>
        </div>

        {/* Charge badge */}
        {daysUntil !== null && daysUntil <= 7 && (
          <div className={`absolute top-3 left-3 px-2.5 py-1 ${daysUntil <= 1 ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'} text-white text-xs font-semibold rounded-lg`}>
            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil}d`}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
          {subscription.merchant}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-[var(--text-muted)] capitalize">{subscription.billing_cycle}</span>
          <span className="font-semibold text-[var(--text-primary)]">
            ${subscription.price?.toFixed(2)}
          </span>
        </div>
        {chargeDate && (
          <p className={`text-xs mt-2 ${urgencyColor}`}>
            Charges {daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : chargeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('activity')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Purchase[]>([])
  const [chartPeriod, setChartPeriod] = useState('30d')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Queries
  const {
    data: purchases = [],
    isLoading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
  })

  const {
    data: subscriptions = [],
    isLoading: subscriptionsLoading,
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPurchase,
    onMutate: async (newPurchase) => {
      await queryClient.cancelQueries({ queryKey: ['purchases'] })
      const previousPurchases = queryClient.getQueryData(['purchases'])

      queryClient.setQueryData(['purchases'], (old: Purchase[] = []) => [
        {
          id: 'temp-' + Date.now(),
          ...newPurchase,
          status: 'active',
          needs_review: false,
          created_at: new Date().toISOString(),
        },
        ...old,
      ])

      return { previousPurchases }
    },
    onError: (err, newPurchase, context) => {
      queryClient.setQueryData(['purchases'], context?.previousPurchases)
      toast.error('Failed to create purchase', err.message)
    },
    onSuccess: () => {
      toast.success('Purchase created', 'Your new purchase has been added.')
      setCreateModalOpen(false)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePurchases,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['purchases'] })
      const previousPurchases = queryClient.getQueryData(['purchases'])

      queryClient.setQueryData(['purchases'], (old: Purchase[] = []) =>
        old.filter(p => !ids.includes(p.id))
      )

      return { previousPurchases }
    },
    onError: (err, ids, context) => {
      queryClient.setQueryData(['purchases'], context?.previousPurchases)
      toast.error('Failed to delete', 'Could not delete the selected items.')
    },
    onSuccess: (_, ids) => {
      toast.success('Deleted', `${ids.length} item(s) have been removed.`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      setSelectedForDelete([])
    },
  })

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    let activeWarranties = 0
    let expiringSoon = 0
    let totalValue = 0
    let needsReview = 0
    const recentPurchases: Purchase[] = []
    const expiringItems: Purchase[] = []
    const returnDeadlines: Purchase[] = []

    purchases.forEach((p) => {
      if (p.price) totalValue += p.price
      if (p.needs_review) needsReview++

      // Recent (last 7 days)
      const createdAt = new Date(p.created_at)
      const daysSinceCreated = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceCreated <= 7) recentPurchases.push(p)

      // Warranties
      if (p.warranty_expires_at) {
        const expiresAt = new Date(p.warranty_expires_at)
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft > 0) {
          activeWarranties++
          if (daysLeft <= 30) {
            expiringSoon++
            expiringItems.push(p)
          }
        }
      }

      // Return deadlines
      if (p.return_deadline) {
        const deadline = new Date(p.return_deadline)
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft > 0 && daysLeft <= 14) {
          returnDeadlines.push(p)
        }
      }
    })

    return {
      totalItems: purchases.length,
      activeWarranties,
      expiringSoon,
      totalValue,
      needsReview,
      recentPurchases,
      expiringItems,
      returnDeadlines,
    }
  }, [purchases])

  // Chart data
  const chartData = useMemo(() => {
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : chartPeriod === '90d' ? 90 : 365
    return generateChartData(days)
  }, [chartPeriod])

  const categoryData = useMemo(() => generateCategoryData(), [])

  // Filtered history data
  const historyData = useMemo(() => {
    let filtered = [...purchases]
    if (historyFilter === 'warranty') {
      filtered = purchases.filter(p => p.warranty_expires_at)
    } else if (historyFilter === 'return') {
      filtered = purchases.filter(p => p.return_deadline)
    } else if (historyFilter === 'purchase') {
      filtered = purchases.slice(0, 20)
    }
    return filtered.slice(0, 10)
  }, [purchases, historyFilter])

  // Table columns
  const columns = useMemo<ColumnDef<Purchase>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <SelectionCheckbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          indeterminate={table.getIsSomePageRowsSelected()}
        />
      ),
      cell: ({ row }) => (
        <SelectionCheckbox
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: 'Event',
      cell: ({ row }) => {
        const hasWarranty = row.original.warranty_expires_at
        const hasReturn = row.original.return_deadline
        return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
            hasReturn ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
            hasWarranty ? 'bg-[var(--primary)]/10 text-[var(--primary)]' :
            'bg-[var(--success)]/10 text-[var(--success)]'
          }`}>
            {hasReturn ? 'Return' : hasWarranty ? 'Warranty' : 'Purchase'}
          </span>
        )
      },
    },
    {
      accessorKey: 'item_name',
      header: 'Item',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-lg">
            {row.original.category === 'electronics' ? '💻' :
             row.original.category === 'appliances' ? '🔌' :
             row.original.category === 'furniture' ? '🪑' : '📦'}
          </div>
          <div>
            <Link
              href={`/purchases/${row.original.id}`}
              className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
            >
              {row.original.item_name}
            </Link>
            <p className="text-xs text-[var(--text-muted)]">{row.original.merchant}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-semibold text-[var(--text-primary)]">
          ${row.original.price?.toLocaleString() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'purchase_date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-[var(--text-secondary)]">
          {row.original.purchase_date
            ? new Date(row.original.purchase_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      id: 'link',
      header: 'Link',
      cell: ({ row }) => (
        <Link
          href={`/purchases/${row.original.id}`}
          className="text-[var(--primary)] hover:underline text-sm truncate max-w-[200px] block"
        >
          View details →
        </Link>
      ),
    },
  ], [])

  // Handle bulk delete
  const handleBulkDelete = (rows: Purchase[]) => {
    setSelectedForDelete(rows)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    const ids = selectedForDelete.map(p => p.id)
    deleteMutation.mutate(ids)
    setDeleteDialogOpen(false)
  }

  const isLoading = purchasesLoading || subscriptionsLoading

  if (isLoading) {
    return <PageSkeleton />
  }

  if (purchasesError) {
    return (
      <ErrorState
        message="Unable to load dashboard data. Please try again."
        retry={() => refetchPurchases()}
      />
    )
  }

  // Get items for current tab
  const getActivityItems = () => {
    switch (activeTab) {
      case 'warranties':
        return stats.expiringItems
      case 'returns':
        return stats.returnDeadlines
      case 'purchases':
        return purchases.slice(0, 8)
      default:
        return [
          ...stats.returnDeadlines.slice(0, 2),
          ...stats.expiringItems.slice(0, 2),
          ...stats.recentPurchases.slice(0, 4),
        ].slice(0, 8)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-heading">Overview</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Track your purchases, warranties, and subscriptions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Create button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-xl hover:bg-[var(--primary-hover)] transition-colors shadow-lg shadow-[var(--primary)]/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.id === 'warranties' && stats.expiringSoon > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {stats.expiringSoon}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Activity Cards / Live Items Section */}
      {activeTab !== 'subscriptions' ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {activeTab === 'activity' ? 'Attention Needed' :
               activeTab === 'warranties' ? 'Expiring Warranties' :
               activeTab === 'returns' ? 'Return Deadlines' :
               'Recent Purchases'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Sort:</span>
              <select className="bg-transparent text-sm text-[var(--text-primary)] border-none focus:outline-none cursor-pointer">
                <option>Date</option>
                <option>Value</option>
                <option>Name</option>
              </select>
            </div>
          </div>

          {getActivityItems().length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getActivityItems().map((item) => (
                <ActivityCard
                  key={item.id}
                  purchase={item}
                  type={
                    item.return_deadline ? 'return' :
                    item.warranty_expires_at ? 'warranty' :
                    'new'
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl">
              <p className="text-[var(--text-muted)]">No items to display</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 text-[var(--primary)] font-medium hover:underline"
              >
                Add your first purchase
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Subscriptions Grid */
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Subscriptions</h2>
            <Link href="/subscriptions" className="text-sm text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>

          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subscriptions.filter(s => s.status === 'active').slice(0, 8).map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl">
              <p className="text-[var(--text-muted)]">No subscriptions tracked</p>
              <Link href="/subscriptions" className="mt-4 text-[var(--primary)] font-medium hover:underline block">
                Add a subscription
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Purchase Activity"
          subtitle="Purchases over time"
          action={
            <ChartPeriodSelector
              value={chartPeriod}
              onChange={setChartPeriod}
            />
          }
        >
          <LineChart
            data={chartData}
            xKey="date"
            lines={[
              { key: 'purchases', color: 'var(--primary)', name: 'Purchases' },
            ]}
            height={240}
          />
        </ChartContainer>

        <ChartContainer
          title="Categories"
          subtitle="Items by category"
        >
          <BarChart
            data={categoryData}
            xKey="category"
            bars={[
              { key: 'count', color: 'var(--primary)', name: 'Items' },
            ]}
            height={240}
          />
        </ChartContainer>
      </div>

      {/* Recent History Table */}
      <section className="bg-[var(--surface)]/60 backdrop-blur-sm border border-[var(--border)]/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent History</h2>

            {/* History filter tabs */}
            <div className="flex items-center gap-1 bg-[var(--surface-subtle)] rounded-xl p-1">
              {historyFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setHistoryFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    historyFilter === filter.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {historyData.length > 0 ? (
            <DataTable
              data={historyData}
              columns={columns}
              searchPlaceholder="Search history..."
              bulkActions={[
                {
                  label: 'Delete',
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ),
                  onClick: handleBulkDelete,
                  variant: 'danger',
                },
              ]}
              emptyState={
                <EmptyState
                  title="No history yet"
                  description="Start tracking your purchases to see your history here."
                  action={{
                    label: 'Add your first purchase',
                    onClick: () => setCreateModalOpen(true),
                  }}
                />
              }
            />
          ) : (
            <EmptyState
              title="No history yet"
              description="Start tracking your purchases to see your history here."
              action={{
                label: 'Add your first purchase',
                onClick: () => setCreateModalOpen(true),
              }}
            />
          )}
        </div>

        {historyData.length > 0 && (
          <div className="px-6 pb-6">
            <Link
              href="/purchases"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              View all purchases →
            </Link>
          </div>
        )}
      </section>

      {/* Create Modal */}
      <CreateEditModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Add New Purchase"
        description="Track a new purchase or warranty"
        schema={purchaseSchema}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        fields={[
          {
            name: 'item_name',
            label: 'Item Name',
            placeholder: 'e.g., MacBook Pro 14"',
            required: true,
          },
          {
            name: 'merchant',
            label: 'Merchant',
            placeholder: 'e.g., Apple Store',
            required: true,
          },
          {
            name: 'price',
            label: 'Price',
            type: 'number',
            placeholder: '0.00',
            required: true,
          },
          {
            name: 'purchase_date',
            label: 'Purchase Date',
            type: 'date',
            required: true,
          },
          {
            name: 'warranty_expires_at',
            label: 'Warranty Expiry',
            type: 'date',
            hint: 'Leave empty if no warranty',
          },
        ]}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete purchases?"
        description={`Are you sure you want to delete ${selectedForDelete.length} purchase(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
