'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PurchaseWithDocuments } from '@/lib/types'

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [purchase, setPurchase] = useState<PurchaseWithDocuments | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptInfo, setReceiptInfo] = useState<{ file_type: string; file_name: string } | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    item_name: '',
    merchant: '',
    purchase_date: '',
    warranty_months: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  
  // Packet state
  const [generatingPacket, setGeneratingPacket] = useState(false)
  const [packetUrl, setPacketUrl] = useState<string | null>(null)
  const [packetError, setPacketError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchases/${id}`)
        if (response.ok) {
          const data = await response.json()
          setPurchase(data)
          setEditForm({
            item_name: data.item_name,
            merchant: data.merchant || '',
            purchase_date: data.purchase_date,
            warranty_months: data.warranty_months.toString(),
            notes: data.notes || '',
          })
        } else {
          router.push('/purchases')
        }
      } catch (error) {
        console.error('Failed to fetch purchase:', error)
        router.push('/purchases')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [id, router])

  useEffect(() => {
    const checkExistingPacket = async () => {
      try {
        const response = await fetch(`/api/purchases/${id}/packet`)
        if (response.ok) {
          const data = await response.json()
          setPacketUrl(data.download_url)
        }
      } catch {
        // No existing packet
      }
    }

    if (id) {
      checkExistingPacket()
    }
  }, [id])

  const loadReceiptPreview = async () => {
    if (!purchase?.documents.length) return
    setLoadingReceipt(true)

    try {
      const response = await fetch(`/api/purchases/${id}/signed-url`)
      if (response.ok) {
        const data = await response.json()
        setReceiptUrl(data.url)
        setReceiptInfo({ file_type: data.file_type, file_name: data.file_name })
      }
    } catch (error) {
      console.error('Failed to load receipt:', error)
    } finally {
      setLoadingReceipt(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: editForm.item_name,
          merchant: editForm.merchant || null,
          purchase_date: editForm.purchase_date,
          warranty_months: parseInt(editForm.warranty_months) || 0,
          notes: editForm.notes || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setPurchase(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/purchases')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleGeneratePacket = async () => {
    setGeneratingPacket(true)
    setPacketError(null)

    try {
      const response = await fetch(`/api/purchases/${id}/packet`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate packet')
      }

      setPacketUrl(data.download_url)
    } catch (err) {
      setPacketError(err instanceof Error ? err.message : 'Failed to generate packet')
    } finally {
      setGeneratingPacket(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getWarrantyStatus = (expiresAt: string | null, months: number) => {
    if (!expiresAt || months === 0) return { label: 'No warranty', expired: false, daysLeft: 0 }
    const expires = new Date(expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) {
      return { label: `Expired ${Math.abs(daysLeft)} days ago`, expired: true, daysLeft }
    }
    return { label: `${daysLeft} days remaining`, expired: false, daysLeft }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
            <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          </div>
          <p className="text-[var(--muted)]">Loading purchase...</p>
        </div>
      </div>
    )
  }

  if (!purchase) return null

  const warrantyStatus = getWarrantyStatus(purchase.warranty_expires_at, purchase.warranty_months)
  const hasReceipt = purchase.documents.length > 0
  const isPdf = receiptInfo?.file_type === 'application/pdf'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/purchases"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Purchases
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{purchase.item_name}</h1>
          <div className="flex items-center gap-3 text-[var(--muted)]">
            {purchase.merchant && (
              <>
                <span>{purchase.merchant}</span>
                <span className="text-[var(--border)]">•</span>
              </>
            )}
            <span>{formatDate(purchase.purchase_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-ghost text-[var(--error)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Mode */}
          {isEditing ? (
            <div className="glass p-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Edit Purchase</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Item Name</label>
                  <input
                    type="text"
                    value={editForm.item_name}
                    onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Merchant</label>
                    <input
                      type="text"
                      value={editForm.merchant}
                      onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Purchase Date</label>
                    <input
                      type="date"
                      value={editForm.purchase_date}
                      onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Warranty (months)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.warranty_months}
                    onChange={(e) => setEditForm({ ...editForm, warranty_months: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="input min-h-[100px] resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary flex-1">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="glass p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Purchase Details</h2>
              
              {/* Warranty Status Banner */}
              {purchase.warranty_months > 0 && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-4 ${
                  warrantyStatus.expired
                    ? 'bg-[var(--error)]/10 border border-[var(--error)]/20'
                    : warrantyStatus.daysLeft <= 30
                    ? 'bg-[var(--warning)]/10 border border-[var(--warning)]/20'
                    : 'bg-[var(--success)]/10 border border-[var(--success)]/20'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    warrantyStatus.expired
                      ? 'bg-[var(--error)]/20 text-[var(--error)]'
                      : warrantyStatus.daysLeft <= 30
                      ? 'bg-[var(--warning)]/20 text-[var(--warning)]'
                      : 'bg-[var(--success)]/20 text-[var(--success)]'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      warrantyStatus.expired ? 'text-[var(--error)]' : warrantyStatus.daysLeft <= 30 ? 'text-[var(--warning)]' : 'text-[var(--success)]'
                    }`}>
                      {warrantyStatus.label}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {purchase.warranty_months} month warranty • Expires {formatDate(purchase.warranty_expires_at!)}
                    </p>
                  </div>
                </div>
              )}

              <dl className="grid sm:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-[var(--muted)] mb-1">Merchant</dt>
                  <dd className="font-medium text-[var(--foreground)]">{purchase.merchant || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)] mb-1">Purchase Date</dt>
                  <dd className="font-medium text-[var(--foreground)]">{formatDate(purchase.purchase_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)] mb-1">Warranty Period</dt>
                  <dd className="font-medium text-[var(--foreground)]">
                    {purchase.warranty_months > 0 ? `${purchase.warranty_months} months` : 'No warranty'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)] mb-1">Added</dt>
                  <dd className="font-medium text-[var(--foreground)]">{formatDate(purchase.created_at)}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Claim Packet Section */}
          <div className="glass p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Claim Packet</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Generate a professional PDF document for warranty claims.
            </p>

            {packetError && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] text-sm">
                {packetError}
              </div>
            )}

            {packetUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20">
                  <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--success)]">Claim packet ready</span>
                </div>
                <div className="flex gap-3">
                  <a
                    href={packetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Packet
                  </a>
                  <button
                    onClick={handleGeneratePacket}
                    disabled={generatingPacket}
                    className="btn btn-secondary"
                    title="Regenerate packet"
                  >
                    <svg className={`w-4 h-4 ${generatingPacket ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGeneratePacket}
                disabled={generatingPacket}
                className="btn btn-primary w-full py-3"
              >
                {generatingPacket ? (
                  <>
                    <div className="relative w-5 h-5 mr-2">
                      <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                      <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    </div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Claim Packet
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Receipt */}
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Receipt</h2>
          
          {!hasReceipt ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center">
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm">No receipt attached</p>
            </div>
          ) : !receiptUrl ? (
            <button
              onClick={loadReceiptPreview}
              disabled={loadingReceipt}
              className="w-full py-12 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center gap-3"
            >
              {loadingReceipt ? (
                <>
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
                  </div>
                  <span className="text-[var(--muted)]">Loading...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span className="text-[var(--primary)] font-medium">View Receipt</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {isPdf ? (
                <div className="text-center py-8 bg-[var(--background-secondary)] rounded-xl">
                  <svg className="w-16 h-16 mx-auto mb-3 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium text-[var(--foreground)] mb-1">{receiptInfo?.file_name}</p>
                  <p className="text-sm text-[var(--muted)]">PDF document</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-[var(--background-secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="w-full h-auto"
                  />
                </div>
              )}
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={receiptInfo?.file_name}
                className="btn btn-secondary w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Receipt
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass max-w-md w-full p-6 animate-scale-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--error)]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] text-center mb-2">Delete Purchase</h3>
            <p className="text-[var(--muted)] text-center mb-6">
              Are you sure you want to delete &quot;{purchase.item_name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger flex-1"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
