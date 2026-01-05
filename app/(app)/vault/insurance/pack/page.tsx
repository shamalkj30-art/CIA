'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { VaultItem, VaultStats, InsuranceRoom } from '@/lib/types'
import { ROOM_CONFIGS } from '@/lib/types'

export default function GeneratePackPage() {
  const router = useRouter()

  const [items, setItems] = useState<VaultItem[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [packName, setPackName] = useState('')
  const [selectedRooms, setSelectedRooms] = useState<InsuranceRoom[]>([])
  const [selectAll, setSelectAll] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const itemsResponse = await fetch('/api/vault?library=insurance')
        if (itemsResponse.ok) {
          const data = await itemsResponse.json()
          setItems(data)
        }

        const statsResponse = await fetch('/api/vault/stats')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set default pack name
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
    setPackName(`Insurance Claim Pack - ${dateStr}`)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get items and value by room
  const roomData = ROOM_CONFIGS.reduce((acc, room) => {
    const roomItems = items.filter(item => item.room === room.id)
    const totalValue = roomItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0)
    acc[room.id] = { count: roomItems.length, value: totalValue }
    return acc
  }, {} as Record<InsuranceRoom, { count: number; value: number }>)

  // Calculate selected totals
  const selectedItems = selectAll
    ? items
    : items.filter(item => item.room && selectedRooms.includes(item.room as InsuranceRoom))
  const selectedValue = selectedItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0)

  const toggleRoom = (room: InsuranceRoom) => {
    if (selectAll) {
      setSelectAll(false)
      // Select all rooms except this one
      const allRooms = ROOM_CONFIGS.map(r => r.id)
      setSelectedRooms(allRooms.filter(r => r !== room))
    } else {
      if (selectedRooms.includes(room)) {
        setSelectedRooms(selectedRooms.filter(r => r !== room))
      } else {
        setSelectedRooms([...selectedRooms, room])
      }
    }
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false)
      setSelectedRooms([])
    } else {
      setSelectAll(true)
      setSelectedRooms([])
    }
  }

  const handleGenerate = async () => {
    if (!packName.trim()) {
      setError('Please enter a pack name')
      return
    }

    if (!selectAll && selectedRooms.length === 0) {
      setError('Please select at least one room')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/vault/insurance-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_name: packName,
          rooms: selectAll ? [] : selectedRooms,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Trigger download
        if (data.download_url) {
          window.open(data.download_url, '_blank')
        }
        router.push('/vault/insurance')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate pack')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pack')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/vault/insurance"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Insurance
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Generate Claim Pack</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Create a ZIP file with all your insurance documents
        </p>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No insurance documents
          </h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
            Add some insurance documents to your vault first before generating a claim pack.
          </p>
          <Link href="/vault/upload" className="btn btn-primary">
            Add Documents
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Pack Name */}
          <div className="card p-6">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Pack Name
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="e.g., Home Insurance Claim - January 2026"
              className="input"
            />
          </div>

          {/* Room Selection */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--text-primary)]">Include Rooms</h2>
              <button
                onClick={toggleSelectAll}
                className={`text-sm font-medium transition-colors ${
                  selectAll ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2">
              {ROOM_CONFIGS.map((room) => {
                const data = roomData[room.id]
                const isSelected = selectAll || selectedRooms.includes(room.id)
                const hasItems = data.count > 0

                return (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    disabled={!hasItems}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      !hasItems
                        ? 'border-[var(--border)] opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected && hasItems
                          ? 'border-[var(--primary)] bg-[var(--primary)]'
                          : 'border-[var(--border)]'
                      }`}>
                        {isSelected && hasItems && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xl">{room.icon}</span>
                      <span className={`font-medium ${isSelected && hasItems ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                        {room.label}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">
                        ({data.count} {data.count === 1 ? 'item' : 'items'})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      {formatCurrency(data.value)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Pack Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Documents</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{selectedItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Estimated Value</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(selectedValue)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)]">
                The pack will include:
              </p>
              <ul className="mt-2 text-sm text-[var(--text-secondary)] space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All documents organized by room
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Summary text file with item details
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ZIP format for easy sharing
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/vault/insurance" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              onClick={handleGenerate}
              disabled={generating || selectedItems.length === 0}
              className="btn btn-primary"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Generate & Download
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
