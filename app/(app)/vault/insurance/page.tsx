'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { VaultItem, VaultStats, InsuranceRoom } from '@/lib/types'
import { ROOM_CONFIGS } from '@/lib/types'

export default function InsuranceOverviewPage() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch insurance items
        const itemsResponse = await fetch('/api/vault?library=insurance')
        if (itemsResponse.ok) {
          const data = await itemsResponse.json()
          setItems(data)
        }

        // Fetch stats
        const statsResponse = await fetch('/api/vault/stats')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data)
        }

        // Fetch existing packs
        const packsResponse = await fetch('/api/vault/insurance-pack')
        if (packsResponse.ok) {
          const data = await packsResponse.json()
          setPacks(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'kr 0'
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRoomConfig = (room: InsuranceRoom) => {
    return ROOM_CONFIGS.find(r => r.id === room)
  }

  // Get items by room
  const itemsByRoom = ROOM_CONFIGS.reduce((acc, room) => {
    const roomItems = items.filter(item => item.room === room.id)
    const totalValue = roomItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0)
    acc[room.id] = { items: roomItems, totalValue }
    return acc
  }, {} as Record<InsuranceRoom, { items: VaultItem[]; totalValue: number }>)

  // Unassigned items
  const unassignedItems = items.filter(item => !item.room)
  const unassignedValue = unassignedItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading insurance overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/vault"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Vault
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Insurance Overview</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {items.length} documents • {formatCurrency(stats?.total_insurance_value || 0)} total value
          </p>
        </div>
        <Link href="/vault/insurance/pack" className="btn btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Generate Claim Pack
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Total Value</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(stats?.total_insurance_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Documents</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Generated Packs</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{packs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">By Room</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ROOM_CONFIGS.map((room) => {
          const roomData = itemsByRoom[room.id]
          const hasItems = roomData.items.length > 0

          return (
            <Link
              key={room.id}
              href={`/vault?library=insurance&room=${room.id}`}
              className={`card p-4 transition-all hover:shadow-md ${
                hasItems ? 'hover:border-[var(--primary)]' : 'opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-xl">
                  {room.icon}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">{room.label}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {roomData.items.length} {roomData.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border)]">
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatCurrency(roomData.totalValue)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Unassigned Items */}
      {unassignedItems.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Unassigned ({unassignedItems.length})
            </h2>
            <span className="text-sm text-[var(--text-muted)]">
              {formatCurrency(unassignedValue)} value
            </span>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)] mb-3">
              These items don&apos;t have a room assigned. Assign a room for better organization.
            </p>
            <div className="space-y-2">
              {unassignedItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/vault/${item.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
                >
                  <span className="text-[var(--text-primary)]">{item.title}</span>
                  {item.estimated_value && (
                    <span className="text-sm text-[var(--text-muted)]">
                      {formatCurrency(item.estimated_value)}
                    </span>
                  )}
                </Link>
              ))}
              {unassignedItems.length > 5 && (
                <Link
                  href="/vault?library=insurance"
                  className="block text-sm text-[var(--primary)] hover:underline mt-2"
                >
                  View all {unassignedItems.length} unassigned items
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated Packs */}
      {packs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Generated Packs</h2>
          <div className="space-y-3">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">{pack.pack_name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {pack.document_count} documents • {formatCurrency(pack.total_value)} • {formatDate(pack.generated_at)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/api/vault/insurance-pack/${pack.id}`}
                  className="btn btn-secondary text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <span className="text-3xl">🏠</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No insurance documents yet
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            Upload receipts, photos, and documents for your valuable items to be prepared for insurance claims.
          </p>
          <Link href="/vault/upload" className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add your first document
          </Link>
        </div>
      )}
    </div>
  )
}
