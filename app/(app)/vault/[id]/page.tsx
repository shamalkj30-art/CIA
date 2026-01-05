'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { VaultItem, VaultLibrary, InsuranceRoom } from '@/lib/types'
import { LIBRARY_CONFIGS, ROOM_CONFIGS } from '@/lib/types'

export default function VaultItemPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [item, setItem] = useState<VaultItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    title: '',
    library: 'receipts' as VaultLibrary,
    room: '' as InsuranceRoom | '',
    tags: '',
    estimated_value: '',
    expires_at: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/vault/${id}`)
        if (response.ok) {
          const data = await response.json()
          setItem(data)
          setFormData({
            title: data.title,
            library: data.library,
            room: data.room || '',
            tags: data.tags?.join(', ') || '',
            estimated_value: data.estimated_value?.toString() || '',
            expires_at: data.expires_at || '',
            notes: data.notes || '',
          })
        } else {
          setError('Document not found')
        }
      } catch (err) {
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/vault/${id}/signed-url`)
      if (response.ok) {
        const data = await response.json()
        // Open download URL in new tab
        window.open(data.url, '_blank')
      } else {
        setError('Failed to generate download URL')
      }
    } catch (err) {
      setError('Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/vault/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          library: formData.library,
          room: formData.room || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
          expires_at: formData.expires_at || null,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setItem(updated)
        setEditing(false)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/vault/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/vault')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{error}</h3>
        <Link href="/vault" className="btn btn-primary mt-4">
          Back to Vault
        </Link>
      </div>
    )
  }

  if (!item) return null

  const libConfig = getLibraryConfig(item.library)
  const roomConfig = getRoomConfig(item.room)
  const isExpiring = item.expires_at && new Date(item.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isExpired = item.expires_at && new Date(item.expires_at) < new Date()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/vault"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Vault
      </Link>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center text-3xl flex-shrink-0">
                {getFileIcon(item.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input text-xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{item.title}</h1>
                )}
                <p className="text-sm text-[var(--text-muted)] truncate">{item.file_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full flex items-center gap-1">
                    {libConfig.icon} {libConfig.label}
                  </span>
                  {roomConfig && (
                    <span className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full flex items-center gap-1">
                      {roomConfig.icon} {roomConfig.label}
                    </span>
                  )}
                  {isExpired ? (
                    <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                      Expired
                    </span>
                  ) : isExpiring ? (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                      Expiring Soon
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="card p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Details</h2>

            {editing ? (
              <div className="space-y-4">
                {/* Library */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Library
                  </label>
                  <select
                    value={formData.library}
                    onChange={(e) => setFormData({ ...formData, library: e.target.value as VaultLibrary })}
                    className="input"
                  >
                    {LIBRARY_CONFIGS.map((lib) => (
                      <option key={lib.id} value={lib.id}>{lib.icon} {lib.label}</option>
                    ))}
                  </select>
                </div>

                {/* Room */}
                {formData.library === 'insurance' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Room
                    </label>
                    <select
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value as InsuranceRoom | '' })}
                      className="input"
                    >
                      <option value="">No room</option>
                      {ROOM_CONFIGS.map((room) => (
                        <option key={room.id} value={room.id}>{room.icon} {room.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Estimated Value */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Estimated Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">kr</span>
                    <input
                      type="number"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                      className="input pl-10"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Comma-separated tags"
                    className="input"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input min-h-[80px] resize-none"
                  />
                </div>
              </div>
            ) : (
              <dl className="space-y-4">
                {item.estimated_value && (
                  <div>
                    <dt className="text-sm text-[var(--text-muted)]">Estimated Value</dt>
                    <dd className="text-lg font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.estimated_value)}
                    </dd>
                  </div>
                )}
                {item.expires_at && (
                  <div>
                    <dt className="text-sm text-[var(--text-muted)]">Expires</dt>
                    <dd className={`font-medium ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                      {formatDate(item.expires_at)}
                    </dd>
                  </div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <dt className="text-sm text-[var(--text-muted)] mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <dt className="text-sm text-[var(--text-muted)]">Notes</dt>
                    <dd className="text-[var(--text-primary)] whitespace-pre-wrap">{item.notes}</dd>
                  </div>
                )}
                {!item.estimated_value && !item.expires_at && (!item.tags || item.tags.length === 0) && !item.notes && (
                  <p className="text-[var(--text-muted)] italic">No additional details</p>
                )}
              </dl>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)]">Actions</h3>

            {editing ? (
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary w-full"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      title: item.title,
                      library: item.library,
                      room: item.room || '',
                      tags: item.tags?.join(', ') || '',
                      estimated_value: item.estimated_value?.toString() || '',
                      expires_at: item.expires_at || '',
                      notes: item.notes || '',
                    })
                  }}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn btn-primary w-full"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-secondary w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>

          {/* File Info */}
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">File Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">File name</dt>
                <dd className="text-[var(--text-primary)] truncate ml-2 max-w-[150px]">{item.file_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Type</dt>
                <dd className="text-[var(--text-primary)]">{item.file_type.split('/')[1]?.toUpperCase() || item.file_type}</dd>
              </div>
              {item.file_size && (
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Size</dt>
                  <dd className="text-[var(--text-primary)]">{formatFileSize(item.file_size)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Added</dt>
                <dd className="text-[var(--text-primary)]">{formatDate(item.created_at)}</dd>
              </div>
              {item.updated_at !== item.created_at && (
                <div className="flex justify-between">
                  <dt className="text-[var(--text-muted)]">Updated</dt>
                  <dd className="text-[var(--text-primary)]">{formatDate(item.updated_at)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-2">
              Delete Document?
            </h3>
            <p className="text-[var(--text-muted)] text-center mb-6">
              This will permanently delete &quot;{item.title}&quot; and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
