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

  // Check for existing packet on load
  useEffect(() => {
    const checkExistingPacket = async () => {
      try {
        const response = await fetch(`/api/purchases/${id}/packet`)
        if (response.ok) {
          const data = await response.json()
          setPacketUrl(data.download_url)
        }
      } catch {
        // No existing packet, that's fine
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
    if (!expiresAt || months === 0) return { label: 'No warranty', expired: false }
    const expires = new Date(expiresAt)
    const now = new Date()
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) {
      return { label: `Expired ${Math.abs(daysLeft)} days ago`, expired: true }
    }
    return { label: `${daysLeft} days remaining`, expired: false }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center py-16">
          <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!purchase) return null

  const warrantyStatus = getWarrantyStatus(purchase.warranty_expires_at, purchase.warranty_months)
  const hasReceipt = purchase.documents.length > 0
  const isPdf = receiptInfo?.file_type === 'application/pdf'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/purchases"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Purchases
      </Link>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Purchase Info */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-2xl font-semibold">{purchase.item_name}</h1>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[var(--muted)] hover:text-[var(--error)] p-2 -m-2"
                title="Delete purchase"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <dl className="space-y-4">
              {purchase.merchant && (
                <div>
                  <dt className="text-sm text-[var(--muted)]">Merchant</dt>
                  <dd className="font-medium">{purchase.merchant}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm text-[var(--muted)]">Purchase Date</dt>
                <dd className="font-medium">{formatDate(purchase.purchase_date)}</dd>
              </div>

              <div>
                <dt className="text-sm text-[var(--muted)]">Warranty</dt>
                <dd className="font-medium">
                  {purchase.warranty_months > 0 ? (
                    <div>
                      <span>{purchase.warranty_months} months</span>
                      <p className={`text-sm mt-1 ${warrantyStatus.expired ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
                        {warrantyStatus.label}
                      </p>
                      {purchase.warranty_expires_at && (
                        <p className="text-sm text-[var(--muted)]">
                          Expires: {formatDate(purchase.warranty_expires_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--muted)]">No warranty</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Claim Packet Section */}
          <div className="card">
            <h2 className="text-lg font-medium mb-4">Claim Packet</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Generate a PDF document with purchase details and receipt for warranty claims.
            </p>

            {packetError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
                {packetError}
              </div>
            )}

            {packetUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
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
                className="btn btn-primary w-full"
              >
                {generatingPacket ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
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

            {hasReceipt && purchase.documents[0]?.file_type === 'application/pdf' && (
              <p className="text-xs text-[var(--muted)] mt-3">
                Note: PDF receipts cannot be embedded in claim packets. Download the receipt separately below.
              </p>
            )}
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Receipt</h2>
          
          {!hasReceipt ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No receipt attached</p>
            </div>
          ) : !receiptUrl ? (
            <button
              onClick={loadReceiptPreview}
              disabled={loadingReceipt}
              className="w-full py-12 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center gap-3"
            >
              {loadingReceipt ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-[var(--primary)]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[var(--muted)]">Loading preview...</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-[var(--primary)] font-medium">View Receipt</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {isPdf ? (
                <div className="text-center py-8 bg-[var(--background)] rounded-lg">
                  <svg className="w-16 h-16 mx-auto mb-3 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium mb-1">{receiptInfo?.file_name}</p>
                  <p className="text-sm text-[var(--muted)]">PDF document</p>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden bg-[var(--background)]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Purchase</h3>
            <p className="text-[var(--muted)] mb-6">
              Are you sure you want to delete &quot;{purchase.item_name}&quot;? This will also delete the attached receipt and any generated claim packets. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn bg-[var(--error)] text-white hover:opacity-90"
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
